'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  LibraryBooks,
  CheckCircle,
  ExternalLink,
  Archive
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

interface ArchivedTask {
  id: string;
  title: string;
  description: string;
  category: string;
  completedDate: string;
  creator: string;
  sourceUrl?: string;
  isHighlighted?: boolean;
}

const archivedTasks: ArchivedTask[] = [
  {
    id: 'task-arch-001',
    title: 'Neural Sync Protocol Refactor',
    description: 'Complete overhaul of the bi-directional syncing mechanism between local context and remote GitLab repositories, reducing latency by 40%.',
    category: 'Architecture',
    completedDate: 'Oct 12, 2023',
    creator: 'E. Thorne',
    sourceUrl: '#',
    isHighlighted: true,
  },
  {
    id: 'task-arch-002',
    title: 'Context Window Optimization',
    description: 'Improved context compression algorithms for handling larger codebases.',
    category: 'Performance',
    completedDate: 'Sep 28, 2023',
    creator: 'M. Chen',
  },
  {
    id: 'task-arch-003',
    title: 'Auto-Rollback机制实现',
    description: 'Implemented automatic rollback for failed deployments.',
    category: 'DevOps',
    completedDate: 'Sep 15, 2023',
    creator: 'K. Wang',
  },
  {
    id: 'task-arch-004',
    title: 'GitLab Integration v2',
    description: 'Enhanced MR creation and review workflow integration.',
    category: 'Integration',
    completedDate: 'Aug 30, 2023',
    creator: 'L. Zhang',
  },
];

export default function ArchivePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = archivedTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const highlightedTask = filteredTasks.find(t => t.isHighlighted);
  const otherTasks = filteredTasks.filter(t => !t.isHighlighted);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
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

        {/* Archive Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Highlighted Recent Archive */}
          {highlightedTask && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-1 md:col-span-8 bg-[var(--color-surface-container-low)] rounded-2xl p-8 border border-[var(--color-outline-variant)]/40 shadow-[var(--shadow-card)] hover:border-[var(--color-primary)]/30 transition-colors group"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)] text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full font-label">
                  {highlightedTask.category}
                </span>
                <span className="text-[var(--color-tertiary)] font-body text-sm flex items-center gap-1">
                  <CheckCircle size={14} />
                  Completed {highlightedTask.completedDate}
                </span>
              </div>

              <h3 className="font-headline text-2xl md:text-3xl text-[var(--color-on-surface)] mb-3 group-hover:text-[var(--color-primary)] transition-colors">
                {highlightedTask.title}
              </h3>
              <p className="font-body text-[var(--color-on-surface-variant)] mb-6 line-clamp-2">
                {highlightedTask.description}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-[var(--color-outline-variant)]/30">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                    alt={highlightedTask.creator}
                    className="w-8 h-8 rounded-full border border-[var(--color-outline-variant)]"
                  />
                  <span className="font-body text-sm text-[var(--color-on-surface)] font-medium">
                    Original Creator: {highlightedTask.creator}
                  </span>
                </div>
                {highlightedTask.sourceUrl && (
                  <a
                    href={highlightedTask.sourceUrl}
                    className="flex items-center gap-2 text-[var(--color-primary)] font-body text-sm hover:underline underline-offset-4 decoration-[var(--color-primary)]/50"
                  >
                    <span>GitLab Source</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </motion.article>
          )}

          {/* Metrics/Stats Card */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-4 bg-[var(--color-surface-container)] rounded-2xl p-8 border border-[var(--color-outline-variant)]/40 shadow-[var(--shadow-card)] flex flex-col justify-center"
          >
            <div className="text-center">
              <LibraryBooks size={40} className="text-[var(--color-primary)] mx-auto mb-4" />
              <div className="font-headline text-6xl text-[var(--color-on-surface)] mb-2">
                {archivedTasks.length + 138}
              </div>
              <p className="font-body text-[var(--color-on-surface-variant)] text-sm uppercase tracking-wider font-bold">
                Total Archived Tasks
              </p>
            </div>
          </motion.aside>

          {/* Other Archived Tasks */}
          {otherTasks.map((task, index) => (
            <motion.article
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="col-span-1 md:col-span-4 bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/30 shadow-[var(--shadow-card)] hover:border-[var(--color-primary)]/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="bg-[var(--color-surface-variant)]/50 text-[var(--color-on-surface-variant)] text-[10px] font-semibold uppercase tracking-wider py-1 px-2 rounded font-label">
                  {task.category}
                </span>
                <span className="text-[var(--color-outline)] text-xs">
                  {task.completedDate}
                </span>
              </div>

              <h3 className="font-headline text-lg text-[var(--color-on-surface)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                {task.title}
              </h3>
              <p className="font-body text-sm text-[var(--color-on-surface-variant)] line-clamp-2 mb-4">
                {task.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-outline-variant)]/20">
                <span className="text-xs text-[var(--color-outline)]">
                  by {task.creator}
                </span>
                <button className="text-[var(--color-primary)] text-xs hover:underline flex items-center gap-1">
                  <Archive size={12} />
                  View
                </button>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-16">
            <Archive size={48} className="text-[var(--color-outline)] mx-auto mb-4" />
            <h3 className="font-headline text-xl text-[var(--color-on-surface)] mb-2">
              No archived tasks found
            </h3>
            <p className="font-body text-[var(--color-on-surface-variant)]">
              Try adjusting your search query
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
