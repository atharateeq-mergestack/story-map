import { and, asc, eq } from 'drizzle-orm';
import { ArrowLeftIcon, PlusIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DestinationActions } from '@/components/dashboard/DestinationActions';
import { Badge } from '@/components/ui/badge';
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

export default async function TourDetailsPage({
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="size-4" />
                Back to Tours
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{tour.name}</h1>
              {tour.description && (
                <p className="text-muted-foreground mt-1">{tour.description}</p>
              )}
            </div>
          </div>
          <Link href={`/tour/${id}`}>
            <Button>
              <UserIcon className="size-4" />
              View as User
            </Button>
          </Link>
        </div>

        {/* Tour Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tour Information</CardTitle>
                <CardDescription>Tour details and status</CardDescription>
              </div>
              <Badge
                variant={tour.status === 'active' ? 'default' : 'secondary'}
              >
                {tour.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {tour.startDate
                    ? new Date(tour.startDate).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {tour.endDate
                    ? new Date(tour.endDate).toLocaleDateString()
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

        {/* Destinations Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Destinations</CardTitle>
                <CardDescription>
                  All destinations for this tour
                </CardDescription>
              </div>
              <Link href={`/dashboard/tours/${id}/destinations/new`}>
                <Button>
                  <PlusIcon className="size-4" />
                  Add Destination
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {destinations.length === 0
              ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <p className="text-lg text-muted-foreground">
                        No destinations yet. Add your first destination.
                      </p>
                      <Link href={`/dashboard/tours/${id}/destinations/new`}>
                        <Button>Add Destination</Button>
                      </Link>
                    </div>
                  </div>
                )
              : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time Slot</TableHead>
                        <TableHead>Coordinates</TableHead>
                        <TableHead>Images</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {destinations.map((destination: {
                        id: string;
                        tourId: string;
                        name: string;
                        date: string;
                        timeSlot: { start_time: string; end_time: string; slot_label?: string } | null;
                        images: string[] | null;
                        coordinate: { lat: number; lng: number } | null;
                        createdAt: Date;
                        updatedAt: Date;
                      }) => (
                        <TableRow key={destination.id}>
                          <TableCell className="font-medium">
                            {destination.name}
                          </TableCell>
                          <TableCell>
                            {new Date(destination.date).toLocaleDateString()}
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
                              ? (
                                  <div className="text-sm">
                                    {destination.coordinate.lat.toFixed(4)}
                                    ,
                                    {' '}
                                    {destination.coordinate.lng.toFixed(4)}
                                  </div>
                                )
                              : (
                                  '-'
                                )}
                          </TableCell>
                          <TableCell>
                            {destination.images && destination.images.length > 0
                              ? (
                                  <div className="flex gap-2">
                                    {(destination.images || []).slice(0, 3).map((img, idx) => (
                                      <img
                                        key={idx}
                                        src={img}
                                        alt={`${destination.name} ${idx + 1}`}
                                        className="size-10 rounded object-cover"
                                      />
                                    ))}
                                    {destination.images.length > 3 && (
                                      <div className="flex size-10 items-center justify-center rounded bg-muted text-xs">
                                        +
                                        {destination.images.length - 3}
                                      </div>
                                    )}
                                  </div>
                                )
                              : (
                                  '-'
                                )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DestinationActions
                              destinationId={destination.id}
                              destinationName={destination.name}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
