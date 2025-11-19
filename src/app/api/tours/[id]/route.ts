import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tours } from '@/db/schema';

// GET - Get a single tour by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tour = await db.select().from(tours).where(eq(tours.id, id)).limit(1);

    if (tour.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return NextResponse.json({ tour: tour[0] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tour:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour' },
      { status: 500 },
    );
  }
}

// PATCH - Update tour (mainly for status changes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, ...otherUpdates } = body;

    // Get current tour
    const currentTour = await db
      .select()
      .from(tours)
      .where(eq(tours.id, id))
      .limit(1);

    if (currentTour.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tour = currentTour[0];
    const updateData: typeof tours.$inferInsert = {};

    // If setting tour as active, deactivate all other tours
    if (status === 'active' && tour.status !== 'active') {
      await db
        .update(tours)
        .set({ status: 'inactive' })
        .where(eq(tours.status, 'active'));
    }

    // Add history entry for status change
    if (status && status !== tour.status) {
      const historyEntry = {
        action: 'status_changed',
        timestamp: new Date().toISOString(),
        notes: `Status changed from ${tour.status} to ${status}`,
      };
      updateData.history = [...(tour.history || []), historyEntry];
    }

    // Update other fields
    if (status) {
      updateData.status = status;
    }
    if (otherUpdates.name) {
      updateData.name = otherUpdates.name;
    }
    if (otherUpdates.description !== undefined) {
      updateData.description = otherUpdates.description;
    }
    if (otherUpdates.startDate !== undefined) {
      updateData.startDate = otherUpdates.startDate;
    }
    if (otherUpdates.endDate !== undefined) {
      updateData.endDate = otherUpdates.endDate;
    }
    if (otherUpdates.startLocation !== undefined) {
      updateData.startLocation = otherUpdates.startLocation;
    }
    if (otherUpdates.endLocation !== undefined) {
      updateData.endLocation = otherUpdates.endLocation;
    }
    if (otherUpdates.metadata) {
      updateData.metadata = otherUpdates.metadata;
    }

    updateData.updatedAt = new Date();

    const updatedTour = await db
      .update(tours)
      .set(updateData)
      .where(eq(tours.id, id))
      .returning();

    return NextResponse.json({ tour: updatedTour[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating tour:', error);
    return NextResponse.json(
      { error: 'Failed to update tour' },
      { status: 500 },
    );
  }
}
