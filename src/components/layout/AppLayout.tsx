'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Menu, LayoutDashboard, ListChecks, Settings, Archive } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const mobileNavItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks', icon: ListChecks, label: 'Tasks' },
  { href: '/archive', icon: Archive, label: 'Archive' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)]/30 z-40 flex items-center px-4">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--color-surface-variant)]/50 transition-colors text-[var(--color-on-surface)]"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-headline text-lg text-[var(--color-on-surface)]">
          ShadowMe
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--color-surface-container)] border-t border-[var(--color-outline-variant)]/30 z-40 flex items-center justify-around px-2">
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
