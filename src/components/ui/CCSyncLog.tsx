/**
 * CCSyncLog Component
 * Design: Terminal-style communication log with terminal blocks and message bubbles
 * Source: detail_log_1/code.html
 */
'use client';

import React from 'react';
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

export default function CCSyncLog({ 
  messages, 
  onSendMessage, 
  onAttach,
  isLoading = false,
  className = '' 
}: CCSyncLogProps) {
  return (
    <div className={`flex flex-col rounded-xl overflow-hidden bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 shadow-lg ${className}`}>
      {/* Header */}
      <div className={`
        flex items-center justify-between p-4 border-b border-[var(--color-outline-variant)]/30 shrink-0
        bg-gradient-to-br from-[var(--color-surface-container-low)]/80 to-[var(--color-surface-container-low)]/90
        backdrop-blur-xl
      `}>
        <h3 className="font-headline text-base text-[var(--color-on-surface)] flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-primary)]">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          CC Sync Log
        </h3>
        <button className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors p-1">
          <Filter size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-surface-container-highest)]/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-outline)]">
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
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <CCTerminalBlock content={msg.content} />
                </motion.div>
              );
            }

            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {showDivider && <SystemDivider label="Task Triggered" />}
                <MessageBubble type={msg.type} content={msg.content} timestamp={msg.timestamp} />
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="rounded-b-xl overflow-hidden">
        <ChatInput 
          onSend={onSendMessage} 
          disabled={isLoading}
          placeholder="Reply to Claude Code..."
        />
      </div>
    </div>
  );
}
