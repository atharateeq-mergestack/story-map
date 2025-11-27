import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
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

    // Check if a profile with this email already exists
    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (existingProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 },
      );
    }

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // Handle Supabase auth errors (including duplicate email)
      const errorMessage = authError.message.includes('already registered')
        || authError.message.includes('already exists')
        || authError.message.includes('User already registered')
        ? 'An account with this email already exists. Please sign in instead.'
        : authError.message;

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 },
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 },
      );
    }

    // Check if profile already exists for this user (in case user was created but profile creation failed previously)
    const [existingUserProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, authData.user.id))
      .limit(1);

    if (existingUserProfile) {
      // Profile already exists, return success
      const requiresEmailConfirmation = !authData.session && authData.user;
      return NextResponse.json(
        {
          message: requiresEmailConfirmation
            ? 'Please check your email to confirm your account'
            : 'User already exists',
          user: authData.user,
          profile: existingUserProfile,
          requiresEmailConfirmation,
        },
        { status: 200 },
      );
    }

    // Create profile automatically
    try {
      const [profile] = await db
        .insert(profiles)
        .values({
          userId: authData.user.id,
          email,
          fullName: fullName || null,
        })
        .returning();

      // Check if email confirmation is required
      const requiresEmailConfirmation = !authData.session && authData.user;

      return NextResponse.json(
        {
          message: requiresEmailConfirmation
            ? 'Please check your email to confirm your account'
            : 'User created successfully',
          user: authData.user,
          profile,
          requiresEmailConfirmation,
        },
        { status: 201 },
      );
    } catch (profileError: unknown) {
      // Handle duplicate key constraint error
      if (
        profileError
        && typeof profileError === 'object'
        && 'code' in profileError
        && profileError.code === '23505'
      ) {
        // Duplicate key error - profile already exists
        const [profile] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.userId, authData.user.id))
          .limit(1);

        if (profile) {
          const requiresEmailConfirmation = !authData.session && authData.user;
          return NextResponse.json(
            {
              message: requiresEmailConfirmation
                ? 'Please check your email to confirm your account'
                : 'User already exists',
              user: authData.user,
              profile,
              requiresEmailConfirmation,
            },
            { status: 200 },
          );
        }

        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 },
        );
      }

      // Re-throw if it's not a duplicate key error
      throw profileError;
    }
  } catch (error) {
    console.error('Signup error:', error);

    // Check if it's a duplicate key constraint error
    if (
      error
      && typeof error === 'object'
      && 'code' in error
      && error.code === '23505'
    ) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
