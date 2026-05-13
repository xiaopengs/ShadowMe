/**
 * SSE (Server-Sent Events) Connection Manager
 * Manages real-time connections for pushing updates to clients
 */

import { logger } from './logger';

const sseLogger = logger.child({ module: 'sse-manager' });

export interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
  subscriptions: Set<SSEChannel>;
  connectedAt: Date;
}

export type SSEChannel = 
  | 'task'           // Task updates (all tasks)
  | 'task:${string}' // Specific task updates
  | 'shadow'         // Shadow status updates
  | 'stats'          // Dashboard statistics updates
  | 'messages'       // Chat messages
  | 'messages:${string}' // Task-specific messages
  | 'webhook'        // Webhook events
  | 'system';       // System-wide events

export interface SSEMessage {
  channel: SSEChannel;
  event: string;
  data: unknown;
  timestamp: string;
}

// Global client registry
const clients = new Map<string, SSEClient>();

// Channel subscribers
const channelSubscribers = new Map<SSEChannel, Set<string>>();

// Encoder for SSE format
const encoder = new TextEncoder();

/**
 * Generate a unique client ID
 */
function generateClientId(): string {
  return `sse-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format SSE message according to the SSE spec
 */
function formatSSEMessage(event: string, data: unknown): Uint8Array {
  const message: SSEMessage = {
    channel: event as SSEChannel,
    event,
    data,
    timestamp: new Date().toISOString(),
  };
  
  const content = `event: ${event}\ndata: ${JSON.stringify(message)}\n\n`;
  return encoder.encode(content);
}

/**
 * Create a new SSE connection
 */
export function createSSEConnection(
  controller: ReadableStreamDefaultController<Uint8Array>,
  subscriptions: SSEChannel[] = ['task', 'shadow', 'stats']
): SSEClient {
  const clientId = generateClientId();
  
  const client: SSEClient = {
    id: clientId,
    controller,
    subscriptions: new Set(subscriptions),
    connectedAt: new Date(),
  };
  
  clients.set(clientId, client);
  
  // Subscribe to channels
  for (const channel of subscriptions) {
    if (!channelSubscribers.has(channel)) {
      channelSubscribers.set(channel, new Set());
    }
    channelSubscribers.get(channel)!.add(clientId);
  }
  
  // Send welcome message
  const welcomeData = formatSSEMessage('connected', {
    clientId,
    message: 'SSE connection established',
    channels: subscriptions,
    timestamp: new Date().toISOString(),
  });
  
  try {
    controller.enqueue(welcomeData);
  } catch {
    // Client might have disconnected
    removeClient(clientId);
  }
  
  sseLogger.info('New SSE client connected', { 
    clientId, 
    subscriptions,
    totalClients: clients.size 
  });
  
  return client;
}

/**
 * Remove a client from the registry
 */
export function removeClient(clientId: string): void {
  const client = clients.get(clientId);
  if (!client) return;
  
  // Unsubscribe from all channels
  for (const channel of client.subscriptions) {
    const subscribers = channelSubscribers.get(channel);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        channelSubscribers.delete(channel);
      }
    }
  }
  
  clients.delete(clientId);
  sseLogger.info('SSE client disconnected', { 
    clientId, 
    totalClients: clients.size 
  });
}

/**
 * Update client's subscriptions
 */
export function updateSubscriptions(clientId: string, channels: SSEChannel[]): boolean {
  const client = clients.get(clientId);
  if (!client) return false;
  
  // Remove from old channels
  for (const channel of client.subscriptions) {
    const subscribers = channelSubscribers.get(channel);
    if (subscribers) {
      subscribers.delete(clientId);
    }
  }
  
  // Add to new channels
  client.subscriptions.clear();
  for (const channel of channels) {
    client.subscriptions.add(channel);
    if (!channelSubscribers.has(channel)) {
      channelSubscribers.set(channel, new Set());
    }
    channelSubscribers.get(channel)!.add(clientId);
  }
  
  sseLogger.debug('Client subscriptions updated', { clientId, channels });
  return true;
}

/**
 * Broadcast message to all clients subscribed to a channel
 */
export function broadcastToChannel(channel: SSEChannel, event: string, data: unknown): number {
  const subscribers = channelSubscribers.get(channel);
  if (!subscribers || subscribers.size === 0) {
    return 0;
  }
  
  const message = formatSSEMessage(event, data);
  let successCount = 0;
  
  for (const clientId of subscribers) {
    const client = clients.get(clientId);
    if (client) {
      try {
        client.controller.enqueue(message);
        successCount++;
      } catch {
        // Client disconnected, remove from registry
        removeClient(clientId);
      }
    }
  }
  
  sseLogger.debug('Broadcast sent', { 
    channel, 
    event,
    totalSubscribers: subscribers.size,
    successCount 
  });
  
  return successCount;
}

/**
 * Send message to a specific client
 */
export function sendToClient(clientId: string, event: string, data: unknown): boolean {
  const client = clients.get(clientId);
  if (!client) return false;
  
  const message = formatSSEMessage(event, data);
  
  try {
    client.controller.enqueue(message);
    return true;
  } catch {
    removeClient(clientId);
    return false;
  }
}

/**
 * Broadcast to multiple channels
 */
export function broadcast(event: string, data: unknown, channels?: SSEChannel[]): number {
  if (channels) {
    return channels.reduce((sum, ch) => sum + broadcastToChannel(ch, event, data), 0);
  }
  
  // Broadcast to all channels
  let total = 0;
  for (const channel of channelSubscribers.keys()) {
    total += broadcastToChannel(channel, event, data);
  }
  return total;
}

/**
 * Get current connection stats
 */
export function getConnectionStats(): {
  totalClients: number;
  channelStats: Record<string, number>;
} {
  const channelStats: Record<string, number> = {};
  
  for (const [channel, subscribers] of channelSubscribers) {
    channelStats[channel] = subscribers.size;
  }
  
  return {
    totalClients: clients.size,
    channelStats,
  };
}

/**
 * Check if SSE is supported (for client-side fallback decision)
 */
export function isSSEAvailable(): boolean {
  // SSE is supported in all modern browsers
  // This can be extended to check specific conditions
  return typeof ReadableStream !== 'undefined';
}

// Cleanup stale connections periodically
const CLEANUP_INTERVAL = 60000; // 1 minute

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes
    
    for (const [clientId, client] of clients) {
      if (now - client.connectedAt.getTime() > staleThreshold) {
        sseLogger.debug('Removing stale SSE client', { clientId });
        removeClient(clientId);
      }
    }
  }, CLEANUP_INTERVAL);
}
