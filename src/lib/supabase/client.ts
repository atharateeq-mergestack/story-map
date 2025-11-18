/**
 * Supabase Client for Frontend (Browser)
 *
 * This client uses the anon key and is safe to use in the browser.
 * It automatically handles authentication state and browser storage.
 *
 * Usage:
 * ```ts
 * import { supabase } from '@/lib/supabase/client';
 * const { data } = await supabase.auth.getUser();
 * ```
 */

import { createBrowserClient } from '@supabase/ssr';
import { Env } from '@/libs/Env';

/**
 * Supabase client for use in client components.
 * This client uses the anon key and respects Row Level Security (RLS).
 *
 * ⚠️ IMPORTANT: Only use this in client components (components with "use client" directive).
 * For server-side code, use createClient() from '@/lib/supabase/server'.
 */
export const supabase = createBrowserClient(
  Env.NEXT_PUBLIC_SUPABASE_URL,
  Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);