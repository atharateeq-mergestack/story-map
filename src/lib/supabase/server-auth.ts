/**
 * Server-side Authentication Utilities
 *
 * Utilities for checking authentication state in Server Components and Server Actions.
 * These functions read the session from cookies.
 */

import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Env } from '@/libs/Env';

/**
 * Creates a Supabase client that reads the session from cookies.
 * This is the recommended way to check auth in Server Components.
 *
 * Note: For Next.js 15, we read the access token from cookies manually.
 */
export async function createServerAuthClient() {
  const cookieStore = await cookies();

  // Get the access token from cookies
  // Supabase stores auth tokens in cookies with specific naming
  const accessToken = cookieStore.get('sb-access-token')?.value;

  // If we have tokens, create a client with them
  if (accessToken) {
    return createClient(
      Env.NEXT_PUBLIC_SUPABASE_URL,
      Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  // Otherwise, create a basic client
  return createClient(
    Env.NEXT_PUBLIC_SUPABASE_URL,
    Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * Gets the current user session from cookies.
 * Returns null if no valid session exists.
 */
export async function getServerSession(): Promise<Session | null> {
  const supabase = await createServerAuthClient();

  // Try to get the user to verify the session
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // If we have a user, construct a session object
  // Note: This is a simplified approach. For production, you might want
  // to use @supabase/ssr package for proper cookie handling
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  if (!accessToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: cookieStore.get('sb-refresh-token')?.value || '',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    token_type: 'bearer',
    user,
  } as Session;
}

/**
 * Gets the current user from cookies.
 * Returns null if no valid session exists.
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createServerAuthClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Checks if a user is authenticated.
 * Returns true if a valid session exists.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}
