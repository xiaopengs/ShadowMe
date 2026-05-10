/**
 * ThemeSwitcher Component - Enhanced with Accessibility
 * Features: ARIA attributes, keyboard navigation
 */
'use client';

import React, { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, type Theme } from '@/context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme, themeInfo } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Handle theme change with keyboard support
  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, [setTheme]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Close dropdown
      triggerRef.current?.focus();
    }
  }, []);

  // Handle dropdown item keyboard navigation
  const handleItemKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const buttons = dropdownRef.current?.querySelectorAll('[data-theme-btn]');
    if (!buttons) return;

    let newIndex = index;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = (index + 1) % buttons.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = (index - 1 + buttons.length) % buttons.length;
    } else if (e.key === 'Escape') {
      triggerRef.current?.focus();
      return;
    }

    if (newIndex !== index) {
      (buttons[newIndex] as HTMLButtonElement)?.focus();
    }
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)] transition-colors text-sm"
        aria-label={`Current theme: ${themeInfo.name}. Click to change theme.`}
        aria-expanded="false"
        aria-haspopup="menu"
        aria-controls="theme-dropdown"
      >
        <Palette size={16} className="text-[var(--color-primary)]" aria-hidden="true" />
        <span className="hidden sm:inline">{themeInfo.name}</span>
      </button>

      <AnimatePresence>
        <motion.div
          id="theme-dropdown"
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-xl shadow-lg overflow-hidden z-50"
          role="menu"
          aria-label="Theme options"
          onKeyDown={handleKeyDown}
        >
          <div className="p-3 border-b border-[var(--color-outline-variant)]/30">
            <p className="text-xs font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">
              Select Theme
            </p>
          </div>
          
          <div className="p-2 max-h-80 overflow-y-auto">
            {THEMES.map((t, index) => (
              <button
                key={t.id}
                data-theme-btn
                onClick={() => handleThemeChange(t.id)}
                onKeyDown={(e) => handleItemKeyDown(e, index)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${theme === t.id 
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                    : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]'
                  }
                `}
                role="menuitemradio"
                aria-checked={theme === t.id}
              >
                {/* Theme Preview Swatch */}
                <div className="flex gap-1" aria-hidden="true">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ 
                      backgroundColor: t.isDark ? '#1a1a2e' : '#faf5ee',
                      border: '1px solid var(--color-outline-variant)',
                    }} 
                  />
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: '#c2652a' }} 
                  />
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: '#d0bcff' }} 
                  />
                </div>

                <div className="flex-1 text-left">
                  <p className="font-body text-sm font-medium">{t.name}</p>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)]">{t.description}</p>
                </div>

                {theme === t.id && (
                  <Check size={16} className="text-[var(--color-primary)]" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
