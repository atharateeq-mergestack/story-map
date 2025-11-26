import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { destinations } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { processImageUrls } from '@/utils/image-utils';

// GET - Get a single destination by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const destination = await db
      .select()
      .from(destinations)
      .where(and(eq(destinations.id, id), eq(destinations.isDeleted, false)))
      .limit(1);

    if (destination.length === 0) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { destination: destination[0] },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching destination:', error);
    return NextResponse.json(
      { error: 'Failed to fetch destination' },
      { status: 500 },
    );
  }
}

// PATCH - Update a destination
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if destination exists and is not deleted
    const existingDestination = await db
      .select()
      .from(destinations)
      .where(and(eq(destinations.id, id), eq(destinations.isDeleted, false)))
      .limit(1);

    if (existingDestination.length === 0) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 },
      );
    }

    // Process images if provided: download from Google Drive and upload to Supabase if needed
    const updateData: Partial<typeof destinations.$inferInsert> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.images && Array.isArray(body.images)) {
      updateData.images = await processImageUrls(body.images, 'destinations');
    }

    const updatedDestination = await db
      .update(destinations)
      .set(updateData)
      .where(eq(destinations.id, id))
      .returning();

    return NextResponse.json(
      { destination: updatedDestination[0] },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating destination:', error);
    return NextResponse.json(
      { error: 'Failed to update destination' },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete a destination
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get current user for deletedBy
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Get current destination
    const currentDestination = await db
      .select()
      .from(destinations)
      .where(and(eq(destinations.id, id), eq(destinations.isDeleted, false)))
      .limit(1);

    if (currentDestination.length === 0) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 },
      );
    }

    // Soft delete the destination
    const deletedDestination = await db
      .update(destinations)
      .set({
        isDeleted: true,
        deletedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(destinations.id, id))
      .returning();

    return NextResponse.json(
      { message: 'Destination deleted successfully', destination: deletedDestination[0] },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting destination:', error);
    return NextResponse.json(
      { error: 'Failed to delete destination' },
      { status: 500 },
    );
  }
}
