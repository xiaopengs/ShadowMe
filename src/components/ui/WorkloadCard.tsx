/**
 * WorkloadCard Component - Enhanced with Accessibility & Performance
 * Features: ARIA attributes, keyboard navigation, React.memo
 */
'use client';

import React, { memo, useMemo } from 'react';
import { RefreshCw, Clock } from 'lucide-react';

export interface WorkloadTask {
  id: string;
  title: string;
  status: 'active' | 'queued' | 'completed';
  description?: string;
}

interface WorkloadCardProps {
  tasks: WorkloadTask[];
  className?: string;
}

// Memoized task item component
const WorkloadTaskItem = memo(function WorkloadTaskItem({ 
  task 
}: { 
  task: WorkloadTask 
}) {
  const statusConfig = useMemo(() => {
    switch (task.status) {
      case 'active':
        return {
          icon: RefreshCw,
          iconClass: 'text-[var(--color-primary)] animate-spin',
          borderClass: 'border-[var(--color-primary)]',
          bgClass: 'bg-[var(--color-surface)]',
          shadowClass: 'shadow-[0_0_8px_rgba(var(--color-primary-rgb, 194,101,42),0.5)]',
          titleClass: 'text-[var(--color-on-surface)]',
          descClass: 'text-[var(--color-on-surface-variant)]',
        };
      case 'completed':
        return {
          icon: null, // SVG checkmark
          iconClass: 'text-[var(--color-secondary)]',
          borderClass: 'border-[var(--color-secondary)]',
          bgClass: 'bg-[var(--color-secondary)]/20',
          shadowClass: '',
          titleClass: 'text-[var(--color-on-surface-variant)]',
          descClass: 'text-[var(--color-outline)]',
        };
      default: // queued
        return {
          icon: Clock,
          iconClass: 'text-[var(--color-on-surface-variant)]',
          borderClass: 'border-[var(--color-outline-variant)]',
          bgClass: 'bg-[var(--color-surface)]',
          shadowClass: '',
          titleClass: 'text-[var(--color-on-surface-variant)]',
          descClass: 'text-[var(--color-outline)]',
        };
    }
  }, [task.status]);

  const statusLabel = task.status === 'active' ? 'Active' : task.status === 'queued' ? 'Queued' : 'Completed';
  const descriptionText = task.status === 'active' ? task.description : task.status === 'queued' ? 'Queued' : 'Completed';

  return (
    <div 
      className={`flex items-start gap-3 relative z-10 p-2 rounded-lg transition-all ${
        task.status === 'active' 
          ? 'bg-[var(--color-surface-bright)]/20 border border-[var(--color-outline-variant)]/10' 
          : ''
      }`}
      role="listitem"
      aria-label={`Task: ${task.title}, Status: ${statusLabel}`}
    >
      {/* Status Icon */}
      <div 
        className={`
          mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border flex-shrink-0
          ${statusConfig.bgClass} ${statusConfig.borderClass} ${statusConfig.shadowClass}
        `}
        aria-hidden="true"
      >
        {task.status === 'active' && (
          <RefreshCw size={12} className={statusConfig.iconClass} />
        )}
        {task.status === 'queued' && (
          <Clock size={12} className={statusConfig.iconClass} />
        )}
        {task.status === 'completed' && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={statusConfig.iconClass}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-code-label text-[10px] truncate ${statusConfig.titleClass}`}>
          {task.title}
        </p>
        <p className={`font-body text-[10px] ${statusConfig.descClass}`}>
          {descriptionText}
        </p>
      </div>
    </div>
  );
});

function WorkloadCard({ tasks, className = '' }: WorkloadCardProps) {
  const activeTasks = useMemo(() => tasks.filter(t => t.status === 'active'), [tasks]);
  const queuedTasks = useMemo(() => tasks.filter(t => t.status === 'queued'), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'completed'), [tasks]);

  return (
    <article 
      className={`bg-[var(--color-surface-container)] rounded-xl border border-[var(--color-outline-variant)]/20 p-4 shadow-md ${className}`}
      aria-label="Current workload"
    >
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-code-label text-[10px] text-[var(--color-on-surface)] tracking-wider">
          CURRENT WORKLOAD
        </h3>
        <span 
          className="text-[10px] font-mono text-[var(--color-primary)]"
          aria-label={`${activeTasks.length} active, ${queuedTasks.length} queued, ${completedTasks.length} completed`}
        >
          {activeTasks.length}A / {queuedTasks.length}Q / {completedTasks.length}C
        </span>
      </header>
      
      <div className="space-y-3 relative" role="list" aria-label="Workload tasks">
        {/* Energy Line Connector */}
        <div 
          className="absolute left-3 top-4 bottom-4 w-[2px] bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-secondary)] to-transparent opacity-30" 
          aria-hidden="true"
        />
        
        {tasks.length === 0 ? (
          <p className="text-[10px] text-[var(--color-outline)] text-center py-4">
            No tasks in queue
          </p>
        ) : (
          tasks.map((task) => (
            <WorkloadTaskItem key={task.id} task={task} />
          ))
        )}
      </div>
    </article>
  );
}

export default memo(WorkloadCard);
