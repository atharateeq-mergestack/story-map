/**
 * Supabase Client for Frontend (Browser)
 * 
 * This client uses the anon key and is safe to use in the browser.
 * It automatically handles authentication state and cookies.
 * 
 * Usage:
 * ```ts
 * import { createBrowserClient } from '@/lib/supabase/client';
 * const supabase = createBrowserClient();
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import { Env } from '@/libs/Env';

/**
 * Creates a Supabase client for use in the browser/frontend.
 * This client uses the anon key and respects Row Level Security (RLS).
 */
export function createBrowserClient() {
  return createClient(
    Env.NEXT_PUBLIC_SUPABASE_URL,
    Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
}

/**
 * Singleton instance for use in React components.
 * Use this if you want a single shared instance.
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}

