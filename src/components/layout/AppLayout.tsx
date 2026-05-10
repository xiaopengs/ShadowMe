/**
 * AppLayout Component - Enhanced with Accessibility & Performance
 * Features: Glassmorphic top bar, skip-link, semantic HTML, keyboard navigation
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

  // Handle keyboard navigation for mobile menu
  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Mobile Header with Glass Effect */}
      <header 
        className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center px-4"
        role="banner"
        style={{
          background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--color-surface-container-low) 80%, transparent), color-mix(in srgb, var(--color-surface-container-low) 90%, transparent))',
        }}
      >
        <button
          onClick={() => setMobileMenuOpen(true)}
          onKeyDown={handleMobileMenuKeyDown}
          className="p-2 rounded-lg hover:bg-[var(--color-surface-variant)]/50 transition-colors text-[var(--color-on-surface)]"
          aria-label="Open menu"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <Menu size={24} aria-hidden="true" />
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
      <main 
        id="main-content"
        className="md:ml-64 pt-16 md:pt-0 min-h-screen pb-24 md:pb-0"
        role="main"
      >
        <div className="p-4 md:p-8 pt-20 md:pt-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - Semantic nav */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-40 flex items-center justify-around px-2"
        role="navigation"
        aria-label="Mobile navigation"
        style={{
          background: 'linear-gradient(to top, color-mix(in srgb, var(--color-surface-container-low) 95%, transparent), color-mix(in srgb, var(--color-surface-container-low) 80%, transparent))',
        }}
      >
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
