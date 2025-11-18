import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { destinations } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
      .where(eq(destinations.id, id))
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

    const updateData: Partial<typeof destinations.$inferInsert> = {
      ...body,
      updatedAt: new Date(),
    };

    const updatedDestination = await db
      .update(destinations)
      .set(updateData)
      .where(eq(destinations.id, id))
      .returning();

    if (updatedDestination.length === 0) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 },
      );
    }

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

// DELETE - Delete a destination
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const deletedDestination = await db
      .delete(destinations)
      .where(eq(destinations.id, id))
      .returning();

    if (deletedDestination.length === 0) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: 'Destination deleted successfully' },
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

