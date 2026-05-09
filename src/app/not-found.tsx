'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-background)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="font-headline text-[120px] md:text-[180px] font-bold leading-none text-[var(--color-surface-container-high)] select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[var(--color-primary-container)]/30 flex items-center justify-center">
              <Search size={48} className="text-[var(--color-primary)]" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4 mb-8">
          <h2 className="font-headline text-3xl font-bold text-[var(--color-on-background)]">
            Page Not Found
          </h2>
          <p className="font-body text-[var(--color-on-surface-variant)] leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-12 bg-[var(--color-outline-variant)]" />
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          <div className="h-px w-12 bg-[var(--color-outline-variant)]" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Back to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-12 pt-8 border-t border-[var(--color-outline-variant)]/30">
          <p className="font-body text-sm text-[var(--color-on-surface-variant)] mb-4">
            Quick links
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { href: '/tasks', label: 'Tasks' },
              { href: '/archive', label: 'Archive' },
              { href: '/settings', label: 'Settings' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm font-body text-[var(--color-on-surface)] bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
