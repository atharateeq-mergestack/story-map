import { and, asc, eq } from 'drizzle-orm';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  EditIcon,
  ImageIcon,
  MapPinIcon,
  NavigationIcon,
  PlusIcon,
  UserIcon,
} from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AnimatedTableRow } from '@/components/dashboard/AnimatedTableRow';
import { CopyLinkButton } from '@/components/dashboard/CopyLinkButton';
import { DestinationActions } from '@/components/dashboard/DestinationActions';
import { AnimatedWrapper } from '@/components/ui/animated';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NavigationLink } from '@/components/ui/navigation-link';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <AnimatedWrapper direction="down" delay={0}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <NavigationLink href="/dashboard" message="Loading...">
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-sm hover:shadow-md transition-all duration-300 text-xs sm:text-sm"
                  >
                    <ArrowLeftIcon className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Back to Tours</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                </NavigationLink>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {tour.name}
                  </h1>
                  {tour.description && (
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">{tour.description}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <NavigationLink href={`/dashboard/tours/${id}/edit`} message="Loading..." className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300 text-xs sm:text-sm"
                  >
                    <EditIcon className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Edit Tour</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                </NavigationLink>
                <NavigationLink href={`/dashboard/tours/${id}/view`} message="Loading..." className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300 text-xs sm:text-sm"
                  >
                    <UserIcon className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">View as User</span>
                    <span className="sm:hidden">View</span>
                  </Button>
                </NavigationLink>
                <CopyLinkButton tourId={id} isActive={tour.status === 'active'} />
              </div>
            </div>
          </div>
        </AnimatedWrapper>

        {/* Tour Info Card */}
        <AnimatedWrapper direction="up" delay={100}>
          <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2 mt-4">
                    <NavigationIcon className="size-5 text-primary" />
                    Tour Information
                  </CardTitle>
                  <CardDescription className="mt-1">Tour details and status</CardDescription>
                </div>
                <Badge
                  variant={tour.status === 'active' ? 'success' : 'secondary'}
                  className="shadow-sm text-sm px-3 py-1"
                >
                  {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <CalendarIcon className="size-3 sm:size-4 text-primary" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Start Date</p>
                  </div>
                  <p className="font-semibold text-base sm:text-lg">
                    {tour.startDate
                      ? formatDate(tour.startDate)
                      : '-'}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <CalendarIcon className="size-3 sm:size-4 text-primary" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">End Date</p>
                  </div>
                  <p className="font-semibold text-base sm:text-lg">
                    {tour.endDate
                      ? formatDate(tour.endDate)
                      : '-'}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <MapPinIcon className="size-3 sm:size-4 text-primary" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Start Location</p>
                  </div>
                  <p className="font-semibold text-base sm:text-lg truncate">{tour.startLocation || '-'}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-300">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <MapPinIcon className="size-3 sm:size-4 text-primary" />
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">End Location</p>
                  </div>
                  <p className="font-semibold text-base sm:text-lg truncate">{tour.endLocation || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>

        {/* Destinations Section */}
        <AnimatedWrapper direction="up" delay={200}>
          <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2 mt-4">
                    <MapPinIcon className="size-5 text-primary" />
                    Destinations
                    <Badge variant="secondary" className="ml-2">
                      {destinations.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    All destinations for this tour
                  </CardDescription>
                </div>
                <NavigationLink href={`/dashboard/tours/${id}/destinations/new`} message="Loading...">
                  <Button className="shadow-md hover:shadow-lg transition-all duration-300">
                    <PlusIcon className="size-4 mr-2" />
                    Add Destination
                  </Button>
                </NavigationLink>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {destinations.length === 0
                ? (
                    <AnimatedWrapper direction="up" delay={300}>
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center space-y-6 max-w-md">
                          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                            <MapPinIcon className="size-10 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-2">No destinations yet</h3>
                            <p className="text-muted-foreground mb-6">
                              Add your first destination to start building your tour itinerary.
                            </p>
                          </div>
                          <NavigationLink href={`/dashboard/tours/${id}/destinations/new`} message="Loading...">
                            <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-300">
                              <PlusIcon className="size-4 mr-2" />
                              Add Destination
                            </Button>
                          </NavigationLink>
                        </div>
                      </div>
                    </AnimatedWrapper>
                  )
                : (
                    <>
                      {/* Mobile Card View */}
                      <div className="block md:hidden space-y-3">
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
                          <Card key={destination.id} className="border-2 hover:shadow-md transition-all">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <h3 className="text-base font-semibold flex-1">{destination.name}</h3>
                                <DestinationActions
                                  destinationId={destination.id}
                                  destinationName={destination.name}
                                  tourId={id}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Date</p>
                                    <p className="font-medium">{formatDate(destination.date)}</p>
                                  </div>
                                </div>
                                {destination.timeSlot && (
                                  <div className="flex items-center gap-2">
                                    <ClockIcon className="size-4 text-muted-foreground shrink-0" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Time</p>
                                      <p className="font-medium text-xs">
                                        {destination.timeSlot.start_time}
                                        {' '}
                                        -
                                        {destination.timeSlot.end_time}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {destination.coordinate && (
                                  <div className="col-span-2 flex items-center gap-2">
                                    <NavigationIcon className="size-4 text-muted-foreground shrink-0" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Coordinates</p>
                                      <p className="font-mono text-xs">
                                        {destination.coordinate.lat.toFixed(4)}
                                        ,
                                        {destination.coordinate.lng.toFixed(4)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {destination.images && destination.images.length > 0 && (
                                <div className="flex gap-2 pt-2 border-t">
                                  {destination.images.slice(0, 3).map((img, idx) => (
                                    <Image
                                      // eslint-disable-next-line react/no-array-index-key
                                      key={`${destination.id}-${idx}`}
                                      src={img}
                                      alt={`${destination.name} ${idx + 1}`}
                                      width={48}
                                      height={48}
                                      className="size-12 rounded-lg object-cover border-2 border-border"
                                    />
                                  ))}
                                  {destination.images.length > 3 && (
                                    <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-xs font-semibold border-2 border-border">
                                      +
                                      {destination.images.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="font-semibold">Name</TableHead>
                              <TableHead className="font-semibold">Date</TableHead>
                              <TableHead className="font-semibold">Time Slot</TableHead>
                              <TableHead className="font-semibold">Coordinates</TableHead>
                              <TableHead className="font-semibold">Images</TableHead>
                              <TableHead className="text-right font-semibold">Actions</TableHead>
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
                            }, index: number) => (
                              <AnimatedTableRow key={destination.id} index={index}>
                                <TableCell className="font-semibold">
                                  {destination.name}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="size-4 text-muted-foreground" />
                                    <span>
                                      {formatDate(destination.date)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {destination.timeSlot
                                    ? (
                                        <div className="flex items-center gap-2">
                                          <ClockIcon className="size-4 text-muted-foreground" />
                                          <div className="text-sm">
                                            <div className="font-medium">
                                              {destination.timeSlot.start_time}
                                              {' '}
                                              -
                                              {' '}
                                              {destination.timeSlot.end_time}
                                            </div>
                                            {destination.timeSlot.slot_label && (
                                              <div className="text-muted-foreground text-xs">
                                                {destination.timeSlot.slot_label}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                </TableCell>
                                <TableCell>
                                  {destination.coordinate
                                    ? (
                                        <div className="flex items-center gap-2">
                                          <NavigationIcon className="size-4 text-muted-foreground" />
                                          <div className="text-sm font-mono">
                                            {destination.coordinate.lat.toFixed(4)}
                                            ,
                                            {' '}
                                            {destination.coordinate.lng.toFixed(4)}
                                          </div>
                                        </div>
                                      )
                                    : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                </TableCell>
                                <TableCell>
                                  {destination.images && destination.images.length > 0
                                    ? (
                                        <div className="flex gap-2">
                                          {destination.images.slice(0, 3).map(img => (
                                            <Image
                                              key={`${destination.id}-${img}`}
                                              src={img}
                                              alt={`${destination.name} image`}
                                              width={48}
                                              height={48}
                                              className="size-12 rounded-lg object-cover border-2 border-border hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md"
                                            />
                                          ))}
                                          {destination.images.length > 3 && (
                                            <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-xs font-semibold border-2 border-border hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md">
                                              +
                                              {destination.images.length - 3}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    : (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <ImageIcon className="size-4" />
                                          <span>-</span>
                                        </div>
                                      )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DestinationActions
                                    destinationId={destination.id}
                                    destinationName={destination.name}
                                    tourId={id}
                                  />
                                </TableCell>
                              </AnimatedTableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>
    </div>
  );
}
