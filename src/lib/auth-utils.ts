/**
 * Authentication Utilities
 * 
 * Client-side utilities for authentication and redirects.
 */

import { redirect } from 'next/navigation';

/**
 * Redirects to a path. Use in Server Components.
 */
export function redirectTo(path: string) {
  redirect(path);
}

/**
 * Client-side redirect helper
 */
export function clientRedirect(path: string) {
  if (typeof window !== 'undefined') {
    window.location.href = path;
  }
}

