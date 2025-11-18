/**
 * Supabase Client for Server-side (Server Components, Server Actions, API Routes)
 *
 * This client handles authentication on the server using cookies.
 * Automatically manages session cookies via @supabase/ssr.
 *
 * Usage:
 * ```ts
 * import { createClient } from '@/lib/supabase/server';
 * const supabase = await createClient();
 * ```
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Env } from '@/libs/Env';

/**
 * Creates a Supabase client for use on the server.
 * This client uses the anon key and automatically manages session cookies.
 *
 * ⚠️ IMPORTANT: Only use this in server-side code (Server Components, Server Actions, API Routes).
 * For client components, use the browser client from '@/lib/supabase/client'.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    Env.NEXT_PUBLIC_SUPABASE_URL,
    Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
