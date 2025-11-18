/**
 * Supabase Client for Frontend (Browser)
 *
 * @deprecated This client is no longer used in the application.
 * All Supabase calls are now made server-side via API routes.
 *
 * This file is kept for reference but should not be imported.
 * Use API routes instead:
 * - /api/auth/signin
 * - /api/auth/signup
 * - /api/auth/signout
 * - /api/auth/user
 * - /api/profiles
 */

import { createBrowserClient } from '@supabase/ssr';
import { Env } from '@/libs/Env';

/**
 * Supabase client for use in client components.
 *
 * ⚠️ DEPRECATED: Do not use this client.
 * All Supabase operations should go through API routes.
 */
export const supabase = createBrowserClient(
  Env.NEXT_PUBLIC_SUPABASE_URL,
  Env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
