import { createClient } from '@supabase/supabase-js';
import { Env } from '@/libs/Env';

/**
 * Supabase admin client for server-side admin operations.
 * This client uses the service role key and bypasses RLS.
 *
 * ⚠️ WARNING: Only use this in server-side code (Server Actions, API Routes).
 * NEVER import this in client components.
 * NEVER expose the service role key to the client.
 */
export const supabaseAdmin = createClient(
  Env.NEXT_PUBLIC_SUPABASE_URL,
  Env.SUPABASE_SERVICE_ROLE_KEY,
);
