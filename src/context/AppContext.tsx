'use client';

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Task, ShadowState, Notification, Stats } from '@/types';

interface AppState {
  tasks: Task[];
  shadow: ShadowState;
  notifications: Notification[];
  stats: Stats;
  isLoading: boolean;
  error: string | null;
  wsConnected: boolean;
}

type AppAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_SHADOW'; payload: ShadowState }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_STATS'; payload: Stats }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WS_CONNECTED'; payload: boolean };

const initialState: AppState = {
  tasks: [],
  shadow: {
    id: 'shadow-1',
    name: '影子分身',
    status: 'offline',
    lastHeartbeat: new Date().toISOString(),
    capabilities: ['代码审查', '方案设计', '技术问题解决', '文档生成'],
    autoTakeTasks: false
  },
  notifications: [],
  stats: {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    closed: 0
  },
  isLoading: true,
  error: null,
  wsConnected: false
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'SET_SHADOW':
      return { ...state, shadow: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 50) };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_WS_CONNECTED':
      return { ...state, wsConnected: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  fetchTasks: () => Promise<void>;
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  takeTask: (id: string) => Promise<void>;
  completeTask: (id: string, result: Task['result']) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const fetchTasks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      dispatch({ type: 'SET_TASKS', payload: data.tasks || [] });

      const stats: Stats = {
        total: data.tasks?.length || 0,
        pending: data.tasks?.filter((t: Task) => t.status === 'pending').length || 0,
        inProgress: data.tasks?.filter((t: Task) => t.status === 'in_progress').length || 0,
        completed: data.tasks?.filter((t: Task) => t.status === 'completed').length || 0,
        closed: data.tasks?.filter((t: Task) => t.status === 'closed').length || 0
      };
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Task> => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create task');
    const task = await res.json();
    dispatch({ type: 'ADD_TASK', payload: task });
    return task;
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update task');
    const updated = await res.json();
    dispatch({ type: 'UPDATE_TASK', payload: updated });
  };

  const deleteTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const takeTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}/take`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to take task');
    const updated = await res.json();
    dispatch({ type: 'UPDATE_TASK', payload: updated });
  };

  const completeTask = async (id: string, result: Task['result']) => {
    const res = await fetch(`/api/tasks/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result })
    });
    if (!res.ok) throw new Error('Failed to complete task');
    const updated = await res.json();
    dispatch({ type: 'UPDATE_TASK', payload: updated });
  };

  useEffect(() => {
    fetchTasks();

    const fetchShadowStatus = async () => {
      try {
        const res = await fetch('/api/shadow/status');
        if (res.ok) {
          const data = await res.json();
          dispatch({ type: 'SET_SHADOW', payload: data });
        }
      } catch {
        console.log('Shadow status endpoint not available');
      }
    };

    fetchShadowStatus();
    const interval = setInterval(fetchShadowStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      fetchTasks,
      createTask,
      updateTask,
      deleteTask,
      takeTask,
      completeTask
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
