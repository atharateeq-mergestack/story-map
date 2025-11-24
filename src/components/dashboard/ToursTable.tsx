'use client';

import type { TourFilters } from '@/components/dashboard/TourFilterBar';
import { CalendarIcon, MapPinIcon } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { AnimatedTableRow } from '@/components/dashboard/AnimatedTableRow';
import { TourActions } from '@/components/dashboard/TourActions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

type Tour = {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  startDate: string | null;
  endDate: string | null;
  startLocation: string | null;
  endLocation: string | null;
  createdAt: Date | string;
};

type ToursTableProps = {
  tours: Tour[];
  activeTourId: string | null;
  filters: TourFilters;
};

export function ToursTable({ tours, activeTourId, filters }: ToursTableProps) {
  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      // Semantic search across name, description, locations, and status
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = tour.name.toLowerCase().includes(searchLower);
        const matchesDescription = tour.description?.toLowerCase().includes(searchLower) || false;
        const matchesStartLocation = tour.startLocation?.toLowerCase().includes(searchLower) || false;
        const matchesEndLocation = tour.endLocation?.toLowerCase().includes(searchLower) || false;
        const matchesStatus = tour.status.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesDescription && !matchesStartLocation && !matchesEndLocation && !matchesStatus) {
          return false;
        }
      }

      // Filter by created date - show tours created on or after the selected date
      if (filters.filterCreatedDate) {
        const createdDate = new Date(tour.createdAt).toISOString().split('T')[0];
        if (createdDate && createdDate < filters.filterCreatedDate) {
          return false;
        }
      }

      // Filter by start date - show tours starting on or after the selected date
      if (filters.filterStartDate) {
        if (!tour.startDate || tour.startDate < filters.filterStartDate) {
          return false;
        }
      }

      // Filter by end date - show tours ending on or before the selected date
      if (filters.filterEndDate) {
        if (!tour.endDate || tour.endDate > filters.filterEndDate) {
          return false;
        }
      }

      return true;
    });
  }, [tours, filters]);

  const stats = useMemo(() => {
    return {
      total: filteredTours.length,
      active: filteredTours.filter(t => t.status === 'active').length,
      inactive: filteredTours.filter(t => t.status === 'inactive').length,
    };
  }, [filteredTours]);

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tours</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tours</p>
                <p className="text-3xl font-bold mt-2">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive Tours</p>
                <p className="text-3xl font-bold mt-2">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tours Table */}
      <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                Tours Management
              </CardTitle>
              <CardDescription className="mt-1 text-base">
                {filteredTours.length}
                {' '}
                of
                {tours.length}
                {' '}
                tours
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {filteredTours.length === 0
            ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-6 max-w-md">
                    <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <MapPinIcon className="size-10 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">No tours found</h3>
                      <p className="text-muted-foreground mb-6">
                        {tours.length === 0
                          ? 'Create your first tour to get started and begin organizing your destinations.'
                          : 'Try adjusting your filters to see more results.'}
                      </p>
                    </div>
                  </div>
                </div>
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
                      {filteredTours.map((tour, index) => (
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
                                tour.status === 'active' ? 'success' : 'secondary'
                              }
                              className="shadow-sm"
                            >
                              {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="size-4 text-muted-foreground" />
                              <span>
                                {tour.startDate
                                  ? formatDate(tour.startDate)
                                  : '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="size-4 text-muted-foreground" />
                              <span>
                                {tour.endDate
                                  ? formatDate(tour.endDate)
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
                            {formatDate(tour.createdAt)}
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
    </>
  );
}
