/**
 * Message Bubble Component
 * Design: Different styles for user and Claude messages
 * Source: detail_log_1/code.html
 */
'use client';

import React from 'react';

interface MessageBubbleProps {
  type: 'user' | 'claude';
  content: string;
  timestamp?: string;
  className?: string;
}

export default function MessageBubble({ type, content, timestamp, className = '' }: MessageBubbleProps) {
  const isUser = type === 'user';
  
  const formatTime = (ts?: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col gap-1 w-full max-w-[90%] ${isUser ? 'items-end self-end' : 'items-start self-start'} ${className}`}>
      {/* Timestamp */}
      <span className="font-body text-xs text-[var(--color-on-surface-variant)] px-2">
        {isUser ? 'You' : 'Claude Code'} {timestamp ? `• ${formatTime(timestamp)}` : ''}
      </span>
      
      {/* Message Content */}
      <div className={`
        p-4 rounded-2xl font-body text-sm leading-relaxed
        ${isUser 
          ? 'bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/30 rounded-tr-sm' 
          : 'bg-[var(--color-primary)]/10 text-[var(--color-on-surface)] border border-[var(--color-primary)]/30 rounded-tl-sm'
        }
      `}>
        {content}
      </div>
    </div>
  );
}
