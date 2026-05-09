'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  GitBranch,
  ChevronRight,
  Send,
  CheckCircle,
  Loader2,
  User,
  Bot,
  AlertCircle,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/components/ui/Toast';
import type { Task, Priority, SyncMessage } from '@/types';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const { showToast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<SyncMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Fetch task data
  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Task not found');
        } else {
          throw new Error('Failed to fetch task');
        }
        return;
      }
      const data = await res.json();
      setTask(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to load task');
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  // Poll for messages every 5 seconds
  const pollMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      // Silently fail for polling
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    // Initial poll
    pollMessages();
    // Poll every 5 seconds
    const interval = setInterval(pollMessages, 5000);
    return () => clearInterval(interval);
  }, [pollMessages]);

  const getPriorityClass = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const formatTime = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    const userMessage: SyncMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    // Optimistically add user message
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');

    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentInput, type: 'user' }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      // Refresh messages after sending
      await pollMessages();

      // Simulate Claude response after sending
      setTimeout(async () => {
        await pollMessages();
      }, 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove the optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span className="font-body text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            <span className="font-body text-sm">Back to Dashboard</span>
          </Link>
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle size={48} className="text-[var(--color-error)]" />
            <p className="text-[var(--color-on-surface)] font-body">{error || 'Task not found'}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const acceptanceCriteria = [
    'Review code changes thoroughly',
    'Ensure all tests pass',
    'Update documentation if needed',
    'Get approval from team lead',
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] mb-6">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Dashboard</Link>
          <ChevronRight size={14} />
          <Link href="/tasks" className="hover:text-[var(--color-primary)] transition-colors">Task List</Link>
          <ChevronRight size={14} />
          <span className="text-[var(--color-on-surface)]">{task.id.slice(0, 10).toUpperCase()}</span>
        </nav>

        {/* Task Content */}
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
                  {task.id.slice(0, 10).toUpperCase()}
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
              <div className="flex items-center gap-4 mb-6 text-sm flex-wrap">
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
                <span className="text-xs text-[var(--color-outline)]">
                  {formatDate(task.createdAt)}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="code-label text-[var(--color-on-surface-variant)] mb-2">DESCRIPTION</h3>
                <p className="font-body text-sm text-[var(--color-on-surface)] leading-relaxed">
                  {task.description || 'No description provided.'}
                </p>
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="code-label text-[var(--color-on-surface-variant)] mb-2">TAGS</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                
                {/* MR Link Display for Completed Tasks */}
                {task.status === 'completed' && task.result?.url ? (
                  <div className="bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 text-[var(--color-secondary)] mb-2">
                      <CheckCircle size={18} />
                      <span className="font-body text-sm font-semibold">Merge Request Created</span>
                    </div>
                    <a 
                      href={task.result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[var(--color-primary)] text-sm hover:underline break-all mb-1 block"
                    >
                      {task.result.url}
                    </a>
                    {task.result.commitSha && (
                      <code className="text-xs font-mono text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] px-2 py-1 rounded">
                        {task.result.commitSha}
                      </code>
                    )}
                  </div>
                ) : (
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg font-body text-sm font-semibold hover:bg-[var(--color-primary-container)] transition-colors shadow-[0_0_15px_rgba(208,188,255,0.4)]">
                    <GitBranch size={18} />
                    Create Merge Request
                    <ChevronRight size={16} />
                  </button>
                )}
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
                <span className="status-mono text-[var(--color-secondary)] uppercase">
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <div className="w-full bg-[var(--color-surface-container-low)] rounded-full h-2">
                <div 
                  className="bg-[var(--color-primary)] h-2 rounded-full shadow-energy-glow transition-all" 
                  style={{ 
                    width: task.status === 'completed' ? '100%' : 
                           task.status === 'in_progress' ? '50%' : 
                           task.status === 'needs_feedback' ? '75%' : '25%'
                  }} 
                />
              </div>
              <p className="text-xs text-[var(--color-on-surface-variant)] mt-2">
                {task.startedAt 
                  ? `Started ${formatDate(task.startedAt)}`
                  : 'Not started yet'
                }
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
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bot size={48} className="text-[var(--color-outline)] mb-4" />
                    <p className="text-[var(--color-on-surface-variant)] font-body">
                      No messages yet. Start a conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
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
                  ))
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[var(--color-outline-variant)]/30">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                    placeholder="Reply to Claude Code..."
                    className="flex-1 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/50 rounded-xl px-4 py-3 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all font-body"
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isSending}
                    className="px-4 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl hover:bg-[var(--color-primary-container)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(208,188,255,0.4)]"
                  >
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
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
