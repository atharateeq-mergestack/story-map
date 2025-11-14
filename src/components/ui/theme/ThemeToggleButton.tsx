/**
 * Theme Toggle Button Component
 *
 * Standalone theme toggle button for use on public pages.
 * Positioned in the top-right corner.
 */

'use client';

import { ThemeToggle } from './ThemeToggle';

export function ThemeToggleButton() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <ThemeToggle />
    </div>
  );
}
