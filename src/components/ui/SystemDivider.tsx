/**
 * System Status Divider Component
 * Design: Centered label between messages with decorative lines
 * Source: detail_log_1/code.html
 */
'use client';

import React from 'react';

interface SystemDividerProps {
  label: string;
  className?: string;
}

export default function SystemDivider({ label, className = '' }: SystemDividerProps) {
  return (
    <div className={`flex items-center gap-3 w-full my-4 ${className}`}>
      <div className="h-px bg-[var(--color-outline-variant)]/20 flex-1" />
      <span className="font-code-label text-[10px] text-[var(--color-secondary)] px-3 py-1 bg-[var(--color-secondary)]/10 rounded-full border border-[var(--color-secondary)]/20 whitespace-nowrap">
        {label}
      </span>
      <div className="h-px bg-[var(--color-outline-variant)]/20 flex-1" />
    </div>
  );
}
