import { and, asc, eq } from 'drizzle-orm';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { db } from '@/db';
import { destinations, tours } from '@/db/schema';
import { formatDate } from '@/lib/utils';

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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/tours/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="size-4" />
              Back to Tour Details
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{tour.name}</h1>
            <p className="text-muted-foreground mt-1">
              Tour ID:
              {tour.id}
            </p>
          </div>
        </div>

        {/* Tour Info */}
        <Card>
          <CardHeader>
            <CardTitle>Tour Information</CardTitle>
            <CardDescription>View tour as a user would see it</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {tour.startDate
                    ? formatDate(tour.startDate)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {tour.endDate
                    ? formatDate(tour.endDate)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Location</p>
                <p className="font-medium">{tour.startLocation || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Location</p>
                <p className="font-medium">{tour.endLocation || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Destinations by Date */}
        <Card>
          <CardHeader>
            <CardTitle>Destinations</CardTitle>
            <CardDescription>
              All destinations organized by date with coordinates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {destinations.length === 0
              ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-lg text-muted-foreground">
                      No destinations available for this tour.
                    </p>
                  </div>
                )
              : (
                  <div className="space-y-8">
                    {Object.entries(destinationsByDate)
                      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                      .map(([date, dateDestinations]) => (
                        <div key={date} className="space-y-4">
                          <h3 className="text-lg font-semibold">
                            {formatDate(date)}
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Destination Name</TableHead>
                                <TableHead>Time Slot</TableHead>
                                <TableHead>Latitude</TableHead>
                                <TableHead>Longitude</TableHead>
                                <TableHead>Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dateDestinations.map((destination: {
                                id: string;
                                name: string;
                                timeSlot: {
                                  start_time: string;
                                  end_time: string;
                                  slot_label?: string;
                                } | null;
                                coordinate: { lat: number; lng: number } | null;
                                description: string | null;
                              }) => (
                                <TableRow key={destination.id}>
                                  <TableCell className="font-medium">
                                    {destination.name}
                                  </TableCell>
                                  <TableCell>
                                    {destination.timeSlot
                                      ? (
                                          <div className="text-sm">
                                            <div>
                                              {destination.timeSlot.start_time}
                                              {' '}
                                              -
                                              {' '}
                                              {destination.timeSlot.end_time}
                                            </div>
                                            {destination.timeSlot.slot_label && (
                                              <div className="text-muted-foreground">
                                                {destination.timeSlot.slot_label}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      : (
                                          '-'
                                        )}
                                  </TableCell>
                                  <TableCell>
                                    {destination.coordinate
                                      ? destination.coordinate.lat.toFixed(6)
                                      : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {destination.coordinate
                                      ? destination.coordinate.lng.toFixed(6)
                                      : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {destination.description || '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ))}
                  </div>
                )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
