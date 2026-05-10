/**
 * CCSyncLog Component - Enhanced with Accessibility & Performance
 * Features: ARIA attributes, keyboard navigation, React.memo
 */
'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import CCTerminalBlock from './CCTerminalBlock';
import SystemDivider from './SystemDivider';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import GlassHeader from './GlassHeader';
import type { SyncMessage } from '@/types';

interface CCSyncLogProps {
  messages: SyncMessage[];
  onSendMessage: (message: string) => void;
  onAttach?: () => void;
  isLoading?: boolean;
  className?: string;
}

// Memoized empty state component
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center mb-4">
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          className="text-[var(--color-outline)]"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="text-[var(--color-on-surface-variant)] font-body text-sm">
        No messages yet. Start a conversation!
      </p>
      <p className="text-[var(--color-outline)] font-body text-xs mt-1">
        Ask Claude Code to analyze, plan, or help with your task
      </p>
    </div>
  );
});

function CCSyncLog({ 
  messages, 
  onSendMessage, 
  onAttach,
  isLoading = false,
  className = '' 
}: CCSyncLogProps) {
  return (
    <article 
      className={`flex flex-col rounded-xl overflow-hidden bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 shadow-lg ${className}`}
      aria-label="Claude Code sync log"
    >
      {/* Header */}
      <header 
        className={`
          flex items-center justify-between p-4 border-b border-[var(--color-outline-variant)]/30 shrink-0
          bg-gradient-to-br from-[var(--color-surface-container-low)]/80 to-[var(--color-surface-container-low)]/90
          backdrop-blur-xl
        `}
      >
        <h2 className="font-headline text-base text-[var(--color-on-surface)] flex items-center gap-2">
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            className="text-[var(--color-primary)]"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>CC Sync Log</span>
        </h2>
        <button 
          className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors p-1"
          aria-label="Filter messages"
        >
          <Filter size={18} />
        </button>
      </header>

      {/* Messages Area */}
      <section 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-surface-container-highest)]/50"
        aria-label="Messages"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, index) => {
            // System divider between message groups
            const showDivider = index > 0 && (
              (messages[index - 1].type === 'user' && msg.type !== 'user') ||
              (messages[index - 1].type === 'claude' && msg.type === 'user')
            );

            if (msg.type === 'system') {
              return <SystemDivider key={msg.id} label={msg.content} />;
            }

            if (msg.type === 'claude' && msg.content.startsWith('>')) {
              return (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CCTerminalBlock content={msg.content} />
                </motion.div>
              );
            }

            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
              >
                {showDivider && <SystemDivider label="Task Triggered" />}
                <MessageBubble 
                  type={msg.type === 'user' ? 'user' : 'claude'} 
                  content={msg.content} 
                  timestamp={msg.timestamp} 
                />
              </motion.div>
            );
          })
        )}
      </section>

      {/* Input Area */}
      <footer className="rounded-b-xl overflow-hidden">
        <ChatInput 
          onSend={onSendMessage} 
          disabled={isLoading}
          placeholder="Reply to Claude Code..."
          aria-label="Send message to Claude Code"
        />
      </footer>
    </article>
  );
}

export default memo(CCSyncLog);
