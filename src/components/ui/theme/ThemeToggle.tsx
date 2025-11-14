/**
 * Theme Toggle Component
 *
 * Button component for switching between light and dark themes.
 */

'use client';

import { Moon, Sun } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useThemeContext } from './ThemeProvider';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useThemeContext();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      className="h-9 w-9"
    >
      {resolvedTheme === 'light'
        ? (
            <Moon className="h-4 w-4" />
          )
        : (
            <Sun className="h-4 w-4" />
          )}
    </Button>
  );
}
