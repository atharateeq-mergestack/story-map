/**
 * Auth Callback Route
 *
 * Handles OAuth callbacks and email verification links from Supabase.
 * Exchanges auth codes for sessions and sets cookies automatically.
 *
 * GET /auth/callback?code=xxx&next=/dashboard
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=Could not authenticate user`,
  );
}

