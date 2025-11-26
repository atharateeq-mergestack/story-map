'use server';

import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

/**
 * Gets the current authenticated user from the session cookie.
 * Returns null if no user is authenticated.
 */
export async function getCurrentUser(): Promise<{ user: User | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null };
    }

    return { user };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null };
  }
}

/**
 * Gets the user profile from the database.
 * Returns null if no profile exists for the user.
 */
export async function getUserProfile(userId: string | undefined): Promise<{ profile: Profile | null }> {
  if (!userId) {
    return { profile: null };
  }

  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    return { profile: profile || null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null };
  }
}

/**
 * Gets the current user session.
 * Returns null if no active session exists.
 */
export async function getSession(): Promise<{ session: { user: User | null } | null }> {
  try {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return { session: null };
    }

    return { session: { user: session.user } };
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null };
  }
}
