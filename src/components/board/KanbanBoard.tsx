'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Inbox,
  Clock,
  CheckCircle,
  Archive,
  Plus,
  Filter,
  Search,
  SortAsc,
  Circle
} from 'lucide-react';
import type { Task, TaskStatus, TaskType, Priority } from '@/types';
import { STATUS_LABELS, TASK_TYPE_LABELS, PRIORITY_LABELS, COLUMN_ORDER } from '@/types';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';

const columnIcons: Record<TaskStatus, React.ElementType> = {
  pending: Inbox,
  in_progress: Clock,
  completed: CheckCircle,
  needs_feedback: Clock,
  closed: Archive
};

const columnColors: Record<TaskStatus, string> = {
  pending: 'border-[var(--color-info)]',
  in_progress: 'border-[var(--color-warning)]',
  completed: 'border-[var(--color-success)]',
  needs_feedback: 'border-[var(--color-warning)]',
  closed: 'border-[var(--color-text-muted)]'
};

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
}

// Animated counter component for badge counts
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      // Animate the number change
      const startValue = prevValueRef.current;
      const endValue = value;
      const duration = 300;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (endValue - startValue) * eased);
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
      prevValueRef.current = value;
    }
  }, [value]);

  return <span className={className}>{displayValue}</span>;
}

// Column status indicator with different animations
function ColumnStatusIndicator({ status }: { status: TaskStatus }) {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (prefersReducedMotion) {
    // Static indicator for reduced motion
    return (
      <span className={`
        w-2.5 h-2.5 rounded-full
        ${status === 'pending' ? 'bg-[var(--color-info)]' : ''}
        ${status === 'in_progress' ? 'bg-[var(--color-warning)]' : ''}
        ${status === 'completed' ? 'bg-[var(--color-success)]' : ''}
        ${status === 'needs_feedback' ? 'bg-yellow-500' : ''}
        ${status === 'closed' ? 'bg-[var(--color-text-muted)]' : ''}
      `} />
    );
  }

  switch (status) {
    case 'pending':
      // Static dot
      return (
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-info)]" />
      );
    case 'in_progress':
      // Pulsing animation
      return (
        <span className="relative w-2.5 h-2.5">
          <span className="absolute inset-0 rounded-full bg-[var(--color-warning)] animate-ping opacity-75" />
          <span className="absolute inset-0 rounded-full bg-[var(--color-warning)]" />
        </span>
      );
    case 'completed':
      // Check icon
      return (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center"
        >
          <CheckCircle size={14} className="text-[var(--color-success)]" />
        </motion.span>
      );
    case 'needs_feedback':
      // Bouncing indicator
      return (
        <motion.span
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-2.5 h-2.5 rounded-full bg-yellow-500"
        />
      );
    default:
      return <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-text-muted)]" />;
  }
}

export default function KanbanBoard({ tasks, onEditTask }: KanbanBoardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'title'>('createdAt');

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const columns = COLUMN_ORDER.map(status => ({
    id: status,
    title: STATUS_LABELS[status],
    icon: columnIcons[status],
    tasks: tasks
      .filter(t => {
        if (t.status !== status) return false;
        if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
  }));

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  // Animation variants
  const columnVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as const
      }
    }
  };

  const taskVariants: Variants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        delay: prefersReducedMotion ? 0 : 0.05,
        duration: prefersReducedMotion ? 0.1 : 0.3
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: { duration: 0.15 }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter Bar */}
      <motion.div 
        className="glass-card p-4 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search Input with Focus Animation */}
            <div className="relative flex-1 max-w-md">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <motion.input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索任务..."
                  whileFocus={{
                    boxShadow: '0 0 0 3px rgba(var(--color-primary), 0.2), 0 0 15px rgba(var(--color-primary), 0.15)',
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                />
              </div>
            </div>

            {/* Filter Selects */}
            <div className="flex gap-2">
              <motion.select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TaskType | 'all')}
                whileFocus={{ scale: 1.02 }}
                className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)] text-sm focus:outline-none focus:border-[var(--color-primary-500)] transition-all cursor-pointer"
              >
                <option value="all">全部类型</option>
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </motion.select>

              <motion.select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                whileFocus={{ scale: 1.02 }}
                className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)] text-sm focus:outline-none focus:border-[var(--color-primary-500)] transition-all cursor-pointer"
              >
                <option value="all">全部优先级</option>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </motion.select>

              <motion.select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'priority' | 'title')}
                whileFocus={{ scale: 1.02 }}
                className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)] text-sm focus:outline-none focus:border-[var(--color-primary-500)] transition-all cursor-pointer"
              >
                <option value="createdAt">最新创建</option>
                <option value="priority">优先级</option>
                <option value="title">标题</option>
              </motion.select>
            </div>
          </div>

          {/* Create Task Button */}
          <motion.button
            onClick={() => setIsFormOpen(true)}
            whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-glow)' }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full lg:w-auto"
          >
            <Plus size={18} />
            新建任务
          </motion.button>
        </div>
      </motion.div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-max pb-4">
          {columns.map((column, colIndex) => {
            const Icon = column.icon;
            const taskCount = column.tasks.length;

            return (
              <motion.div
                key={column.id}
                variants={columnVariants}
                initial="initial"
                animate="animate"
                custom={colIndex}
                transition={{ delay: colIndex * 0.1 }}
                className={`w-80 flex flex-col bg-[var(--color-bg-elevated)]/50 rounded-2xl border-t-2 ${columnColors[column.id]}`}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Animated Status Indicator */}
                      <ColumnStatusIndicator status={column.id} />
                      <h3 className="font-semibold text-[var(--color-text-primary)]">
                        {column.title}
                      </h3>
                    </div>
                    
                    {/* Animated Count Badge */}
                    <motion.span
                      key={taskCount}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className={`
                        px-2 py-0.5 rounded-full text-xs font-medium 
                        ${taskCount > 0 
                          ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' 
                          : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]'
                        }
                      `}
                    >
                      <AnimatedCounter value={taskCount} />
                    </motion.span>
                  </div>
                </div>

                {/* Tasks Container */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)]">
                  <AnimatePresence mode="popLayout">
                    {column.tasks.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-8 text-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: 'spring' }}
                          className="w-12 h-12 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center mb-3"
                        >
                          <Icon size={20} className="text-[var(--color-text-muted)]" />
                        </motion.div>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {column.id === 'pending' ? '暂无待处理任务' : '暂无任务'}
                        </p>
                      </motion.div>
                    ) : (
                      column.tasks.map((task, taskIndex) => (
                        <motion.div
                          key={task.id}
                          layout
                          variants={taskVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          custom={taskIndex}
                        >
                          <TaskCard
                            task={task}
                            onEdit={handleEditTask}
                          />
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Task Form Modal - using correct props */}
      <AnimatePresence>
        {isFormOpen && (
          <TaskForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            editTask={editingTask}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
