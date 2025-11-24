import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import moment from 'moment';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tours } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

// GET - Get a single tour by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const tour = await db
      .select()
      .from(tours)
      .where(and(eq(tours.id, id), eq(tours.isDeleted, false)))
      .limit(1);

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
      .where(and(eq(tours.id, id), eq(tours.isDeleted, false)))
      .limit(1);

    if (currentTour.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tour = currentTour[0];
    const updateData: typeof tours.$inferInsert = {};

    // If setting tour as active, deactivate all other non-deleted tours
    if (status === 'active' && tour.status !== 'active') {
      await db
        .update(tours)
        .set({ status: 'inactive' })
        .where(and(eq(tours.status, 'active'), eq(tours.isDeleted, false)));
    }

    // Add history entry for status change
    if (status && status !== tour.status) {
      const historyEntry = {
        action: 'status_changed',
        timestamp: moment().toISOString(),
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

// DELETE - Soft delete a tour
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

    // Get current tour
    const currentTour = await db
      .select()
      .from(tours)
      .where(and(eq(tours.id, id), eq(tours.isDeleted, false)))
      .limit(1);

    if (currentTour.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tour = currentTour[0];

    // Add history entry for deletion
    const historyEntry = {
      action: 'deleted',
      timestamp: new Date().toISOString(),
      notes: 'Tour soft deleted',
      performed_by: user.id,
    };

    // Soft delete the tour
    const deletedTour = await db
      .update(tours)
      .set({
        isDeleted: true,
        deletedBy: user.id,
        history: [...(tour.history || []), historyEntry],
        updatedAt: new Date(),
      })
      .where(eq(tours.id, id))
      .returning();

    return NextResponse.json(
      { message: 'Tour deleted successfully', tour: deletedTour[0] },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting tour:', error);
    return NextResponse.json(
      { error: 'Failed to delete tour' },
      { status: 500 },
    );
  }
}
