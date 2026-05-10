'use client';

import React, { useState, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ListTodo,
  Archive,
  Settings,
  RefreshCw,
  HelpCircle,
  FileText,
  Bot,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Task List', icon: ListTodo },
  { href: '/archive', label: 'Archive', icon: Archive },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const StatusIndicator = memo(function StatusIndicator({ status }: { status: string }) {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
      case 'busy': return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]';
      case 'offline': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'online': return 'Active';
      case 'busy': return 'Working';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <>
      <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`} aria-hidden="true" />
      <span className="text-[10px] text-[var(--color-on-surface-variant)] truncate">
        Local Claude Code: {getStatusLabel()}
      </span>
    </>
  );
});

function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { state } = useApp();
  const [syncLoading, setSyncLoading] = useState(false);

  const handleSyncCC = useCallback(async () => {
    setSyncLoading(true);
    console.log('Syncing Claude Code...');
    setTimeout(() => setSyncLoading(false), 1000);
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/20 blur-xl" aria-hidden="true" />
            <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/10 blur-md animate-pulse" aria-hidden="true" />
            <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center border-2 border-[var(--color-primary)] shadow-[0_0_12px_rgba(var(--color-primary-rgb, 194,101,42),0.5)] overflow-hidden">
              <Bot size={22} className="text-white" aria-hidden="true" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-surface-container-low)] ${
                state.shadow.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                state.shadow.status === 'busy' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' :
                state.shadow.status === 'offline' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                'bg-gray-500'
              }`}
              role="status"
              aria-label={`Status: ${state.shadow.status}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-headline text-base font-bold text-[var(--color-primary)] truncate tracking-tight">
              Shadow Me
            </h1>
            <div className="flex items-center gap-1.5">
              <StatusIndicator status={state.shadow.status} />
            </div>
          </div>
        </div>
      </div>

      <nav
        className="flex-1 px-3 space-y-1"
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative
                ${isActive
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-r-4 border-[var(--color-primary)] font-medium shadow-[inset_2px_0_12px_rgba(var(--color-primary-rgb, 194,101,42),0.15)]'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-variant)]/50 hover:text-[var(--color-on-surface)]'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--color-primary)] shadow-[0_0_10px_rgba(var(--color-primary-rgb, 194,101,42),0.5)]" aria-hidden="true" />
              )}
              <Icon size={20} className={isActive ? 'opacity-100' : 'opacity-70'} aria-hidden="true" />
              <span className="font-body text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 mt-auto space-y-3">
        <button
          onClick={handleSyncCC}
          disabled={syncLoading}
          className="
            w-full py-2.5
            bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)] text-[var(--color-secondary)]
            rounded-lg font-code-label text-[10px] tracking-wider
            hover:bg-[var(--color-secondary)]/20
            transition-all duration-200
            flex items-center justify-center gap-2
            shadow-[0_0_10px_rgba(76,215,246,0.2)]
            active:scale-[0.98]
            disabled:opacity-70 disabled:cursor-not-allowed
          "
          aria-label="Sync Claude Code"
          aria-busy={syncLoading}
        >
          <RefreshCw size={14} className={`${syncLoading ? 'animate-spin-slow' : ''}`} aria-hidden="true" />
          {syncLoading ? 'SYNCING...' : 'SYNC CC'}
        </button>

        <div className="pt-3 border-t border-[var(--color-outline-variant)]/30 space-y-1">
          <Link
            href="/support"
            className="flex items-center gap-2 text-[var(--color-on-surface-variant)] py-2 px-3 rounded-lg hover:bg-[var(--color-surface-variant)]/50 hover:text-[var(--color-on-surface)] transition-all duration-150 text-xs font-body"
          >
            <HelpCircle size={14} aria-hidden="true" />
            Support
          </Link>
          <Link
            href="/docs"
            className="flex items-center gap-2 text-[var(--color-on-surface-variant)] py-2 px-3 rounded-lg hover:bg-[var(--color-surface-variant)]/50 hover:text-[var(--color-on-surface)] transition-all duration-150 text-xs font-body"
          >
            <FileText size={14} aria-hidden="true" />
            Documentation
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-30 border-r border-[var(--color-outline-variant)]/20"
        style={{
          background: 'linear-gradient(to bottom, var(--color-surface-container-low), var(--color-surface-container))',
        }}
        role="complementary"
        aria-label="Sidebar"
      >
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            id="mobile-menu"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-64 flex flex-col z-50 md:hidden border-r border-[var(--color-outline-variant)]/20"
            style={{
              background: 'linear-gradient(to bottom, var(--color-surface-container-low), var(--color-surface-container))',
            }}
            role="dialog"
            aria-label="Mobile navigation menu"
            aria-modal="true"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

export default memo(Sidebar);
