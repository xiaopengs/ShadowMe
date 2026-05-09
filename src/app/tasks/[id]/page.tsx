'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  GitBranch,
  ExternalLink,
  Send,
  CheckCircle,
  Loader2,
  User,
  Bot,
  ChevronRight
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import type { Task, Priority } from '@/types';

interface SyncMessage {
  id: string;
  type: 'user' | 'system' | 'claude';
  content: string;
  timestamp: Date;
}

const demoTask: Task = {
  id: 'TASK-8492',
  title: 'Implement dark mode theme configuration parser',
  type: 'code_review',
  priority: 'high',
  status: 'in_progress',
  description: 'Create a parser that extracts theme tokens from Tailwind config and generates CSS variables for our design system. The parser should handle color palette, typography scale, spacing system, and border radius tokens.',
  tags: ['ui', 'theming', 'css', 'tailwind'],
  attachments: [],
  createdBy: 'Alex Johnson',
  createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  updatedAt: new Date().toISOString(),
  startedAt: new Date(Date.now() - 30 * 60000).toISOString(),
};

const acceptanceCriteria = [
  'Extract all color tokens from tailwind.config.js',
  'Generate CSS custom properties in correct format',
  'Support nested theme configurations',
  'Output ready-to-use CSS variables file',
  'Include TypeScript type definitions',
];

