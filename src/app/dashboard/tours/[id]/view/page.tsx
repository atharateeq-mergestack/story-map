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

export default async function ViewAsUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tour = await getTour(id);
  const destinations = await getDestinations(id);

  if (!tour) {
    notFound();
  }

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
    <div className="relative">
      <TourView
        tour={tour}
        destinationsByDate={
          Object.fromEntries(
            Object.entries(destinationsByDate).map(([date, destinations]) => [
              date,
              destinations.map(dest => ({
                ...dest,
                images: dest.images ?? undefined,
              })),
            ]),
          )
        }
        dates={dates}
      />
    </div>
  );
}
