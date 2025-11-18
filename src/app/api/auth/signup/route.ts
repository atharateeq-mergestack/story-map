/**
 * Sign Up API Route
 *
 * POST /api/auth/signup
 *
 * Creates a new user account and automatically creates a profile.
 *
 * Body:
 * {
 *   email: string
 *   password: string
 *   fullName?: string
 * }
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 },
      );
    }

    // Create profile automatically
    const [profile] = await db
      .insert(profiles)
      .values({
        userId: authData.user.id,
        email,
        fullName: fullName || null,
      })
      .returning();

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: authData.user,
        profile,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
