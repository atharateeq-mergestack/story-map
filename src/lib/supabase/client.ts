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
