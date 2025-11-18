import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/profiles
 * Get profiles. If authenticated, returns current user's profile.
 */
export async function GET() {
  try {
    // Try to get user from cookies (SSR client)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!authError && user) {
      // Authenticated request - get current user's profile
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, user.id))
        .limit(1);

      if (!profile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 },
        );
      }

      return NextResponse.json({ profile }, { status: 200 });
    }

    // Unauthenticated request - return all profiles (if RLS allows)
    const allProfiles = await db.select().from(profiles);
    return NextResponse.json({ profiles: allProfiles }, { status: 200 });
  } catch (error) {
    console.error('Get profiles error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/profiles
 * Create a new profile (usually done automatically on signup)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, fullName } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 },
      );
    }

    const [profile] = await db
      .insert(profiles)
      .values({
        userId,
        email,
        fullName: fullName || null,
      })
      .returning();

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
