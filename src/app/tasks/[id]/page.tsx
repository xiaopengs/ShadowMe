'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  GitBranch,
  ChevronRight,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import GlassHeader from '@/components/ui/GlassHeader';
import CCSyncLog from '@/components/ui/CCSyncLog';
import { TaskDetailSkeleton } from '@/components/ui/Skeletons';
import type { Task, Priority, SyncMessage } from '@/types';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<SyncMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Demo messages for terminal style
  const [demoMessages] = useState<SyncMessage[]>([
    {
      id: 'msg-1',
      type: 'user',
      content: '@ClaudeCode Please analyze `auth.ts` and draft a refactoring plan to implement Redis caching as described in the task.',
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: 'msg-2',
      type: 'system',
      content: 'Task Triggered',
      timestamp: new Date(Date.now() - 295000).toISOString(),
    },
    {
      id: 'msg-3',
      type: 'claude',
      content: '> Analyzing src/api/middleware/auth.ts...\n> Found 3 dependencies: DatabaseClient, Logger, MetricService.\n> Identifying bottleneck: Await DatabaseClient.verifyToken(token) on line 42.\n> Proposing Redis integration pattern: Cache-Aside.\n> Generating diff for review...',
      timestamp: new Date(Date.now() - 290000).toISOString(),
    },
    {
      id: 'msg-4',
      type: 'claude',
      content: 'I have analyzed the middleware. The primary bottleneck is the direct database query on line 42. I\'ve drafted a plan to introduce a Redis cache layer.\n\nI\'ve committed the preliminary changes to the feature branch. Please review the diff in GitLab before I run the unit tests.',
      timestamp: new Date(Date.now() - 280000).toISOString(),
    },
  ]);

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

    // Use demo messages for now
    setMessages(prev => [...demoMessages, userMessage]);
    setInputValue('');

    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputValue, type: 'user' }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      await pollMessages();

      // Simulate Claude response after sending
      setTimeout(async () => {
        await pollMessages();
      }, 2000);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <GlassHeader showBackButton backHref="/tasks" />
        <TaskDetailSkeleton />
      </AppLayout>
    );
  }

  // Error state
  if (error || !task) {
    return (
      <AppLayout>
        <GlassHeader showBackButton backHref="/tasks" />
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle size={48} className="text-[var(--color-error)]" />
            <p className="text-[var(--color-on-surface)] font-body">{error || 'Task not found'}</p>
            <Link 
              href="/tasks"
              className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg font-body text-sm"
            >
              Back to Task List
            </Link>
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

  // Determine CC status based on task state
  const ccStatus = task.status === 'in_progress' ? 'working' : task.status === 'completed' ? 'idle' : 'idle';

  return (
    <AppLayout>
      {/* Glass Header */}
      <GlassHeader 
        showBackButton 
        backHref="/tasks" 
        showCCStatus 
        ccStatus={ccStatus}
      />
      
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] mb-6">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Dashboard</Link>
          <ChevronRight size={12} />
          <Link href="/tasks" className="hover:text-[var(--color-primary)] transition-colors">Task List</Link>
          <ChevronRight size={12} />
          <span className="text-[var(--color-on-surface)]">{task.id.slice(0, 10).toUpperCase()}</span>
        </nav>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-6 items-start">
          {/* Left Column: Task Details */}
          <section className="
            rounded-xl p-6 flex flex-col gap-6
            bg-gradient-to-br from-[var(--color-surface-container-low)]/80 to-[var(--color-surface-container-low)]/90
            backdrop-blur-xl border border-[var(--color-outline-variant)]/10
            shadow-[0_8px_32px_rgba(0,0,0,0.1)]
          ">
            {/* Task ID & Title */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-code-label text-[10px] text-[var(--color-secondary)] mb-2">{task.id.slice(0, 10).toUpperCase()}</p>
                <h1 className="font-headline text-2xl md:text-3xl text-[var(--color-on-surface)] leading-tight">
                  {task.title}
                </h1>
              </div>
              <button className="w-10 h-10 rounded-lg bg-[var(--color-surface-variant)] hover:bg-[var(--color-surface-bright)] flex items-center justify-center text-[var(--color-on-surface-variant)] transition-colors border border-[var(--color-outline-variant)]/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </div>

            {/* Meta Info Bar */}
            <div className="flex flex-wrap gap-4 items-center py-4 border-y border-[var(--color-outline-variant)]/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface-bright)] border border-[var(--color-outline-variant)]/50 overflow-hidden shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                    alt={task.createdBy}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-body text-xs text-[var(--color-on-surface-variant)]">Created by</span>
                  <span className="font-body text-xs font-medium text-[var(--color-on-surface)]">{task.createdBy}</span>
                </div>
              </div>
              
              <div className="h-8 w-px bg-[var(--color-outline-variant)]/30 hidden md:block" />
              
              <div className="flex flex-col">
                <span className="font-body text-xs text-[var(--color-on-surface-variant)]">Priority</span>
                <span className={`font-body text-xs font-medium flex items-center gap-1 ${getPriorityClass(task.priority)}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L4 20h16L12 2z" />
                  </svg>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>
              
              <div className="h-8 w-px bg-[var(--color-outline-variant)]/30 hidden md:block" />
              
              <div className="flex flex-col">
                <span className="font-body text-xs text-[var(--color-on-surface-variant)]">Target Branch</span>
                <span className="font-code-label text-[10px] text-[var(--color-secondary)] bg-[var(--color-surface-container)] px-2 py-0.5 rounded border border-[var(--color-outline-variant)]/30">
                  feature/auth-v2
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="font-body text-sm text-[var(--color-on-surface-variant)] leading-relaxed">
                {task.description || 'No description provided.'}
              </p>
              
              <h3 className="font-headline text-base text-[var(--color-on-surface)] mt-6 mb-3">Acceptance Criteria:</h3>
              <ul className="space-y-2">
                {acceptanceCriteria.map((criteria, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-[var(--color-secondary)] mt-0.5 flex-shrink-0" />
                    <span className="font-body text-sm text-[var(--color-on-surface-variant)]">{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* GitLab Integration */}
            <div className="mt-auto pt-6 border-t border-[var(--color-outline-variant)]/20">
              <div className="bg-[var(--color-surface-container)] rounded-lg p-4 border border-[var(--color-outline-variant)]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-secondary)]/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-secondary)]">
                      <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body text-sm font-medium text-[var(--color-on-surface)]">GitLab Integration</span>
                    <span className="font-body text-xs text-[var(--color-on-surface-variant)]">Branch created, ready for merge request.</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg font-body text-sm font-medium hover:bg-[var(--color-primary-container)] transition-all shadow-[0_0_15px_rgba(var(--color-primary-rgb, 194,101,42),0.3)] flex items-center gap-2">
                  Create MR
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: CC Sync Log - Terminal Style */}
          <section className="h-[calc(100vh-140px)] lg:h-auto lg:max-h-[calc(100vh-140px)]">
            <CCSyncLog
              messages={messages.length > 0 ? messages : demoMessages}
              onSendMessage={handleSendMessage}
              isLoading={isSending}
              className="h-full"
            />
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
