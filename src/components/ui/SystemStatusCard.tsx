/**
 * System Status Card Component
 * Design: Shows system health, active clones, and queue time
 * Source: create_task/code.html
 */
'use client';

import React from 'react';

interface SystemStatusCardProps {
  activeClones: number;
  maxClones: number;
  queueTime?: string;
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

export default function SystemStatusCard({ 
  activeClones, 
  maxClones, 
  queueTime = '~4m 20s',
  status = 'online',
  className = '' 
}: SystemStatusCardProps) {
  const statusColors = {
    online: 'bg-[var(--color-secondary)]',
    busy: 'bg-[var(--color-primary)]',
    offline: 'bg-[var(--color-outline)]',
  };

  const statusLabels = {
    online: 'ONLINE',
    busy: 'BUSY',
    offline: 'OFFLINE',
  };

  const usagePercent = (activeClones / maxClones) * 100;

  return (
    <div className={`bg-[var(--color-surface-container-high)] rounded-xl border border-[var(--color-outline-variant)]/20 p-4 shadow-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-code-label text-[10px] text-[var(--color-on-surface)] tracking-wider">SYSTEM STATUS</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse shadow-[0_0_8px_rgba(76,215,246,0.6)]`} />
          <span className="font-status-mono text-[10px] text-[var(--color-secondary)] tracking-widest">{statusLabels[status]}</span>
        </div>
      </div>

      {/* Active Clones */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-body text-xs text-[var(--color-on-surface-variant)]">Active Clones</span>
          <span className="font-code-label text-[10px] text-[var(--color-on-surface)]">{activeClones}/{maxClones}</span>
        </div>
        <div className="w-full bg-[var(--color-surface-container-low)] rounded-full h-1.5">
          <div 
            className="bg-[var(--color-primary)] h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb, 194,101,42),0.8)] transition-all" 
            style={{ width: `${usagePercent}%` }} 
          />
        </div>

        {/* Queue Time */}
        <div className="flex justify-between items-center">
          <span className="font-body text-xs text-[var(--color-on-surface-variant)]">Estimated Queue Time</span>
          <span className="font-code-label text-[10px] text-[var(--color-on-surface)]">{queueTime}</span>
        </div>
      </div>
    </div>
  );
}
