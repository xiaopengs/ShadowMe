'use client';

import React from 'react';

/**
 * Dashboard Skeleton
 * Loading skeleton for the main dashboard page
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-10 w-64 bg-[var(--color-surface-container-high)] rounded-lg" />
          <div className="h-4 w-48 bg-[var(--color-surface-container-high)] rounded" />
        </div>
        <div className="h-10 w-32 bg-[var(--color-surface-container-high)] rounded-lg" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-20 bg-[var(--color-surface-container-high)] rounded" />
              <div className="h-8 w-8 bg-[var(--color-surface-container-high)] rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-[var(--color-surface-container-high)] rounded" />
          </div>
        ))}
      </div>

      {/* Kanban Board Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-[var(--color-surface-container-high)] rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, colIdx) => (
            <div
              key={colIdx}
              className="bg-[var(--color-surface-container-low)] rounded-xl p-4 min-h-[300px]"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-outline-variant)]/20">
                <div className="h-5 w-24 bg-[var(--color-surface-container-high)] rounded" />
                <div className="h-6 w-6 bg-[var(--color-surface-container-high)] rounded-full" />
              </div>
              <div className="space-y-3">
                {[...Array(2 + Math.floor(Math.random() * 2))].map((_, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="bg-[var(--color-surface-container-high)] rounded-lg p-4"
                  >
                    <div className="h-4 w-3/4 bg-[var(--color-surface-container-highest)] rounded mb-3" />
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-[var(--color-surface-container-highest)] rounded" />
                      <div className="h-3 w-16 bg-[var(--color-surface-container-highest)] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Task List Skeleton
 * Loading skeleton for the task list page
 */
export function TaskListSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-[var(--color-surface-container-high)] rounded-lg" />
          <div className="h-4 w-56 bg-[var(--color-surface-container-high)] rounded" />
        </div>
        <div className="h-10 w-28 bg-[var(--color-surface-container-high)] rounded-lg" />
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-[var(--color-surface-container-high)] rounded-lg" />
          </div>
          <div className="flex gap-3 flex-wrap">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 w-28 bg-[var(--color-surface-container-high)] rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-[var(--color-surface-container-low)] rounded-xl p-5 border border-[var(--color-outline-variant)]/20"
          >
            <div className="flex items-start gap-4">
              {/* Priority indicator */}
              <div className="h-3 w-3 mt-1.5 bg-[var(--color-surface-container-high)] rounded-full" />
              
              {/* Content */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-2/3 bg-[var(--color-surface-container-high)] rounded" />
                  <div className="h-5 w-20 bg-[var(--color-surface-container-high)] rounded-full" />
                </div>
                <div className="h-3 w-full bg-[var(--color-surface-container-high)] rounded" />
                <div className="flex items-center gap-4">
                  <div className="h-6 w-24 bg-[var(--color-surface-container-high)] rounded" />
                  <div className="h-3 w-20 bg-[var(--color-surface-container-high)] rounded" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-[var(--color-surface-container-high)] rounded-lg" />
                <div className="h-8 w-8 bg-[var(--color-surface-container-high)] rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Task Detail Skeleton
 * Loading skeleton for the task detail page
 */
export function TaskDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Back button */}
      <div className="h-8 w-24 bg-[var(--color-surface-container-high)] rounded mb-6" />

      {/* Main content */}
      <div className="bg-[var(--color-surface-container-low)] rounded-2xl p-6 md:p-8 border border-[var(--color-outline-variant)]/20">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-3 flex-1">
            <div className="h-8 w-3/4 bg-[var(--color-surface-container-high)] rounded-lg" />
            <div className="flex items-center gap-3">
              <div className="h-6 w-24 bg-[var(--color-surface-container-high)] rounded-full" />
              <div className="h-6 w-16 bg-[var(--color-surface-container-high)] rounded-full" />
              <div className="h-6 w-20 bg-[var(--color-surface-container-high)] rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-[var(--color-surface-container-high)] rounded-lg" />
            <div className="h-10 w-10 bg-[var(--color-surface-container-high)] rounded-lg" />
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <div className="h-4 w-20 bg-[var(--color-surface-container-high)] rounded mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-[var(--color-surface-container-high)] rounded" />
            <div className="h-4 w-5/6 bg-[var(--color-surface-container-high)] rounded" />
            <div className="h-4 w-4/6 bg-[var(--color-surface-container-high)] rounded" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-8">
          <div className="h-11 w-32 bg-[var(--color-surface-container-high)] rounded-lg" />
          <div className="h-11 w-40 bg-[var(--color-surface-container-high)] rounded-lg" />
        </div>

        {/* Messages section */}
        <div>
          <div className="h-5 w-28 bg-[var(--color-surface-container-high)] rounded mb-4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl ${
                  i % 2 === 0 
                    ? 'bg-[var(--color-surface-container-high)] ml-8' 
                    : 'bg-[var(--color-primary-container)]/20 mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-4 bg-[var(--color-surface-container-high)] rounded-full" />
                  <div className="h-3 w-16 bg-[var(--color-surface-container-high)] rounded" />
                </div>
                <div className="h-3 w-full bg-[var(--color-surface-container-high)] rounded mb-1" />
                <div className="h-3 w-4/5 bg-[var(--color-surface-container-high)] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Archive Skeleton
 * Loading skeleton for the archive page
 */
export function ArchiveSkeleton() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-16 bg-[var(--color-surface-container-high)] rounded" />
        <div className="h-4 w-4 bg-[var(--color-surface-container-high)] rounded" />
        <div className="h-4 w-16 bg-[var(--color-surface-container-high)] rounded" />
      </div>

      {/* Header */}
      <div className="mb-12 space-y-3">
        <div className="h-10 w-72 bg-[var(--color-surface-container-high)] rounded-lg" />
        <div className="h-5 w-96 bg-[var(--color-surface-container-high)] rounded" />
      </div>

      {/* Search */}
      <div className="max-w-md mb-8">
        <div className="h-12 bg-[var(--color-surface-container-high)] rounded-full" />
      </div>

      {/* Archive cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-[var(--color-surface-container-low)] rounded-xl p-5 border border-[var(--color-outline-variant)]/20"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-5 w-5 bg-[var(--color-surface-container-high)] rounded" />
              <div className="h-4 w-20 bg-[var(--color-surface-container-high)] rounded" />
            </div>
            <div className="h-5 w-full bg-[var(--color-surface-container-high)] rounded mb-2" />
            <div className="h-4 w-4/5 bg-[var(--color-surface-container-high)] rounded mb-4" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-[var(--color-surface-container-high)] rounded-full" />
              <div className="h-4 w-24 bg-[var(--color-surface-container-high)] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default {
  DashboardSkeleton,
  TaskListSkeleton,
  TaskDetailSkeleton,
  ArchiveSkeleton,
};
