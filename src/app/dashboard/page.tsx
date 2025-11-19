import { desc, eq } from 'drizzle-orm';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TourActions } from '@/components/dashboard/TourActions';
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
      .orderBy(desc(tours.createdAt));
    return allTours;
  } catch (error) {
    console.error('Error fetching tours:', error);
    return [];
  }
}

async function hasActiveTour() {
  try {
    const activeTour = await db
      .select()
      .from(tours)
      .where(eq(tours.status, 'active'))
      .limit(1);
    return activeTour.length > 0;
  } catch {
    return false;
  }
}

export default async function DashboardPage() {
  const allTours = await getTours();
  const hasActive = await hasActiveTour();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <DashboardHeader />

        {/* Tours Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tours Management</CardTitle>
                <CardDescription>
                  Manage your tours and destinations
                </CardDescription>
              </div>
              <Link href="/dashboard/tours/new">
                <Button>
                  <PlusIcon className="size-4" />
                  Create New Tour
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {allTours.length === 0
              ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <p className="text-lg text-muted-foreground">
                        No tours yet. Create your first tour to get started.
                      </p>
                      <Link href="/dashboard/tours/new">
                        <Button>Create Tour</Button>
                      </Link>
                    </div>
                  </div>
                )
              : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tour Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Start Location</TableHead>
                        <TableHead>End Location</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                      }) => (
                        <TableRow key={tour.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/dashboard/tours/${tour.id}`}
                              className="hover:underline"
                            >
                              {tour.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tour.status === 'active' ? 'default' : 'secondary'
                              }
                            >
                              {tour.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tour.startDate
                              ? new Date(tour.startDate).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {tour.endDate
                              ? new Date(tour.endDate).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>{tour.startLocation || '-'}</TableCell>
                          <TableCell>{tour.endLocation || '-'}</TableCell>
                          <TableCell>
                            {new Date(tour.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <TourActions
                              tourId={tour.id}
                              currentStatus={tour.status}
                              hasActiveTour={hasActive}
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
