'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, type Theme } from '@/context/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme, themeInfo } = useTheme();

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)] transition-colors text-sm"
      >
        <Palette size={16} className="text-[var(--color-primary)]" />
        <span className="hidden sm:inline">{themeInfo.name}</span>
      </button>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-xl shadow-lg overflow-hidden z-50"
        >
          <div className="p-3 border-b border-[var(--color-outline-variant)]/30">
            <p className="text-xs font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">
              Select Theme
            </p>
          </div>
          
          <div className="p-2 max-h-80 overflow-y-auto">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${theme === t.id 
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                    : 'text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]'
                  }
                `}
              >
                {/* Theme Preview Swatch */}
                <div className="flex gap-1">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ 
                      backgroundColor: t.isDark ? '#1a1a2e' : '#faf5ee',
                      border: '1px solid var(--color-outline-variant)'
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
                  <Check size={16} className="text-[var(--color-primary)]" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
