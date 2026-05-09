// UI-POLISH: 修复了头像glow效果、导航选中状态（border-r-4）、Sync CC按钮样式、底部链接样式
'use client';

import React, { useState } from 'react';
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
  Menu,
  X,
  ChevronDown,
  Palette,
  Wifi,
  WifiOff
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

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme, themeInfo } = useTheme();
  const { state } = useApp();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setThemeDropdownOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* User Profile Section */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          {/* Avatar with energy glow effect */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/30 blur-md shadow-energy-glow" />
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face"
              alt="Shadow Clone Alpha"
              className="relative w-11 h-11 rounded-full object-cover border-2 border-[var(--color-primary)] shadow-energy-glow"
            />
            {/* Active status indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--color-surface-container-low)] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-headline text-base font-bold text-[var(--color-primary)] truncate">
              Shadow Clone Alpha
            </h1>
            <p className="text-xs text-[var(--color-on-surface-variant)] flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                state.shadow.status === 'online' 
                  ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' 
                  : state.shadow.status === 'busy'
                    ? 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)]'
                    : state.shadow.status === 'offline'
                      ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                      : 'bg-gray-500'
              }`} />
              <span className="truncate">
                {state.shadow.status === 'online' ? 'Active' : 
                 state.shadow.status === 'busy' ? 'Working' : 
                 state.shadow.status === 'offline' ? 'Offline' : 'Unknown'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-[var(--color-primary-container)]/20 text-[var(--color-primary)] border-r-4 border-[var(--color-primary)] font-medium shadow-[inset_2px_0_12px_rgba(var(--color-primary-rgb, 194,101,42),0.15)]' 
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-variant)]/50 hover:text-[var(--color-on-surface)]'
                }
              `}
            >
              <Icon size={20} className={isActive ? 'filled-icon' : ''} />
              <span className="font-body text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 mt-auto space-y-3">
        {/* Sync CC Button - 浅橙色实心按钮样式 */}
        <button className="w-full py-2.5 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] rounded-lg font-body text-sm font-medium hover:bg-[var(--color-secondary-container)] transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(var(--color-secondary-rgb,120,112,106),0.25)] active:scale-[0.98]">
          <RefreshCw size={16} className="animate-spin-slow" />
          Sync CC
        </button>

        {/* Theme Selector */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="w-full py-2 px-3 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] rounded-lg font-body text-xs flex items-center justify-between hover:border-[var(--color-primary)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Palette size={14} />
              {themeInfo.name}
            </span>
            <ChevronDown size={14} className={`transition-transform ${themeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {themeDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-lg shadow-lg overflow-hidden z-50"
              >
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`
                      w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[var(--color-surface-variant)] transition-colors
                      ${theme === t.id ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-on-surface)]'}
                    `}
                  >
                    <span>{t.name}</span>
                    <span className="text-[var(--color-on-surface-variant)] text-[10px]">{t.description}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Links */}
        <div className="pt-3 border-t border-[var(--color-outline-variant)]/30 space-y-1">
          <Link href="/support" className="flex items-center gap-2 text-[var(--color-on-surface-variant)] py-2 px-3 rounded-lg hover:bg-[var(--color-surface-variant)]/50 hover:text-[var(--color-on-surface)] transition-all duration-150 text-xs font-body">
            <HelpCircle size={14} />
            Support
          </Link>
          <Link href="/docs" className="flex items-center gap-2 text-[var(--color-on-surface-variant)] py-2 px-3 rounded-lg hover:bg-[var(--color-surface-variant)]/50 hover:text-[var(--color-on-surface)] transition-all duration-150 text-xs font-body">
            <FileText size={14} />
            Documentation
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[var(--color-surface-container-low)]/90 backdrop-blur-xl border-r border-[var(--color-outline-variant)]/20 shadow-xl flex-col pt-20 pb-6 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Top App Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-outline-variant)]/30 shadow-sm flex justify-between items-center px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileClose}
            className="p-2 -ml-2 text-[var(--color-primary)] hover:bg-[var(--color-surface-variant)] rounded-full transition-colors"
          >
            <Menu size={24} />
          </button>
          <span className="font-display text-xl font-bold tracking-tighter text-[var(--color-primary)] drop-shadow-[0_0_8px_rgba(208,188,255,0.5)]">
            Shadow Clone
          </span>
        </div>
        <div className="flex items-center gap-3">
          {state.wsConnected ? (
            <Wifi size={18} className="text-[var(--color-secondary)]" />
          ) : (
            <WifiOff size={18} className="text-[var(--color-outline)]" />
          )}
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face"
            alt="User avatar"
            className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] object-cover"
          />
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 h-full w-72 bg-[var(--color-surface-container-low)] backdrop-blur-xl border-r border-[var(--color-outline-variant)]/20 shadow-xl z-50 pt-4"
            >
              <div className="flex justify-end px-4">
                <button
                  onClick={onMobileClose}
                  className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)] rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--color-surface-container-low)]/95 backdrop-blur-xl border-t border-[var(--color-outline-variant)]/20 flex justify-around items-center pb-safe z-40">
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'
              }`}
            >
              <Icon size={22} className={isActive ? 'fill-current' : ''} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname === '/settings' ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'
          }`}
        >
          <Settings size={22} />
          <span className="text-[10px] mt-1 font-medium">Settings</span>
        </Link>
      </nav>
    </>
  );
}
