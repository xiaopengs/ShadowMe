/**
 * Dashboard Page - Enhanced with Accessibility
 * Features: Semantic HTML, ARIA labels, keyboard navigation
 */
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Plus,
  CheckCircle,
  RefreshCw,
  Loader2,
  FolderCode,
  Code,
  FileText,
  Archive,
  Inbox,
  Clock,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import type { Task, TaskStatus, TaskType } from '@/types';

interface TaskCardProps {
  task: Task;
  variant?: 'default' | 'active' | 'completed';
}

// Animated counter hook
function useAnimatedNumber(targetValue: number, duration: number = 500) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const previousValue = useRef(targetValue);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = targetValue;
    
    if (startValue === endValue) return;

    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * eased);
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

// Animated stat card component
const AnimatedStatCard = memo(function AnimatedStatCard({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType; 
  color: string;
}) {
  const animatedValue = useAnimatedNumber(value);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      className="glass-card p-6 relative overflow-hidden"
      whileHover={{ y: -4, boxShadow: 'var(--shadow-glow)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
    >
      <div 
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-xl ${color}`}
        aria-hidden="true"
      />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-1">{label}</p>
          <motion.p 
            className={`text-3xl font-bold font-mono ${color.replace('bg-', 'text-')}`}
            key={value}
            initial={{ scale: 1.2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {animatedValue}
          </motion.p>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} aria-hidden="true" />
        </div>
      </div>
    </motion.article>
  );
});

const typeConfig: Record<TaskType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  technical_issue: { 
    label: '技术问题', 
    icon: Code, 
    color: 'text-[var(--color-error)]',
    bgColor: 'bg-[var(--color-error)]/10',
  },
  design_doc: { 
    label: '方案设计', 
    icon: FileText, 
    color: 'text-[var(--color-primary)]',
    bgColor: 'bg-[var(--color-primary)]/10',
  },
  code_review: { 
    label: '代码审查', 
    icon: FolderCode, 
    color: 'text-[var(--color-secondary)]',
    bgColor: 'bg-[var(--color-secondary)]/10',
  },
  other: { 
    label: '其他', 
    icon: Archive, 
    color: 'text-[var(--color-outline)]',
    bgColor: 'bg-[var(--color-outline)]/10',
  },
};

interface TaskCardComponentProps {
  task: Task;
  variant?: 'default' | 'active' | 'completed';
}

// Memoized task card
const TaskCardComponent = memo(function TaskCardComponent({ 
  task, 
  variant = 'default' 
}: TaskCardComponentProps) {
  const router = useRouter();
  const isActive = variant === 'active';
  const isCompleted = variant === 'completed';
  const typeInfo = typeConfig[task.type] ?? typeConfig.other;
  const TypeIcon = typeInfo.icon;

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s AGO`;
    if (diff < 3600) return `${Math.floor(diff / 60)}M AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H AGO`;
    return `${Math.floor(diff / 86400)}D AGO`;
  };

  const handleCardClick = () => {
    router.push(`/tasks/${task.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`
        bg-[var(--color-surface-container-high)] rounded-lg p-4 border transition-all cursor-pointer
        ${isActive 
          ? 'border-[var(--color-primary)]/50 shadow-energy-glow relative' 
          : isCompleted 
            ? 'border-[var(--color-outline-variant)]/10' 
            : 'border-[var(--color-outline-variant)]/10 hover:border-[var(--color-outline-variant)]/50'
        }
      `}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}, Status: ${isActive ? 'Active' : isCompleted ? 'Completed' : 'Pending'}`}
    >
      {isActive && (
        <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-[var(--color-primary)] rounded-r-full shadow-energy-glow" aria-hidden="true" />
      )}

      <div className={`${isActive ? 'pl-3' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <span className="code-label text-[10px] text-[var(--color-outline)]">
            {task.id.slice(0, 10).toUpperCase()}
          </span>
        </div>

        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${typeInfo.bgColor} ${typeInfo.color}`}>
          <TypeIcon size={10} aria-hidden="true" />
          {typeInfo.label}
        </div>

        <p className={`font-body text-sm text-[var(--color-on-surface)] mb-4 ${isCompleted ? 'line-through decoration-[var(--color-outline-variant)]' : ''}`}>
          {task.title}
        </p>

        {isActive && (
          <div className="bg-[var(--color-surface-container-lowest)] rounded p-2 font-mono text-[10px] text-[var(--color-on-surface-variant)] mb-4 border border-[var(--color-outline-variant)]/20">
            <span className="text-[var(--color-secondary)]">&gt;</span> Analyzing task context<br />
            <span className="text-[var(--color-secondary)]">&gt;</span> Initializing clone<br />
            <span className="text-[var(--color-primary)]">&gt;</span> Processing...
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
            <img
              src={isActive 
                ? "https://images.unsplash.com/photo-1531297461136-82af7ce98621?w=40&h=40&fit=crop"
                : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
              }
              alt=""
              className={`w-5 h-5 rounded-full object-cover ${isActive ? 'shadow-energy-glow' : ''}`}
              aria-hidden="true"
            />
            <span className="text-[11px] font-mono">
              {isActive ? 'Shadow.OS' : task.createdBy.split(' ')[0]}
            </span>
          </div>
          
          {isCompleted ? (
            <div className="flex items-center gap-1 text-[var(--color-secondary)] text-[11px] font-mono" role="status">
              <CheckCircle size={14} aria-hidden="true" />
              Done
            </div>
          ) : isActive ? (
            <span className="text-[var(--color-secondary)] text-[11px] font-mono animate-pulse flex items-center gap-1" role="status">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)] animate-pulse" aria-hidden="true" />
              ACTIVE
            </span>
          ) : (
            <span className="text-[var(--color-outline)] text-[11px] font-mono">
              {formatTimeAgo(task.createdAt)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
});

// Memoized kanban column
const KanbanColumn = memo(function KanbanColumn({ 
  title, 
  status, 
  tasks, 
  variant = 'default',
  count,
}: { 
  title: string; 
  status: TaskStatus; 
  tasks: Task[];
  variant?: 'default' | 'active' | 'completed';
  count: number;
}) {
  const animatedCount = useAnimatedNumber(count, 300);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className={`
        flex flex-col glass-panel rounded-xl p-4
        ${variant === 'active' ? 'border-[var(--color-primary)]/20 relative overflow-hidden' : ''}
        ${variant === 'completed' ? 'opacity-80' : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: prefersReducedMotion ? 0 : 0.1 }}
      aria-label={`${title} column with ${count} tasks`}
    >
      {variant === 'active' && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-50" aria-hidden="true" />
      )}

      <header className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-outline-variant)]/30">
        <h3 className={`
          font-headline text-lg flex items-center gap-2
          ${variant === 'active' ? 'text-[var(--color-primary)]' : variant === 'completed' ? 'text-[var(--color-on-surface-variant)]' : 'text-[var(--color-on-surface)]'}
        `}>
          <motion.span 
            className={`
              w-2.5 h-2.5 rounded-full
              ${variant === 'active' ? 'bg-[var(--color-primary)] shadow-energy-glow' : variant === 'completed' ? 'bg-[var(--color-secondary)]' : 'bg-[var(--color-outline)]'}
            `}
            animate={variant === 'active' ? {
              boxShadow: [
                '0 0 4px var(--color-primary)',
                '0 0 12px var(--color-primary)',
                '0 0 4px var(--color-primary)'
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            aria-hidden="true"
          />
          {title}
        </h3>
        <motion.span
          key={count}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={`
            px-2 py-0.5 rounded text-xs font-mono
            ${variant === 'active' 
              ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' 
              : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]'
            }
          `}
          aria-label={`${count} tasks`}
        >
          {animatedCount}
        </motion.span>
      </header>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1" role="list" aria-label={`${title} tasks`}>
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <div key={task.id} role="listitem">
              <TaskCardComponent 
                task={task} 
                variant={variant}
              />
            </div>
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <p className="text-center py-8 text-[var(--color-outline)] text-sm">
            No tasks
          </p>
        )}
      </div>
    </motion.section>
  );
});

export default function DashboardPage() {
  const { state } = useApp();
  const prefersReducedMotion = useReducedMotion();

  const pendingTasks = useMemo(() => state.tasks.filter(t => t.status === 'pending'), [state.tasks]);
  const inProgressTasks = useMemo(() => state.tasks.filter(t => t.status === 'in_progress'), [state.tasks]);
  const completedTasks = useMemo(() => state.tasks.filter(t => t.status === 'completed' || t.status === 'closed'), [state.tasks]);

  const hasRealTasks = state.tasks.length > 0;
  const displayPending = pendingTasks;
  const displayInProgress = inProgressTasks;
  const displayCompleted = completedTasks;

  const totalTasks = state.tasks.length;
  const completedCount = completedTasks.length;
  const activeCount = inProgressTasks.length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.header 
          className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.3 }}
        >
          <div>
            <h1 className="font-headline text-2xl md:text-3xl text-[var(--color-on-surface)] mb-1">
              协作看板
            </h1>
            <p className="font-body text-sm text-[var(--color-on-surface-variant)]">
              Real-time task synchronization with Local Claude Code
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.article 
              className="glass-panel rounded-full px-4 py-2 flex items-center gap-3 border border-[var(--color-primary)]/20 bg-[var(--color-surface-container)]/50"
              whileHover={{ scale: 1.02 }}
              role="status"
              aria-label={`Shadow Status: ${state.shadow.status === 'online' ? 'Ready & Waiting' : 'Offline'}`}
            >
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1531297461136-82af7ce98621?w=40&h=40&fit=crop"
                  alt="Shadow Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <motion.span 
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--color-secondary)] rounded-full shadow-sync-glow border-2 border-[var(--color-surface)]"
                  animate={{ 
                    boxShadow: state.shadow.status === 'online' 
                      ? '0 0 15px var(--color-secondary)' 
                      : '0 0 5px var(--color-secondary)'
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col">
                <span className="code-label text-[var(--color-on-surface)]">Shadow.OS</span>
                <span className="status-mono text-[var(--color-secondary)] uppercase">{state.shadow.status === 'online' ? 'Ready & Waiting' : 'Offline'}</span>
              </div>
            </motion.article>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href="/tasks/new"
                className="btn-primary"
                aria-label="Create a new task"
              >
                <Plus size={18} aria-hidden="true" />
                Quick Create
              </Link>
            </motion.div>
          </div>
        </motion.header>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: prefersReducedMotion ? 0.1 : 0.3 }}
          role="region"
          aria-label="Task statistics"
        >
          <AnimatedStatCard
            label="Total Tasks"
            value={totalTasks}
            icon={Inbox}
            color="bg-[var(--color-primary)]"
          />
          <AnimatedStatCard
            label="In Progress"
            value={activeCount}
            icon={RefreshCw}
            color="bg-[var(--color-warning)]"
          />
          <AnimatedStatCard
            label="Completed"
            value={completedCount}
            icon={CheckCircle}
            color="bg-[var(--color-success)]"
          />
          <AnimatedStatCard
            label="Pending"
            value={pendingTasks.length}
            icon={Clock}
            color="bg-[var(--color-info)]"
          />
        </motion.div>

        {/* Loading State */}
        {state.isLoading && (
          <motion.div 
            className="flex items-center justify-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="status"
            aria-label="Loading tasks"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={32} className="text-[var(--color-primary)]" aria-hidden="true" />
            </motion.div>
          </motion.div>
        )}

        {/* Empty State */}
        {!state.isLoading && !hasRealTasks && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
            role="status"
            aria-label="No tasks available"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center shadow-[0_0_40px_rgba(208,188,255,0.1)]"
            >
              <Inbox size={48} className="text-[var(--color-outline)]" aria-hidden="true" />
            </motion.div>
            <div className="text-center">
              <h2 className="font-headline text-2xl text-[var(--color-on-surface)] mb-2">
                还没有任务
              </h2>
              <p className="font-body text-[var(--color-on-surface-variant)] max-w-md">
                点击 Quick Create 或前往 New Task Portal 创建第一个协作任务
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href="/tasks/new"
                className="btn-primary mt-2"
              >
                <Plus size={18} aria-hidden="true" />
                创建第一个任务
              </Link>
            </motion.div>
          </motion.div>
        )}

        {/* Kanban Board */}
        {!state.isLoading && hasRealTasks && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-[minmax(280px,1fr)_minmax(280px,1fr)_minmax(280px,1fr)] gap-4 md:gap-6 h-[calc(100vh-420px)] min-h-[500px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            role="region"
            aria-label="Task board"
          >
            <KanbanColumn
              title="待处理"
              status="pending"
              tasks={displayPending}
              variant="default"
              count={displayPending.length}
            />

            <KanbanColumn
              title="分身处理中"
              status="in_progress"
              tasks={displayInProgress}
              variant="active"
              count={displayInProgress.length}
            />

            <KanbanColumn
              title="已完成"
              status="completed"
              tasks={displayCompleted}
              variant="completed"
              count={displayCompleted.length}
            />
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
