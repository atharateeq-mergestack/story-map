/**
 * Direct Drizzle Usage Example (Server-side)
 * 
 * This file demonstrates how to use Drizzle directly in Server Components
 * or Server Actions without going through API routes.
 * 
 * ⚠️ This is for reference only - not meant to be imported directly.
 * Copy the patterns into your Server Components or Server Actions.
 */

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Example: Get all profiles (Server Component)
 */
export async function getAllProfiles() {
  const allProfiles = await db.select().from(profiles);
  return allProfiles;
}

/**
 * Example: Get profile by user ID (Server Component)
 */
export async function getProfileByUserId(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile;
}

/**
 * Example: Create profile (Server Action)
 */
export async function createProfile(data: {
  userId: string;
  email: string;
  fullName?: string;
}) {
  const [profile] = await db
    .insert(profiles)
    .values({
      userId: data.userId,
      email: data.email,
      fullName: data.fullName || null,
    })
    .returning();

  return profile;
}

/**
 * Example: Update profile (Server Action)
 */
export async function updateProfile(
  userId: string,
  updates: { fullName?: string; email?: string },
) {
  const [updatedProfile] = await db
    .update(profiles)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, userId))
    .returning();

  return updatedProfile;
}

/**
 * Example: Delete profile (Server Action)
 */
export async function deleteProfile(userId: string) {
  const [deletedProfile] = await db
    .delete(profiles)
    .where(eq(profiles.userId, userId))
    .returning();

  return deletedProfile;
}

