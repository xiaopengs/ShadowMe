'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Clock,
  CheckCircle,
  Archive,
  Plus,
  Filter,
  Search,
  SortAsc
} from 'lucide-react';
import type { Task, TaskStatus, TaskType, Priority } from '@/types';
import { STATUS_LABELS, TASK_TYPE_LABELS, PRIORITY_LABELS, COLUMN_ORDER } from '@/types';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';

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

export default function KanbanBoard({ tasks, onEditTask }: KanbanBoardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'title'>('createdAt');

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

  return (
    <div className="h-full flex flex-col">
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TaskType | 'all')}
                className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)] text-sm focus:outline-none focus:border-[var(--color-primary-500)] transition-all cursor-pointer"
              >
                <option value="all">全部类型</option>
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)] text-sm focus:outline-none focus:border-[var(--color-primary-500)] transition-all cursor-pointer"
              >
                <option value="all">全部优先级</option>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'priority' | 'title')}
                className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)] text-sm focus:outline-none focus:border-[var(--color-primary-500)] transition-all cursor-pointer"
              >
                <option value="createdAt">最新创建</option>
                <option value="priority">优先级</option>
                <option value="title">标题</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary w-full lg:w-auto"
          >
            <Plus size={18} />
            新建任务
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-max pb-4">
          {columns.map((column, colIndex) => {
            const Icon = column.icon;
            const taskCount = column.tasks.length;

            return (
              <div
                key={column.id}
                className={`w-80 flex flex-col bg-[var(--color-bg-elevated)]/50 rounded-2xl border-t-2 ${columnColors[column.id]}`}
              >
                <div className="p-4 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-[var(--color-text-secondary)]" />
                      <h3 className="font-semibold text-[var(--color-text-primary)]">
                        {column.title}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]">
                      {taskCount}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)]">
                  <AnimatePresence mode="popLayout">
                    {column.tasks.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-8 text-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center mb-3">
                          <Icon size={20} className="text-[var(--color-text-muted)]" />
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {column.id === 'pending' ? '暂无待处理任务' : '暂无任务'}
                        </p>
                      </motion.div>
                    ) : (
                      column.tasks.map((task, taskIndex) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: taskIndex * 0.05 }}
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
              </div>
            );
          })}
        </div>
      </div>

      <TaskForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editTask={editingTask}
      />
    </div>
  );
}
