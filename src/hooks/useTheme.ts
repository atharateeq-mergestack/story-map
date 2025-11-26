/**
 * Theme Hook
 *
 * React hook for managing theme state and switching between light/dark themes.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = useCallback((themeToApply: 'light' | 'dark') => {
    const root = document.documentElement;
    if (themeToApply === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    // Get initial theme from localStorage or system preference
    const stored = localStorage.getItem('theme') as Theme | null;
    const initialTheme = stored || 'system';

    // Resolve system theme
    const resolveTheme = (): 'light' | 'dark' => {
      if (initialTheme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return initialTheme;
    };

    const resolved = resolveTheme();
    // Use functional updates to avoid warnings
    setThemeState(() => initialTheme);
    setResolvedTheme(() => resolved);
    applyTheme(resolved);

    // Listen for system theme changes
    if (initialTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(newTheme);
        applyTheme(newTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [applyTheme]);

  const setThemeMode = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);

      let resolved: 'light' | 'dark';
      if (newTheme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      } else {
        resolved = newTheme;
      }

      setResolvedTheme(resolved);
      applyTheme(resolved);
    },
    [applyTheme],
  );

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
  }, [resolvedTheme, setThemeMode]);

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeMode,
    toggleTheme,
  };
}
