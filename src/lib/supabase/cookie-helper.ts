/**
 * Cookie Helper
 *
 * Helper functions to sync Supabase session from localStorage to cookies
 * so that server components can access the session.
 */

'use client';

import { getBrowserClient } from './client';

/**
 * Syncs the current Supabase session to cookies
 * This allows server components to read the session
 */
export async function syncSessionToCookies() {
  const supabase = getBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    // Set cookie with session data
    document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in || 3600}; SameSite=Lax`;

    if (session.refresh_token) {
      document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax`; // 7 days
    }

    // Also set a cookie with the full session data
    const sessionData = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      expires_at: session.expires_at,
    };

    document.cookie = `sb-session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=${session.expires_in || 3600}; SameSite=Lax`;
  }
}

/**
 * Clears session cookies
 */
export function clearSessionCookies() {
  document.cookie = 'sb-access-token=; path=/; max-age=0';
  document.cookie = 'sb-refresh-token=; path=/; max-age=0';
  document.cookie = 'sb-session=; path=/; max-age=0';
}
