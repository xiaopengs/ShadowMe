/**
 * Sidebar Component - Enhanced with Accessibility & Performance
 * Features: ARIA attributes, keyboard navigation, React.memo optimization
 */
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
  ChevronDown,
  Palette,
} from 'lucide-react';
import { useTheme, THEMES, type Theme } from '@/context/ThemeContext';
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

// Memoized status indicator to prevent unnecessary re-renders
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

// Memoized theme dropdown item
const ThemeDropdownItem = memo(function ThemeDropdownItem({
  theme,
  isSelected,
  onSelect,
  name,
  description,
}: {
  theme: Theme;
  isSelected: boolean;
  onSelect: (t: Theme) => void;
  name: string;
  description: string;
}) {
  return (
    <button
      onClick={() => onSelect(theme)}
      className={`
        w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[var(--color-surface-variant)] transition-colors
        ${isSelected ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-on-surface)]'}
      `}
      role="menuitem"
      aria-checked={isSelected}
    >
      <span>{name}</span>
      <span className="text-[var(--color-on-surface-variant)] text-[10px]">{description}</span>
    </button>
  );
});

function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme, themeInfo } = useTheme();
  const { state } = useApp();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    setThemeDropdownOpen(false);
  }, [setTheme]);

  const handleSyncCC = useCallback(async () => {
    setSyncLoading(true);
    console.log('Syncing Claude Code...');
    // TODO: Implement actual sync functionality
    setTimeout(() => setSyncLoading(false), 1000);
  }, []);

  // Handle keyboard navigation for theme dropdown
  const handleThemeDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setThemeDropdownOpen(false);
    }
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* User Profile Section */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          {/* Avatar with energy glow effect */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/20 blur-xl" aria-hidden="true" />
            <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/10 blur-md animate-pulse" aria-hidden="true" />
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face"
              alt="Shadow Clone Alpha - User avatar"
              className="relative w-11 h-11 rounded-full object-cover border-2 border-[var(--color-primary)] shadow-[0_0_12px_rgba(var(--color-primary-rgb, 194,101,42),0.5)]"
            />
            {/* Active status indicator */}
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
              Shadow Clone Alpha
            </h1>
            <div className="flex items-center gap-1.5">
              <StatusIndicator status={state.shadow.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation with ARIA */}
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

      {/* Bottom Actions */}
      <div className="px-4 mt-auto space-y-3">
        {/* Sync CC Button */}
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

        {/* Theme Selector with ARIA */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            onKeyDown={handleThemeDropdownKeyDown}
            className="w-full py-2 px-3 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] rounded-lg font-body text-xs flex items-center justify-between hover:border-[var(--color-primary)] transition-colors"
            aria-label={`Current theme: ${themeInfo.name}. Click to change theme.`}
            aria-expanded={themeDropdownOpen}
            aria-haspopup="menu"
          >
            <span className="flex items-center gap-2">
              <Palette size={12} aria-hidden="true" />
              {themeInfo.name}
            </span>
            <ChevronDown 
              size={12} 
              className={`transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`} 
              aria-hidden="true"
            />
          </button>
          
          <AnimatePresence>
            {themeDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg overflow-hidden z-50"
                role="menu"
                aria-label="Theme options"
              >
                {THEMES.map((t) => (
                  <ThemeDropdownItem
                    key={t.id}
                    theme={t.id}
                    isSelected={theme === t.id}
                    onSelect={handleThemeChange}
                    name={t.name}
                    description={t.description}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Links */}
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
      {/* Mobile overlay */}
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

      {/* Desktop sidebar */}
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

      {/* Mobile sidebar with animation */}
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
