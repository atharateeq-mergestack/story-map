/**
 * Server-side Authentication Utilities
 *
 * Utilities for checking authentication state in Server Components and Server Actions.
 * These functions use the SSR client which automatically handles cookies.
 *
 * @deprecated Consider using createClient() directly from '@/lib/supabase/server'
 * for better control and clarity. These helpers are maintained for backward compatibility.
 */

import type { Session, User } from '@supabase/supabase-js';
import { createClient } from './server';

/**
 * Gets the current user session from cookies.
 * Returns null if no valid session exists.
 *
 * @deprecated Use createClient() and supabase.auth.getSession() directly
 */
export async function getServerSession(): Promise<Session | null> {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

/**
 * Gets the current user from cookies.
 * Returns null if no valid session exists.
 *
 * @deprecated Use createClient() and supabase.auth.getUser() directly
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Checks if a user is authenticated.
 * Returns true if a valid session exists.
 *
 * @deprecated Use createClient() and supabase.auth.getUser() directly
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}