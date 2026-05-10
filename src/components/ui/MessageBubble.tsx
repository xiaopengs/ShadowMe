/**
 * MessageBubble Component - Enhanced with Performance Optimization
 * Features: React.memo, stable callbacks
 */
'use client';

import React, { memo, useMemo } from 'react';

interface MessageBubbleProps {
  type: 'user' | 'claude';
  content: string;
  timestamp?: string;
  className?: string;
}

const MessageBubble = memo(function MessageBubble({ 
  type, 
  content, 
  timestamp, 
  className = '' 
}: MessageBubbleProps) {
  const isUser = type === 'user';
  
  const formatTime = useMemo(() => {
    return (ts?: string) => {
      if (!ts) return '';
      const date = new Date(ts);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };
  }, []);

  const timeString = useMemo(() => {
    return formatTime(timestamp);
  }, [timestamp, formatTime]);

  // Determine message role for accessibility
  const role = isUser ? 'user' : 'assistant';
  const ariaLabel = isUser ? 'You' : 'Claude Code';

  return (
    <article 
      className={`flex flex-col gap-1 w-full max-w-[90%] ${isUser ? 'items-end self-end' : 'items-start self-start'} ${className}`}
      role={role}
      aria-label={`${ariaLabel}${timeString ? ` at ${timeString}` : ''}`}
    >
      {/* Timestamp */}
      <span className="font-body text-xs text-[var(--color-on-surface-variant)] px-2">
        <span className="sr-only">{ariaLabel}</span>
        <span aria-hidden="true">
          {isUser ? 'You' : 'Claude Code'} {timestamp ? `• ${timeString}` : ''}
        </span>
      </span>
      
      {/* Message Content */}
      <div 
        className={`
          p-4 rounded-2xl font-body text-sm leading-relaxed
          ${isUser 
            ? 'bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/30 rounded-tr-sm' 
            : 'bg-[var(--color-primary)]/10 text-[var(--color-on-surface)] border border-[var(--color-primary)]/30 rounded-tl-sm'
          }
        `}
      >
        {content}
      </div>
    </article>
  );
});

export default MessageBubble;
