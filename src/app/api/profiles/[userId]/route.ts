/**
 * Profile by User ID API Route
 * 
 * GET /api/profiles/[userId] - Get a specific profile
 * PUT /api/profiles/[userId] - Update a profile
 * DELETE /api/profiles/[userId] - Delete a profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/profiles/[userId]
 * Get a specific profile by user ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/profiles/[userId]
 * Update a profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { fullName, email } = body;

    // Verify authentication from cookies
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Build update object
    const updateData: Partial<typeof profiles.$inferInsert> = {
      updatedAt: new Date(),
    };
    
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;

    const [updatedProfile] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.userId, userId))
      .returning();

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile: updatedProfile }, { status: 200 });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/profiles/[userId]
 * Delete a profile
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    // Verify authentication from cookies
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const [deletedProfile] = await db
      .delete(profiles)
      .where(eq(profiles.userId, userId))
      .returning();

    if (!deletedProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: 'Profile deleted successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Delete profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}