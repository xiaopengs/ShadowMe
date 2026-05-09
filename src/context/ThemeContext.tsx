'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Theme = 
  | 'sahara' 
  | 'shadow-clone' 
  | 'geist-dark' 
  | 'neon-tokyo' 
  | 'candy' 
  | 'glacier' 
  | 'lumina-tech' 
  | 'alexandria';

export interface ThemeInfo {
  id: Theme;
  name: string;
  description: string;
  isDark: boolean;
}

export const THEMES: ThemeInfo[] = [
  { id: 'sahara', name: 'Sahara', description: 'Warm Minimalism', isDark: false },
  { id: 'shadow-clone', name: 'Shadow Clone', description: 'Dark Tech', isDark: true },
  { id: 'geist-dark', name: 'Geist Dark', description: 'Modern Developer', isDark: true },
  { id: 'neon-tokyo', name: 'Neon Tokyo', description: 'Cyberpunk', isDark: true },
  { id: 'candy', name: 'Candy', description: 'Playful & Vibrant', isDark: false },
  { id: 'glacier', name: 'Glacier', description: 'Glassmorphism', isDark: true },
  { id: 'lumina-tech', name: 'Lumina Tech', description: 'Tech Blue', isDark: true },
  { id: 'alexandria', name: 'Alexandria', description: 'High-End Editorial', isDark: false },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeInfo: ThemeInfo;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'shadowme-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('sahara');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && THEMES.some(t => t.id === stored)) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const themeInfo = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeInfo }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
