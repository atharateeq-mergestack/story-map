/**
 * Supabase Client for Backend (Server-side)
 *
 * This client uses the service role key and bypasses RLS.
 * ONLY use this in API routes, server components, or server actions.
 * NEVER expose this client to the browser.
 *
 * Usage:
 * ```ts
 * import { createServerClient } from '@/lib/supabase/server';
 * const supabase = createServerClient();
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import { Env } from '@/libs/Env';

/**
 * Creates a Supabase client for use on the server.
 * This client uses the service role key and bypasses RLS.
 *
 * ⚠️ WARNING: Only use this in server-side code (API routes, server components, server actions).
 * Never expose the service role key to the client.
 */
export function createServerClient() {
  return createClient(
    Env.NEXT_PUBLIC_SUPABASE_URL,
    Env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * Creates a Supabase client from a user's session token.
 * This is useful when you need to perform operations as a specific user
 * while still respecting RLS policies.
 *
 * @param accessToken - The user's access token from their session
 */
export function createServerClientWithAuth(accessToken: string) {
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
