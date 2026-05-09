/**
 * Workload Card Component
 * Design: Shows current task queue with energy line connector
 * Source: create_task/code.html
 */
'use client';

import React from 'react';
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

export default function WorkloadCard({ tasks, className = '' }: WorkloadCardProps) {
  return (
    <div className={`bg-[var(--color-surface-container)] rounded-xl border border-[var(--color-outline-variant)]/20 p-4 shadow-md ${className}`}>
      <h3 className="font-code-label text-[10px] text-[var(--color-on-surface)] tracking-wider mb-4">CURRENT WORKLOAD</h3>
      
      <div className="space-y-3 relative">
        {/* Energy Line Connector */}
        <div className="absolute left-3 top-4 bottom-4 w-[2px] bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-secondary)] to-transparent opacity-30" />
        
        {tasks.map((task, index) => (
          <div 
            key={task.id} 
            className={`flex items-start gap-3 relative z-10 p-2 rounded-lg transition-all ${
              task.status === 'active' 
                ? 'bg-[var(--color-surface-bright)]/20 border border-[var(--color-outline-variant)]/10' 
                : ''
            }`}
          >
            {/* Status Icon */}
            <div className={`
              mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border flex-shrink-0
              ${task.status === 'active'
                ? 'bg-[var(--color-surface)] border-[var(--color-primary)] shadow-[0_0_8px_rgba(var(--color-primary-rgb, 194,101,42),0.5)]'
                : task.status === 'completed'
                  ? 'bg-[var(--color-secondary)]/20 border-[var(--color-secondary)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-outline-variant)]'
              }
            `}>
              {task.status === 'active' && (
                <RefreshCw size={12} className="text-[var(--color-primary)] animate-spin" />
              )}
              {task.status === 'queued' && (
                <Clock size={12} className="text-[var(--color-on-surface-variant)]" />
              )}
              {task.status === 'completed' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--color-secondary)]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            {/* Task Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-code-label text-[10px] truncate ${
                task.status === 'active' 
                  ? 'text-[var(--color-on-surface)]' 
                  : 'text-[var(--color-on-surface-variant)]'
              }`}>
                {task.title}
              </p>
              <p className={`font-body text-[10px] ${
                task.status === 'active' 
                  ? 'text-[var(--color-on-surface-variant)]' 
                  : 'text-[var(--color-outline)]'
              }`}>
                {task.status === 'active' ? task.description : task.status === 'queued' ? 'Queued' : 'Completed'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
