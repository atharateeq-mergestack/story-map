import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tours } from '@/db/schema';

// GET - List all tours
export async function GET() {
  try {
    const allTours = await db
      .select()
      .from(tours)
      .orderBy(desc(tours.createdAt));

    return NextResponse.json({ tours: allTours }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tours' },
      { status: 500 },
    );
  }
}

// POST - Create a new tour
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      startDate,
      endDate,
      startLocation,
      endLocation,
      status,
      metadata,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Tour name is required' },
        { status: 400 },
      );
    }

    // If setting tour as active, deactivate all other tours
    if (status === 'active') {
      await db
        .update(tours)
        .set({ status: 'inactive' })
        .where(eq(tours.status, 'active'));
    }

    // Create history entry
    const historyEntry = {
      action: 'created',
      timestamp: new Date().toISOString(),
      notes: 'Tour created',
    };

    const newTour = await db
      .insert(tours)
      .values({
        name,
        description,
        startDate,
        endDate,
        startLocation,
        endLocation,
        status: status || 'inactive',
        history: [historyEntry],
        metadata: metadata || {},
      })
      .returning();

    return NextResponse.json({ tour: newTour[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating tour:', error);
    return NextResponse.json(
      { error: 'Failed to create tour' },
      { status: 500 },
    );
  }
}
