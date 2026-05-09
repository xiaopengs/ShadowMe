/**
 * CC Terminal Reasoning Block Component
 * Design: Terminal-style dark block with left accent bar and glow effect
 * Source: detail_log_1/code.html
 */
'use client';

import React from 'react';

interface CCTerminalBlockProps {
  content: string;
  className?: string;
}

export default function CCTerminalBlock({ content, className = '' }: CCTerminalBlockProps) {
  return (
    <div className={`w-full max-w-[95%] self-start flex flex-col gap-1 ${className}`}>
      <span className="font-body text-xs text-[var(--color-primary)] px-2 flex items-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
          <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
          <path d="M12 12L2 12"/>
          <path d="M12 12l7-7"/>
        </svg>
        Claude Code Internal
      </span>
      <div className="bg-[#060e20] text-[var(--color-on-surface-variant)] p-4 rounded-xl font-status-mono text-[11px] border border-[var(--color-primary)]/20 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] overflow-x-auto relative group transition-all duration-200">
        {/* Left accent bar with glow */}
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)]/50 group-hover:bg-[var(--color-primary)] transition-colors shadow-[0_0_8px_rgba(var(--color-primary-rgb, 194,101,42),0.5)]" />
        <pre className="whitespace-pre-wrap leading-relaxed pl-4 text-[var(--color-secondary)]">
          {content}
        </pre>
      </div>
    </div>
  );
}
