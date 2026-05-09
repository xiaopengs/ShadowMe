'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ListTodo,
  Settings,
  Bell,
  Menu,
  X,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

const navLinks = [
  { href: '/', label: '看板', icon: LayoutDashboard },
  { href: '/tasks', label: '任务列表', icon: ListTodo },
  { href: '/settings', label: '设置', icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  const { state, dispatch } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setUnreadCount(state.notifications.filter(n => !n.read).length);
  }, [state.notifications]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass-heavy' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#29C16A] to-[#0EA5E9] rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">影</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#29C16A] to-[#0EA5E9] rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
                </div>
                <span className="text-lg font-semibold text-[var(--color-text-primary)] hidden sm:block">
                  Shadow Clone
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'text-[var(--color-primary-400)] bg-[var(--color-primary-500)]/10'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} />
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="navbar-active"
                          className="absolute inset-0 bg-[var(--color-primary-500)]/10 rounded-lg -z-10"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-light">
                {state.wsConnected ? (
                  <Wifi size={14} className="text-[var(--color-success)]" />
                ) : (
                  <WifiOff size={14} className="text-[var(--color-text-muted)]" />
                )}
                <span className={`text-xs font-medium hidden sm:block ${
                  state.wsConnected ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'
                }`}>
                  {state.wsConnected ? '已连接' : '离线'}
                </span>
              </div>

              <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Bell size={20} className="text-[var(--color-text-secondary)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--color-error)] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Menu size={20} className="text-[var(--color-text-secondary)]" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-64 glass-heavy z-50 p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-semibold">菜单</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-400)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-white/5'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
