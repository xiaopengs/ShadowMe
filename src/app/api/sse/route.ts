/**
 * SSE (Server-Sent Events) API Route
 * Provides real-time event streaming to clients
 */

import { NextRequest } from 'next/server';
import { createSSEConnection, removeClient, updateSubscriptions, getConnectionStats } from '@/lib/sse-manager';
import { logger } from '@/lib/logger';

const sseLogger = logger.child({ module: 'api/sse' });

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Parse requested subscriptions from query params
  const channelsParam = searchParams.get('channels');
  const subscriptions = channelsParam 
    ? channelsParam.split(',') as any[]
    : ['task', 'shadow', 'stats'];
  
  // Validate channels
  const validChannels = ['task', 'shadow', 'stats', 'messages'];
  const validSubscriptions = subscriptions.filter(ch => validChannels.includes(ch));
  
  // If task or messages specified, add specific channels too
  if (channelsParam?.includes('task')) {
    validSubscriptions.push('task');
  }
  if (channelsParam?.includes('messages')) {
    validSubscriptions.push('messages');
  }

  // Create SSE stream
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Create client connection
      const client = createSSEConnection(controller, validSubscriptions);
      
      sseLogger.info('SSE connection established', { 
        clientId: client.id,
        subscriptions: validSubscriptions 
      });

      // Set up heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const encoder = new TextEncoder();
          const heartbeat = encoder.encode(`: heartbeat\n\n`);
          controller.enqueue(heartbeat);
        } catch {
          // Connection closed
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30 second heartbeat

      // Handle connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        removeClient(client.id);
        sseLogger.info('SSE connection closed', { clientId: client.id });
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * POST endpoint for client to subscribe to specific task channels
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, channels } = body;

    if (!clientId || !channels || !Array.isArray(channels)) {
      return Response.json(
        { error: 'Missing clientId or channels array' },
        { status: 400 }
      );
    }

    const success = updateSubscriptions(clientId, channels);
    
    if (!success) {
      return Response.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return Response.json({ success: true, channels });
  } catch (error) {
    sseLogger.error('Error updating subscriptions', error);
    return Response.json(
      { error: 'Failed to update subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for connection statistics
 */
export async function HEAD() {
  const stats = getConnectionStats();
  
  return new Response(null, {
    headers: {
      'X-Client-Count': String(stats.totalClients),
    },
  });
}
