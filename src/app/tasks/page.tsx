'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  Edit2,
  Trash2,
  ChevronDown
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import type { Task, TaskStatus, TaskType, Priority } from '@/types';
import { STATUS_LABELS, TASK_TYPE_LABELS, PRIORITY_LABELS } from '@/types';

const typeIcons: Record<TaskType, string> = {
  technical_issue: 'code',
  design_doc: 'description',
  code_review: 'rate_review',
  other: 'more_horiz'
};

const statusIcons: Record<TaskStatus, React.ElementType> = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  needs_feedback: AlertCircle,
  closed: Archive
};

export default function TasksPage() {
  const { state, fetchTasks, deleteTask, updateTask } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchTasks();
      setIsLoading(false);
    };
    loadData();
  }, [fetchTasks]);

  const filteredTasks = state.tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && task.type !== filterType) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    return true;
  });

  const getPriorityClass = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="font-headline text-2xl md:text-3xl text-[var(--color-on-surface)]">
              Task List
            </h2>
            <p className="font-body text-sm text-[var(--color-on-surface-variant)] mt-1">
              Manage and track all your tasks
            </p>
          </div>
          
          <Link href="/tasks/new" className="btn-primary self-start">
            <Plus size={18} />
            New Task
          </Link>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)] transition-all font-body text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
                className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
              >
                <option value="all">All Status</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
              >
                <option value="all">All Priority</option>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as TaskType | 'all')}
                className="bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
              >
                <option value="all">All Types</option>
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Tasks List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, index) => {
              const StatusIcon = statusIcons[task.status];
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass-card p-4 hover:border-[var(--color-primary)]/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`
                      p-2 rounded-lg mt-1
                      ${task.status === 'completed' 
                        ? 'bg-[var(--color-success)]/10' 
                        : task.status === 'in_progress'
                          ? 'bg-[var(--color-primary)]/10'
                          : 'bg-[var(--color-surface-container-high)]'
                      }
                    `}>
                      <StatusIcon 
                        size={18} 
                        className={
                          task.status === 'completed' 
                            ? 'text-[var(--color-success)]' 
                            : task.status === 'in_progress'
                              ? 'text-[var(--color-primary)]'
                              : 'text-[var(--color-outline)]'
                        } 
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <span className="code-label text-[var(--color-primary-container)] text-xs">
                            {task.id.toUpperCase().slice(0, 10)}
                          </span>
                          <h3 className="font-body text-[var(--color-on-surface)] font-medium mt-1">
                            {task.title}
                          </h3>
                        </div>
                        <span className={`priority-badge ${getPriorityClass(task.priority)} flex-shrink-0`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>

                      <p className="font-body text-sm text-[var(--color-on-surface-variant)] line-clamp-2 mb-3">
                        {task.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-[var(--color-outline)]">
                          <span className="font-body">{TASK_TYPE_LABELS[task.type]}</span>
                          <span>•</span>
                          <span className="status-mono">{formatDate(task.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty State */}
          {filteredTasks.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container)] mx-auto mb-4 flex items-center justify-center">
                <Filter size={24} className="text-[var(--color-outline)]" />
              </div>
              <h3 className="font-headline text-lg text-[var(--color-on-surface)] mb-2">
                No tasks found
              </h3>
              <p className="font-body text-[var(--color-on-surface-variant)] mb-6">
                {searchQuery || filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first task to get started'}
              </p>
              {!searchQuery && filterType === 'all' && filterPriority === 'all' && filterStatus === 'all' && (
                <Link href="/tasks/new" className="btn-primary inline-flex">
                  <Plus size={18} />
                  Create Task
                </Link>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-body text-[var(--color-on-surface-variant)]">Loading tasks...</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
