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
  channels?: string[];
  autoConnect?: boolean;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  handlers?: Record<string, (data: SSEMessage) => void>;
}

export interface UseSSEReturn {
  isConnected: boolean;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  connect: () => void;
  disconnect: () => void;
  on: <T>(event: string, handler: (data: SSEMessage<T>) => void) => () => void;
  emit: <T>(event: string, data: T) => void;
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
  const handlersRef = useRef<Record<string, Set<(data: SSEMessage) => void>>>({});
  const stableRefs = useRef({
    channels,
    autoReconnect,
    reconnectDelay,
    maxReconnectAttempts,
    onOpen,
    onClose,
    onError,
  });

  // Keep stable refs up to date without triggering effects
  stableRefs.current = {
    channels,
    autoReconnect,
    reconnectDelay,
    maxReconnectAttempts,
    onOpen,
    onClose,
    onError,
  };

  // Register handlers — only runs when handlers keys change
  const prevHandlerKeysRef = useRef<string[]>([]);
  useEffect(() => {
    const currentKeys = Object.keys(handlers);
    const prevKeys = prevHandlerKeysRef.current;
    const changed = currentKeys.length !== prevKeys.length
      || currentKeys.some(k => !prevKeys.includes(k));

    if (changed) {
      prevHandlerKeysRef.current = currentKeys;
      Object.entries(handlers).forEach(([event, handler]) => {
        if (!handlersRef.current[event]) {
          handlersRef.current[event] = new Set();
        }
        handlersRef.current[event].add(handler as (data: SSEMessage) => void);
      });
    }
  }, [handlers]);

  const handleEvent = useCallback((eventName: string, event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as SSEMessage;
      const eventHandlers = handlersRef.current[eventName];
      if (eventHandlers) {
        eventHandlers.forEach(h => { try { h(data); } catch {} });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Stable connect — reads from refs, not dependencies
  const connect = useCallback(() => {
    if (typeof EventSource === 'undefined') {
      console.warn('SSE not supported');
      return;
    }

    if (eventSourceRef.current) eventSourceRef.current.close();
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    setStatus('connecting');

    const ch = stableRefs.current.channels.join(',');
    const es = new EventSource(`/api/sse?channels=${ch}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      stableRefs.current.onOpen?.();
    };

    es.onerror = () => {
      setStatus('error');
      setIsConnected(false);
      stableRefs.current.onClose?.();

      const { autoReconnect: ar, maxReconnectAttempts: max, reconnectDelay: delay } = stableRefs.current;
      if (ar && reconnectAttemptsRef.current < max) {
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
      }
    };

    const events = ['connected', 'task:updated', 'task:progress', 'task:completed',
      'task:created', 'task:error', 'task:commit', 'task:mr_created',
      'shadow:status', 'shadow:heartbeat', 'stats:updated',
      'message:new', 'message:log'];

    events.forEach(ev => {
      es.addEventListener(ev, (e) => handleEvent(ev, e));
    });

  }, [handleEvent]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setStatus('disconnected');
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Auto-connect on mount — only once, stable connect reference
  const didAutoConnect = useRef(false);
  useEffect(() => {
    if (autoConnect && !didAutoConnect.current) {
      didAutoConnect.current = true;
      connect();
    }
    return () => {
      disconnect();
      didAutoConnect.current = false;
    };
  }, [autoConnect, connect, disconnect]);

  const on = useCallback(<T,>(event: string, handler: (data: SSEMessage<T>) => void) => {
    if (!handlersRef.current[event]) handlersRef.current[event] = new Set();
    handlersRef.current[event].add(handler as (data: SSEMessage) => void);
    return () => { handlersRef.current[event]?.delete(handler as (data: SSEMessage) => void); };
  }, []);

  const emit = useCallback(<T,>(event: string, data: T) => {
    const message: SSEMessage = { channel: 'local', event, data, timestamp: new Date().toISOString() };
    handlersRef.current[event]?.forEach(h => { try { h(message); } catch {} });
  }, []);

  return { isConnected, status, connect, disconnect, on, emit };
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
  
  const handlers = {
    'message:new': (data: SSEMessage) => {
      const msgData = data.data as TaskSSEData;
      if (msgData.taskId === taskId) {
        setMessages(prev => {
          if (msgData.messageId && prev.some(m => (m.data as TaskSSEData).messageId === msgData.messageId)) return prev;
          return [...prev, data];
        });
      }
    },
    'message:log': (data: SSEMessage) => {
      const msgData = data.data as TaskSSEData;
      if (msgData.taskId === taskId) setMessages(prev => [...prev, data]);
    },
    'task:updated': (data: SSEMessage) => {
      const taskData = data.data as TaskSSEData;
      if (taskData.taskId === taskId) setTask(prev => prev ? { ...prev, status: taskData.status } : null);
    },
    'task:completed': (data: SSEMessage) => {
      const taskData = data.data as TaskSSEData;
      if (taskData.taskId === taskId) setTask(prev => prev ? { ...prev, status: 'completed', result: taskData.result } : null);
    },
  };

  const sse = useSSE({ channels: ['messages', 'task'], autoConnect: true, autoReconnect: true, handlers });

  return { messages, task, setTask, ...sse };
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
  
  const handlers = {
    'shadow:status': (data: SSEMessage) => setShadowStatus(data.data as ShadowSSEData),
    'shadow:heartbeat': (data: SSEMessage) => setShadowStatus(data.data as ShadowSSEData),
    'shadow:task_assigned': (data: SSEMessage) => setShadowStatus(data.data as ShadowSSEData),
    'shadow:task_completed': (data: SSEMessage) => setShadowStatus(data.data as ShadowSSEData),
  };

  const sse = useSSE({ channels: ['shadow', 'stats'], autoConnect: true, handlers });

  return { shadowStatus, setShadowStatus, ...sse };
}