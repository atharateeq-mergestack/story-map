/**
 * Theme Provider Component
 *
 * Provides theme context and manages theme state.
 */

'use client';

import * as React from 'react';
import { useTheme } from '@/hooks/useTheme';

type ThemeContextType = ReturnType<typeof useTheme>;

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <ThemeContext value={theme}>
      {children}
    </ThemeContext>
  );
}

export function useThemeContext() {
  const context = React.use(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
