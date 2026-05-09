/**
 * Glass Header Component
 * Design: Glassmorphic header with blur effect
 * Source: detail_log_1/code.html, create_task/code.html
 */
'use client';

import React from 'react';
import { ArrowLeft, Bot } from 'lucide-react';
import Link from 'next/link';

interface GlassHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backHref?: string;
  showCCStatus?: boolean;
  ccStatus?: 'idle' | 'working' | 'error';
  className?: string;
  children?: React.ReactNode;
}

export default function GlassHeader({
  title,
  showBackButton = false,
  backHref = '/',
  showCCStatus = false,
  ccStatus = 'idle',
  className = '',
  children,
}: GlassHeaderProps) {
  const statusConfig = {
    idle: { bg: 'bg-[var(--color-secondary)]/10', border: 'border-[var(--color-secondary)]/30', text: 'text-[var(--color-secondary)]', dot: 'bg-[var(--color-secondary)]' },
    working: { bg: 'bg-[var(--color-primary)]/10', border: 'border-[var(--color-primary)]/30', text: 'text-[var(--color-primary)]', dot: 'bg-[var(--color-primary)]' },
    error: { bg: 'bg-[var(--color-error)]/10', border: 'border-[var(--color-error)]/30', text: 'text-[var(--color-error)]', dot: 'bg-[var(--color-error)]' },
  };

  const status = statusConfig[ccStatus];

  return (
    <header className={`
      h-14 border-b border-[var(--color-outline-variant)]/20 flex items-center justify-between px-4 md:px-6 shrink-0
      bg-gradient-to-br from-[var(--color-surface-container-low)]/80 to-[var(--color-surface-container-low)]/90
      backdrop-blur-xl
      border-[var(--color-outline-variant)]/10
      ${className}
    `}>
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Link 
            href={backHref}
            className="flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors font-body text-sm"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Back to List</span>
          </Link>
        )}
        {title && (
          <h2 className="font-headline text-lg text-[var(--color-on-surface)]">{title}</h2>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {showCCStatus && (
          <div className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} border ${status.border}
            shadow-[0_0_10px_rgba(var(--color-primary-rgb, 194,101,42),0.2)]
          `}>
            <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
            <span className={`font-status-mono text-[10px] ${status.text} uppercase tracking-wider`}>
              CC {ccStatus === 'working' ? 'Working' : ccStatus === 'error' ? 'Error' : 'Idle'}
            </span>
          </div>
        )}
        {children}
      </div>
    </header>
  );
}
