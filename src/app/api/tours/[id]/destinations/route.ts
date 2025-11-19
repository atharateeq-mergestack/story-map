import type { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { destinations, tours } from '@/db/schema';

// GET - Get all destinations for a tour
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify tour exists
    const tour = await db.select().from(tours).where(eq(tours.id, id)).limit(1);
    if (tour.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tourDestinations = await db
      .select()
      .from(destinations)
      .where(eq(destinations.tourId, id))
      .orderBy(asc(destinations.date), asc(destinations.createdAt));

    return NextResponse.json(
      { destinations: tourDestinations },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch destinations' },
      { status: 500 },
    );
  }
}

// POST - Create a new destination for a tour
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      date,
      timeSlot,
      images,
      coordinate,
      description,
      metadata,
      limits,
    } = body;

    if (!name || !date) {
      return NextResponse.json(
        { error: 'Name and date are required' },
        { status: 400 },
      );
    }

    // Verify tour exists
    const tour = await db.select().from(tours).where(eq(tours.id, id)).limit(1);
    if (tour.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const newDestination = await db
      .insert(destinations)
      .values({
        tourId: id,
        name,
        date,
        timeSlot: timeSlot || null,
        images: images || [],
        coordinate: coordinate || null,
        description,
        metadata: metadata || {},
        limits: limits || null,
      })
      .returning();

    return NextResponse.json(
      { destination: newDestination[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating destination:', error);
    return NextResponse.json(
      { error: 'Failed to create destination' },
      { status: 500 },
    );
  }
}
