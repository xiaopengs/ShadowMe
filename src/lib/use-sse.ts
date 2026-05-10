/**
 * SSE Client Hook for React components
 * Provides a clean interface for connecting to SSE streams
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SSEMessage<T = unknown> {
  channel: string;
  event: string;
  data: T;
  timestamp: string;
}

export interface SSEOptions {
  /** Channels to subscribe to (comma-separated) */
  channels?: string[];
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Reconnect on error (default: true) */
  autoReconnect?: boolean;
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Maximum reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Callback when connection opens */
  onOpen?: () => void;
  /** Callback when connection closes */
  onClose?: () => void;
  /** Callback on error */
  onError?: (error: Event) => void;
  /** Event handlers by event name */
  handlers?: Record<string, (data: SSEMessage) => void>;
}

export interface UseSSEReturn {
  /** Whether SSE is currently connected */
  isConnected: boolean;
  /** Connection status */
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  /** Manual connect function */
  connect: () => void;
  /** Manual disconnect function */
  disconnect: () => void;
  /** Subscribe to a custom event */
  on: <T>(event: string, handler: (data: SSEMessage<T>) => void) => () => void;
  /** Emit an event locally (not sent to server) */
  emit: <T>(event: string, data: T) => void;
  /** Get statistics */
  getStats: () => { totalEvents: number; lastEvent: string | null };
}

export function useSSE(options: SSEOptions = {}): UseSSEReturn {
  const {
    channels = ['task', 'shadow', 'stats', 'messages'],
    autoConnect = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onClose,
    onError,
    handlers = {},
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  
  // Event handlers registry
  const handlersRef = useRef<Record<string, Set<(data: SSEMessage) => void>>>({});
  
  // Event counter for stats
  const eventCountRef = useRef(0);
  const lastEventTimeRef = useRef<string | null>(null);

  // Register initial handlers
  useEffect(() => {
    Object.entries(handlers).forEach(([event, handler]) => {
      registerHandler(event, handler as (data: SSEMessage) => void);
    });
  }, [handlers]);

  const registerHandler = useCallback((event: string, handler: (data: SSEMessage) => void) => {
    if (!handlersRef.current[event]) {
      handlersRef.current[event] = new Set();
    }
    handlersRef.current[event].add(handler);
    
    // Return cleanup function
    return () => {
      handlersRef.current[event]?.delete(handler);
    };
  }, []);

  const handleEvent = useCallback((eventName: string, event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as SSEMessage;
      
      // Track statistics
      eventCountRef.current++;
      lastEventTimeRef.current = data.timestamp;
      
      // Call registered handlers
      const eventHandlers = handlersRef.current[eventName];
      if (eventHandlers) {
        eventHandlers.forEach(handler => {
          try {
            handler(data);
          } catch (err) {
            console.error(`Error in SSE handler for ${eventName}:`, err);
          }
        });
      }
      
      // Also call generic 'message' handler
      const genericHandlers = handlersRef.current['message'];
      if (genericHandlers) {
        genericHandlers.forEach(handler => handler(data));
      }
    } catch (err) {
      console.error('Error parsing SSE message:', err);
    }
  }, []);

  const connect = useCallback(() => {
    // Check SSE support
    if (typeof EventSource === 'undefined') {
      console.warn('SSE is not supported in this browser');
      setStatus('error');
      return;
    }

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setStatus('connecting');
    
    const channelParam = channels.join(',');
    const eventSource = new EventSource(`/api/sse?channels=${channelParam}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus('connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      onOpen?.();
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setStatus('error');
      setIsConnected(false);
      onError?.(error);
      onClose?.();

      // Auto-reconnect logic
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        console.log(`SSE reconnecting... attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('Max SSE reconnect attempts reached');
      }
    };

    // Add event listeners for common events
    const eventsToListen = ['connected', 'message:new', 'message:log', 'task:updated', 'task:progress', 'task:completed', 'task:error', 'shadow:status', 'shadow:heartbeat', 'stats:updated'];
    
    eventsToListen.forEach(eventName => {
      eventSource.addEventListener(eventName, (event) => handleEvent(eventName, event));
    });

  }, [channels, autoReconnect, reconnectDelay, maxReconnectAttempts, handleEvent, onOpen, onError, onClose]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setStatus('disconnected');
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
    onClose?.();
  }, [onClose]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Subscribe to custom events
  const on = useCallback(<T,>(event: string, handler: (data: SSEMessage<T>) => void) => {
    return registerHandler(event, handler as (data: SSEMessage) => void);
  }, [registerHandler]);

  // Emit local event (not sent to server)
  const emit = useCallback(<T,>(event: string, data: T) => {
    const message: SSEMessage = {
      channel: 'local',
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    
    // Trigger handlers directly
    const eventHandlers = handlersRef.current[event];
    if (eventHandlers) {
      eventHandlers.forEach(handler => handler(message));
    }
  }, []);

  // Get stats
  const getStats = useCallback(() => {
    return {
      totalEvents: eventCountRef.current,
      lastEvent: lastEventTimeRef.current,
    };
  }, []);

  return {
    isConnected,
    status,
    connect,
    disconnect,
    on,
    emit,
    getStats,
  };
}