const syncMessages: SyncMessage[] = [
  {
    id: 'msg-1',
    type: 'user',
    content: 'Task Triggered: Implement dark mode theme configuration parser',
    timestamp: new Date(Date.now() - 30 * 60000),
  },
  {
    id: 'msg-2',
    type: 'system',
    content: 'Claude Code initialized with context: tailwind.config.js, design-tokens.md',
    timestamp: new Date(Date.now() - 29 * 60000),
  },
  {
    id: 'msg-3',
    type: 'claude',
    content: 'Analyzing Tailwind configuration structure...\n\nFound 47 color tokens, 12 typography scales, 8 spacing values, 6 border radius presets.',
    timestamp: new Date(Date.now() - 28 * 60000),
  },
  {
    id: 'msg-4',
    type: 'system',
    content: '> Reading tailwind.config.js\n> Extracting semantic tokens\n> Building CSS variables...\n\nProgress: Analyzing AST (Abstract Syntax Tree)',
    timestamp: new Date(Date.now() - 25 * 60000),
  },
  {
    id: 'msg-5',
    type: 'claude',
    content: 'Starting implementation. Creating theme-parser.ts with token extraction logic...',
    timestamp: new Date(Date.now() - 20 * 60000),
  },
];

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<SyncMessage[]>(syncMessages);
  const [inputValue, setInputValue] = useState('');

  const task = demoTask; // In real app, fetch by params.id

  const getPriorityClass = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: SyncMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate Claude response
    setTimeout(() => {
      const claudeResponse: SyncMessage = {
        id: `msg-${Date.now()}`,
        type: 'claude',
        content: 'Processing your request. Analyzing the codebase structure to provide accurate context...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, claudeResponse]);
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          <span className="font-body text-sm">Back to Dashboard</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Task Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Task Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/30 shadow-[var(--shadow-card)]"
            >
              {/* Task ID & Status */}
              <div className="flex items-center justify-between mb-4">
                <span className="code-label text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded">
                  {task.id}
                </span>
                <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-headline text-2xl text-[var(--color-on-surface)] mb-4">
                {task.title}
              </h1>

              {/* Meta Info */}
              <div className="flex items-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                    alt={task.createdBy}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-[var(--color-on-surface-variant)]">{task.createdBy}</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--color-outline)]">
                  <GitBranch size={14} />
                  <span className="text-xs">main</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="code-label text-[var(--color-on-surface-variant)] mb-2">DESCRIPTION</h3>
                <p className="font-body text-sm text-[var(--color-on-surface)] leading-relaxed">
                  {task.description}
                </p>
              </div>

              {/* Acceptance Criteria */}
              <div className="mb-6">
                <h3 className="code-label text-[var(--color-on-surface-variant)] mb-3">ACCEPTANCE CRITERIA</h3>
                <ul className="space-y-2">
                  {acceptanceCriteria.map((criteria, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-[var(--color-secondary)] mt-0.5 flex-shrink-0" />
                      <span className="font-body text-sm text-[var(--color-on-surface)]">{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* GitLab Integration */}
              <div className="pt-4 border-t border-[var(--color-outline-variant)]/30">
                <h3 className="code-label text-[var(--color-on-surface-variant)] mb-3">GITLAB INTEGRATION</h3>
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg font-body text-sm font-semibold hover:bg-[var(--color-primary-container)] transition-colors shadow-[0_0_15px_rgba(208,188,255,0.4)]">
                  <GitBranch size={18} />
                  Create Merge Request
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>

            {/* Task Status Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--color-surface-container)] rounded-xl p-4 border border-[var(--color-outline-variant)]/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="code-label text-[var(--color-on-surface)]">TASK STATUS</span>
                <span className="status-mono text-[var(--color-secondary)] uppercase animate-pulse">
                  In Progress
                </span>
              </div>
              <div className="w-full bg-[var(--color-surface-container-low)] rounded-full h-2">
                <div 
                  className="bg-[var(--color-primary)] h-2 rounded-full shadow-energy-glow transition-all" 
                  style={{ width: '35%' }} 
                />
              </div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-2">
                Processing: Analyzing Tailwind configuration...
              </p>
            </motion.div>
          </div>

          {/* Right Column: CC Sync Log */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)]/30 shadow-[var(--shadow-card)] flex flex-col h-[calc(100vh-180px)] min-h-[600px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-outline-variant)]/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)]/20 flex items-center justify-center">
                    <Bot size={18} className="text-[var(--color-secondary)]" />
                  </div>
                  <div>
                    <h3 className="font-body text-sm font-semibold text-[var(--color-on-surface)]">
                      Claude Code Sync Log
                    </h3>
                    <p className="text-xs text-[var(--color-on-surface-variant)]">
                      Real-time collaboration stream
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse" />
                  <span className="status-mono text-[var(--color-secondary)] text-[10px]">LIVE</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${msg.type === 'user' 
                        ? 'bg-[var(--color-primary)]/20' 
                        : msg.type === 'claude'
                          ? 'bg-[var(--color-secondary)]/20'
                          : 'bg-[var(--color-outline)]/20'
                      }
                    `}>
                      {msg.type === 'user' ? (
                        <User size={16} className="text-[var(--color-primary)]" />
                      ) : msg.type === 'claude' ? (
                        <Bot size={16} className="text-[var(--color-secondary)]" />
                      ) : (
                        <Loader2 size={14} className="text-[var(--color-outline)] animate-spin" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`max-w-[80%] ${msg.type === 'user' ? 'text-right' : ''}`}>
                      <div className={`
                        inline-block px-4 py-2 rounded-2xl text-sm font-body
                        ${msg.type === 'user' 
                          ? 'bg-[var(--color-primary)]/10 text-[var(--color-on-surface)] rounded-tr-sm' 
                          : msg.type === 'claude'
                            ? 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] rounded-tl-sm'
                            : 'bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] text-xs font-mono'
                        }
                      `}>
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i} className={line.startsWith('>') ? 'text-[var(--color-secondary)]' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                      <p className="text-[10px] text-[var(--color-outline)] mt-1 px-1">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[var(--color-outline-variant)]/30">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Reply to Claude Code..."
                    className="flex-1 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/50 rounded-xl px-4 py-3 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all font-body"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="px-4 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl hover:bg-[var(--color-primary-container)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(208,188,255,0.4)]"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[10px] text-[var(--color-outline)] mt-2 text-center">
                  Claude Code processes requests locally • No data leaves your machine
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
