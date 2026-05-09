/**
 * AppLayout Component - Enhanced with Glass Panel Header
 * Features: Glassmorphic top bar with blur effect
 * Source: detail_log_1/code.html, create_task/code.html
 */
'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Menu, LayoutDashboard, ListChecks, Settings, Archive } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
  showTopBar?: boolean;
  topBarTitle?: string;
}

const mobileNavItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks', icon: ListChecks, label: 'Tasks' },
  { href: '/archive', icon: Archive, label: 'Archive' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout({ children, showTopBar = false, topBarTitle }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* Mobile Header with Glass Effect */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center px-4
        bg-gradient-to-br from-[var(--color-surface-container-low)]/80 to-[var(--color-surface-container-low)]/90
        backdrop-blur-xl
        border-b border-[var(--color-outline-variant)]/10
        shadow-sm
      ">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--color-surface-variant)]/50 transition-colors text-[var(--color-on-surface)]"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-headline text-lg text-[var(--color-on-surface)]">
          {topBarTitle || 'ShadowMe'}
        </span>
      </header>

      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onMobileClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Main Content Area */}
      <main className="md:ml-64 pt-16 md:pt-0 min-h-screen pb-24 md:pb-0">
        <div className="p-4 md:p-8 pt-20 md:pt-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-2
        bg-gradient-to-t from-[var(--color-surface-container-low)]/95 to-[var(--color-surface-container-low)]/80
        backdrop-blur-xl
        border-t border-[var(--color-outline-variant)]/20
      ">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