/**
 * Hook for subscribing to specific task messages
 */
interface TaskSSEData {
  taskId: string;
  type: string;
  content?: string;
  messageId?: string;
  status?: string;
  result?: any;
  log?: string;
  timestamp?: string;
}

export function useTaskSSE(taskId: string) {
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [task, setTask] = useState<Record<string, unknown> | null>(null);
  
  const sse = useSSE({
    channels: ['messages', 'task'],
    autoConnect: true,
    autoReconnect: true,
    handlers: {
      'message:new': (data) => {
        const msgData = data.data as TaskSSEData;
        if (msgData.taskId === taskId) {
          setMessages((prev) => {
            // Avoid duplicates
            if (msgData.messageId && prev.some(m => (m.data as TaskSSEData).messageId === msgData.messageId)) return prev;
            return [...prev, data];
          });
        }
      },
      'message:log': (data) => {
        const msgData = data.data as TaskSSEData;
        if (msgData.taskId === taskId) {
          setMessages((prev) => [...prev, data]);
        }
      },
      'task:updated': (data) => {
        const taskData = data.data as TaskSSEData;
        if (taskData.taskId === taskId) {
          setTask((prev) => prev ? { ...prev, status: taskData.status } : null);
        }
      },
      'task:completed': (data) => {
        const taskData = data.data as TaskSSEData;
        if (taskData.taskId === taskId) {
          setTask((prev) => prev ? { ...prev, status: 'completed', result: taskData.result } : null);
        }
      },
    },
  });

  return {
    messages,
    task,
    setTask,
    ...sse,
  };
}

/**
 * Hook for shadow status updates
 */
interface ShadowSSEData {
  status: string;
  currentTaskId?: string;
  message?: string;
  capabilities?: string[];
  lastHeartbeat?: string;
}

export function useShadowSSE() {
  const [shadowStatus, setShadowStatus] = useState<ShadowSSEData | null>(null);
  
  const sse = useSSE({
    channels: ['shadow', 'stats'],
    autoConnect: true,
    handlers: {
      'shadow:status': (data) => {
        setShadowStatus(data.data as ShadowSSEData);
      },
      'shadow:heartbeat': (data) => {
        setShadowStatus(data.data as ShadowSSEData);
      },
      'shadow:task_assigned': (data) => {
        setShadowStatus(data.data as ShadowSSEData);
      },
      'shadow:task_completed': (data) => {
        setShadowStatus(data.data as ShadowSSEData);
      },
    },
  });

  return {
    shadowStatus,
    setShadowStatus,
    ...sse,
  };
}
