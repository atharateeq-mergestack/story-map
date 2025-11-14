/**
 * Profiles API Route
 * 
 * GET /api/profiles - Get all profiles (or current user's profile)
 * POST /api/profiles - Create a new profile
 * 
 * For authenticated requests, include Authorization header:
 * Authorization: Bearer <access_token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/profiles
 * Get profiles. If authenticated, returns current user's profile.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader) {
      // Authenticated request - get current user's profile
      const token = authHeader.replace('Bearer ', '');
      const supabase = createServerClient();
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        );
      }

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

