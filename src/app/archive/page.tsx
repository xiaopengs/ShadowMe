'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  Package,
  ChevronRight
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { ArchiveSkeleton } from '@/components/ui/Skeletons';
import type { Task } from '@/types';

export default function ArchivePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArchivedTasks = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/tasks?status=completed,closed');
        if (!res.ok) throw new Error('Failed to fetch archived tasks');
        const data = await res.json();
        setArchivedTasks(data.tasks || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching archived tasks:', err);
        setError('Failed to load archived tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchivedTasks();
  }, []);

  const filteredTasks = archivedTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const highlightedTask = filteredTasks[0];
  const otherTasks = filteredTasks.slice(1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] mb-6">
          <Link href="/" className="hover:text-[var(--color-primary)] transition-colors">Dashboard</Link>
          <ChevronRight size={14} />
          <span className="text-[var(--color-on-surface)]">Archive</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12">
          <h1 className="font-headline text-4xl md:text-5xl text-[var(--color-on-background)] mb-4">
            Archived Collaborations
          </h1>
          <p className="font-body text-[var(--color-on-surface-variant)] text-lg max-w-2xl">
            A curated historical record of finalized tasks and synced documents from previous iterations of the Shadow Clone protocol.
          </p>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search archive..."
              className="w-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-full py-3 pl-12 pr-4 text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-shadow font-body"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && <ArchiveSkeleton />}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle size={48} className="text-[var(--color-error)]" />
            <p className="text-[var(--color-on-surface)] font-body">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-lg font-body text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Package size={48} className="text-[var(--color-outline)]" />
            <p className="text-[var(--color-on-surface-variant)] font-body text-center">
              {searchQuery 
                ? 'No archived tasks match your search.'
                : 'No archived tasks yet. Completed tasks will appear here.'
              }
            </p>
          </div>
        )}

        {/* Highlighted Task */}
        {!isLoading && !error && highlightedTask && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href={`/tasks/${highlightedTask.id}`}>
              <div className="bg-gradient-to-br from-[var(--color-surface-container)] to-[var(--color-surface-container-low)] rounded-2xl p-6 border border-[var(--color-primary)]/20 shadow-[0_0_30px_rgba(208,188,255,0.15)] hover:shadow-[0_0_40px_rgba(208,188,255,0.25)] transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                      <CheckCircle size={20} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <span className="code-label text-[var(--color-primary)] mb-1 block">
                        {highlightedTask.id.slice(0, 10).toUpperCase()}
                      </span>
                      <h3 className="font-headline text-xl text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                        {highlightedTask.title}
                      </h3>
                    </div>
                  </div>
                  <ExternalLink size={20} className="text-[var(--color-outline)] group-hover:text-[var(--color-primary)] transition-colors" />
                </div>

                <p className="font-body text-[var(--color-on-surface-variant)] mb-4 line-clamp-2">
                  {highlightedTask.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-[var(--color-outline)]">
                    <span className="font-mono">{highlightedTask.createdBy}</span>
                    <span>•</span>
                    <span>{formatDate(highlightedTask.completedAt || highlightedTask.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] rounded text-xs font-mono">
                      {highlightedTask.status === 'completed' ? 'COMPLETED' : 'CLOSED'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Other Tasks Grid */}
        {!isLoading && !error && otherTasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/tasks/${task.id}`}>
                  <div className="bg-[var(--color-surface-container-low)] rounded-xl p-5 border border-[var(--color-outline-variant)]/20 hover:border-[var(--color-outline-variant)]/50 transition-all group cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-3">
                      <span className="code-label text-[var(--color-secondary)]">
                        {task.id.slice(0, 10).toUpperCase()}
                      </span>
                      <ExternalLink size={16} className="text-[var(--color-outline)] group-hover:text-[var(--color-primary)] transition-colors" />
                    </div>

                    <h3 className="font-body text-sm font-semibold text-[var(--color-on-surface)] mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                      {task.title}
                    </h3>

                    <p className="font-body text-xs text-[var(--color-on-surface-variant)] mb-4 line-clamp-2">
                      {task.description || 'No description.'}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-[var(--color-outline)]">
                        {formatDate(task.completedAt || task.updatedAt)}
                      </span>
                      <span className="px-2 py-0.5 bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] rounded text-[10px]">
                        {task.status === 'completed' ? 'Done' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
