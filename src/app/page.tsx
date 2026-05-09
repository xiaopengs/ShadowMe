'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MoreHorizontal,
  CheckCircle,
  Sync,
  Clock,
  Merge,
  Settings,
  Wifi
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import type { Task, TaskStatus } from '@/types';

interface TaskCardProps {
  task: Task;
  variant?: 'default' | 'active' | 'completed';
}

function TaskCardComponent({ task, variant = 'default' }: TaskCardProps) {
  const isActive = variant === 'active';
  const isCompleted = variant === 'completed';

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s AGO`;
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return `${Math.floor(diff / 86400)}D AGO`;
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className={`
        bg-[var(--color-surface-container-high)] rounded-lg p-4 border transition-all cursor-grab
        ${isActive 
          ? 'border-[var(--color-primary)]/50 shadow-energy-glow relative' 
          : isCompleted 
            ? 'border-[var(--color-outline-variant)]/10' 
            : 'border-[var(--color-outline-variant)]/10 hover:border-[var(--color-outline-variant)]/50'
        }
      `}
    >
      {/* Energy Line for Active Tasks */}
      {isActive && (
        <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-[var(--color-primary)] rounded-r-full shadow-energy-glow" />
      )}

      <div className={`${isActive ? 'pl-3' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className={`
            code-label px-2 py-0.5 rounded
            ${isCompleted 
              ? 'bg-[var(--color-surface-variant)] text-[var(--color-outline)] line-through' 
              : isActive
                ? 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] flex items-center gap-1'
                : 'bg-[var(--color-primary-container)]/10 text-[var(--color-primary-container)]'
            }
          `}>
            {isActive && <Sync size={12} className="animate-spin" />}
            {task.id.slice(0, 10).toUpperCase()}
          </span>
          <button className="text-[var(--color-outline)] hover:text-[var(--color-on-surface)] transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Description */}
        <p className={`font-body text-sm text-[var(--color-on-surface)] mb-4 ${isCompleted ? 'line-through decoration-[var(--color-outline-variant)]' : ''}`}>
          {task.title}
        </p>

        {/* Mini Terminal for Active Tasks */}
        {isActive && (
          <div className="bg-[var(--color-surface-container-lowest)] rounded p-2 font-mono text-[10px] text-[var(--color-on-surface-variant)] mb-4 border border-[var(--color-outline-variant)]/20">
            <span className="text-[var(--color-secondary)]">&gt;</span> Analyzing task context<br />
            <span className="text-[var(--color-secondary)]">&gt;</span> Initializing clone<br />
            <span className="text-[var(--color-primary)]">&gt;</span> Processing...
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
            <img
              src={isActive 
                ? "https://images.unsplash.com/photo-1531297461136-82af7ce98621?w=40&h=40&fit=crop"
                : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              }
              alt={isActive ? "Shadow Clone" : "Requester"}
              className={`w-5 h-5 rounded-full object-cover ${isActive ? 'shadow-energy-glow' : ''}`}
            />
            <span className="text-[11px] font-mono">
              {isActive ? 'Shadow.OS' : task.createdBy.split(' ')[0]}
            </span>
          </div>
          
          {isCompleted ? (
            <div className="flex items-center gap-1 text-[var(--color-secondary)] text-[11px] font-mono">
              <CheckCircle size={14} />
              Merged
            </div>
          ) : isActive ? (
            <span className="text-[var(--color-secondary)] text-[11px] font-mono animate-pulse">
              ACTIVE
            </span>
          ) : (
            <span className="text-[var(--color-outline)] text-[11px] font-mono">
              {formatTimeAgo(task.createdAt)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function KanbanColumn({ 
  title, 
  status, 
  tasks, 
  variant = 'default',
  count 
}: { 
  title: string; 
  status: TaskStatus; 
  tasks: Task[];
  variant?: 'default' | 'active' | 'completed';
  count: number;
}) {
  return (
    <div className={`
      flex flex-col glass-panel rounded-xl p-4
      ${variant === 'active' ? 'border-[var(--color-primary)]/20 relative overflow-hidden' : ''}
      ${variant === 'completed' ? 'opacity-80' : ''}
    `}>
      {/* Gradient bar for active column */}
      {variant === 'active' && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-50" />
      )}

      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-outline-variant)]/30">
        <h3 className={`
          font-headline text-lg flex items-center gap-2
          ${variant === 'active' ? 'text-[var(--color-primary)]' : variant === 'completed' ? 'text-[var(--color-on-surface-variant)]' : 'text-[var(--color-on-surface)]'}
        `}>
          <span className={`
            w-2.5 h-2.5 rounded-full
            ${variant === 'active' ? 'bg-[var(--color-primary)] shadow-energy-glow' : variant === 'completed' ? 'bg-[var(--color-secondary)]' : 'bg-[var(--color-outline)]'}
          `} />
          {title}
        </h3>
        <span className={`
          px-2 py-0.5 rounded text-xs font-mono
          ${variant === 'active' 
            ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' 
            : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]'
          }
        `}>
          {count}
        </span>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCardComponent 
              key={task.id} 
              task={task} 
              variant={variant}
            />
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-[var(--color-outline)] text-sm">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { state, fetchTasks } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchTasks();
      setIsLoading(false);
    };
    loadData();
  }, [fetchTasks]);

  // Filter tasks by status
  const pendingTasks = state.tasks.filter(t => t.status === 'pending');
  const inProgressTasks = state.tasks.filter(t => t.status === 'in_progress');
  const completedTasks = state.tasks.filter(t => t.status === 'completed' || t.status === 'closed');

  // Sample data for demo if no tasks
  const demoTasks: Task[] = [
    {
      id: 'task-402',
      title: 'Refactor Authentication Middleware for better error handling',
      type: 'technical_issue',
      priority: 'high',
      status: 'pending',
      description: 'Need to improve error handling in auth middleware',
      tags: ['auth', 'middleware', 'refactor'],
      attachments: [],
      createdBy: 'Alex J.',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-403',
      title: 'Update API documentation for v2 endpoints',
      type: 'design_doc',
      priority: 'medium',
      status: 'pending',
      description: 'Document all new v2 API endpoints',
      tags: ['docs', 'api'],
      attachments: [],
      createdBy: 'Sarah M.',
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-398',
      title: 'Implement dark mode theme configuration parser for new UI framework',
      type: 'code_review',
      priority: 'high',
      status: 'in_progress',
      description: 'Parse tailwind config and build CSS variables',
      tags: ['ui', 'theming', 'css'],
      attachments: [],
      createdBy: 'John D.',
      createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      startedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 'task-395',
      title: 'Update dependencies and resolve npm audit vulnerabilities',
      type: 'technical_issue',
      priority: 'medium',
      status: 'completed',
      description: 'Update all npm packages and fix security issues',
      tags: ['dependencies', 'security'],
      attachments: [],
      createdBy: 'Mike R.',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
  ];

  const displayTasks = state.tasks.length > 0 ? state.tasks : demoTasks;
  const displayPending = state.tasks.length > 0 ? pendingTasks : demoTasks.filter(t => t.status === 'pending');
  const displayInProgress = state.tasks.length > 0 ? inProgressTasks : demoTasks.filter(t => t.status === 'in_progress');
  const displayCompleted = state.tasks.length > 0 ? completedTasks : demoTasks.filter(t => t.status === 'completed');

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-headline text-2xl md:text-3xl text-[var(--color-on-surface)] mb-1">
              协作看板
            </h2>
            <p className="font-body text-sm text-[var(--color-on-surface-variant)]">
              Real-time task synchronization with Local Claude Code
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Shadow Status Widget */}
            <div className="glass-panel rounded-full px-4 py-2 flex items-center gap-3 border border-[var(--color-primary)]/20 bg-[var(--color-surface-container)]/50">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1531297461136-82af7ce98621?w=40&h=40&fit=crop"
                  alt="Shadow Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--color-secondary)] rounded-full shadow-sync-glow border-2 border-[var(--color-surface)]" />
              </div>
              <div className="flex flex-col">
                <span className="code-label text-[var(--color-on-surface)]">Shadow.OS</span>
                <span className="status-mono text-[var(--color-secondary)] uppercase">Ready & Waiting</span>
              </div>
            </div>

            {/* Quick Create Button */}
            <Link
              href="/tasks/new"
              className="btn-primary"
            >
              <Plus size={18} />
              Quick Create
            </Link>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Pending Column */}
          <KanbanColumn
            title="待处理"
            status="pending"
            tasks={displayPending}
            variant="default"
            count={displayPending.length}
          />

          {/* In Progress Column */}
          <KanbanColumn
            title="分身处理中"
            status="in_progress"
            tasks={displayInProgress}
            variant="active"
            count={displayInProgress.length}
          />

          {/* Completed Column */}
          <KanbanColumn
            title="已完成"
            status="completed"
            tasks={displayCompleted}
            variant="completed"
            count={displayCompleted.length}
          />
        </div>
      </div>
    </AppLayout>
  );
}
