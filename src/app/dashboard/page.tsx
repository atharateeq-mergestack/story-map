import { and, desc, eq } from 'drizzle-orm';
import { CalendarIcon, MapPinIcon, PlusIcon, SparklesIcon } from 'lucide-react';
import Link from 'next/link';
import { AnimatedTableRow } from '@/components/dashboard/AnimatedTableRow';
import { BulkUploadButton } from '@/components/dashboard/BulkUploadButton';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TourActions } from '@/components/dashboard/TourActions';
import { AnimatedWrapper } from '@/components/ui/animated';
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
import { tours } from '@/db/schema';

async function getTours() {
  try {
    const allTours = await db
      .select()
      .from(tours)
      .where(eq(tours.isDeleted, false))
      .orderBy(desc(tours.createdAt));
    return allTours;
  } catch (error) {
    console.error('Error fetching tours:', error);
    return [];
  }
}

async function getActiveTourId() {
  try {
    const activeTour = await db
      .select({ id: tours.id })
      .from(tours)
      .where(and(eq(tours.status, 'active'), eq(tours.isDeleted, false)))
      .limit(1);
    return activeTour[0]?.id || null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const allTours = await getTours();
  const activeTourId = await getActiveTourId();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <AnimatedWrapper direction="down" delay={0}>
          <DashboardHeader />
        </AnimatedWrapper>

        {/* Stats Cards */}
        <AnimatedWrapper direction="up" delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tours</p>
                    <p className="text-3xl font-bold mt-2">{allTours.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <SparklesIcon className="size-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Tours</p>
                    <p className="text-3xl font-bold mt-2">
                      {allTours.filter(t => t.status === 'active').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-success/10">
                    <CalendarIcon className="size-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inactive Tours</p>
                    <p className="text-3xl font-bold mt-2">
                      {allTours.filter(t => t.status === 'inactive').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-muted">
                    <MapPinIcon className="size-6 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedWrapper>

        {/* Tours Section */}
        <AnimatedWrapper direction="up" delay={200}>
          <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <SparklesIcon className="size-5 text-primary" />
                    Tours Management
                  </CardTitle>
                  <CardDescription className="mt-1 text-base">
                    Manage your tours and destinations
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <BulkUploadButton />
                  <Link href="/dashboard/tours/new">
                    <Button className="shadow-md hover:shadow-lg transition-all duration-300">
                      <PlusIcon className="size-4 mr-2" />
                      Create New Tour
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {allTours.length === 0
                ? (
                    <AnimatedWrapper direction="up" delay={300}>
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center space-y-6 max-w-md">
                          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                            <SparklesIcon className="size-10 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold mb-2">No tours yet</h3>
                            <p className="text-muted-foreground mb-6">
                              Create your first tour to get started and begin organizing your destinations.
                            </p>
                          </div>
                          <Link href="/dashboard/tours/new">
                            <Button size="lg" className="shadow-md hover:shadow-lg transition-all duration-300">
                              <PlusIcon className="size-4 mr-2" />
                              Create Tour
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </AnimatedWrapper>
                  )
                : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold">Tour Name</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Start Date</TableHead>
                            <TableHead className="font-semibold">End Date</TableHead>
                            <TableHead className="font-semibold">Start Location</TableHead>
                            <TableHead className="font-semibold">End Location</TableHead>
                            <TableHead className="font-semibold">Created</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allTours.map((tour: {
                            id: string;
                            name: string;
                            status: 'active' | 'inactive';
                            startDate: string | null;
                            endDate: string | null;
                            startLocation: string | null;
                            endLocation: string | null;
                            createdAt: Date | string;
                          }, index: number) => (
                            <AnimatedTableRow key={tour.id} index={index}>
                              <TableCell className="font-medium">
                                <Link
                                  href={`/dashboard/tours/${tour.id}`}
                                  className="hover:text-primary transition-colors duration-200 font-semibold hover:underline"
                                >
                                  {tour.name}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    tour.status === 'active' ? 'default' : 'secondary'
                                  }
                                  className="shadow-sm"
                                >
                                  {tour.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="size-4 text-muted-foreground" />
                                  <span>
                                    {tour.startDate
                                      ? new Date(tour.startDate).toLocaleDateString()
                                      : '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="size-4 text-muted-foreground" />
                                  <span>
                                    {tour.endDate
                                      ? new Date(tour.endDate).toLocaleDateString()
                                      : '-'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPinIcon className="size-4 text-muted-foreground" />
                                  <span>{tour.startLocation || '-'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPinIcon className="size-4 text-muted-foreground" />
                                  <span>{tour.endLocation || '-'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(tour.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <TourActions
                                  tourId={tour.id}
                                  currentStatus={tour.status}
                                  activeTourId={activeTourId}
                                />
                              </TableCell>
                            </AnimatedTableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>
    </div>
  );
}
