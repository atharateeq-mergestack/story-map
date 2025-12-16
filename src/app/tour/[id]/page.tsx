import { and, asc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { TourView } from '@/components/tour/TourView';
import { db } from '@/db';
import { destinations, tours } from '@/db/schema';

async function getTour(id: string) {
  try {
    const tour = await db
      .select()
      .from(tours)
      .where(and(eq(tours.id, id), eq(tours.isDeleted, false)))
      .limit(1);
    return tour[0] || null;
  } catch (error) {
    console.error('Error fetching tour:', error);
    return null;
  }
}

async function getDestinations(tourId: string) {
  try {
    const tourDestinations = await db
      .select()
      .from(destinations)
      .where(and(eq(destinations.tourId, tourId), eq(destinations.isDeleted, false)))
      .orderBy(asc(destinations.date), asc(destinations.createdAt));
    return tourDestinations;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tour = await getTour(id);

  if (!tour) {
    notFound();
  }

  // Check if tour is active
  if (tour.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="p-6 rounded-lg border-2 border-muted bg-card">
            <h1 className="text-2xl font-bold mb-2">Tour Inactive</h1>
            <p className="text-muted-foreground">
              This tour is currently inactive and cannot be viewed. Please contact the tour organizer for more information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const destinations = await getDestinations(id);

  // Group destinations by date
  const destinationsByDate = destinations.reduce(
    (acc, dest) => {
      const date = dest.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(dest);
      return acc;
    },
    {} as Record<string, typeof destinations>,
  );

  // Get all unique dates sorted
  const dates = Object.keys(destinationsByDate).sort();

  return (
    <TourView
      tour={tour}
      destinationsByDate={
        Object.fromEntries(
          Object.entries(destinationsByDate).map(([date, destinations]) => [
            date,
            destinations.map(dest => ({
              ...dest,
              // Convert null images to undefined per Destination type
              images: dest.images ?? undefined,
            })),
          ]),
        )
      }
      dates={dates}
      accountForMainNav={false}
    />
  );
}
