'use client';

import type { TourFilters } from '@/components/dashboard/TourFilterBar';
import { CalendarIcon, MapPinIcon } from 'lucide-react';
import moment from 'moment';
import { useMemo } from 'react';
import { AnimatedTableRow } from '@/components/dashboard/AnimatedTableRow';
import { TourActions } from '@/components/dashboard/TourActions';
import { Badge } from '@/components/ui/badge';
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
        const createdMoment = moment(tour.createdAt);
        const filterMoment = moment(filters.filterCreatedDate);
        if (!createdMoment.isValid() || createdMoment.isBefore(filterMoment, 'day')) {
          return false;
        }
      }

      // Filter by start date - show tours starting on or after the selected date
      if (filters.filterStartDate) {
        if (!tour.startDate) {
          return false;
        }
        const startMoment = moment(tour.startDate);
        const filterMoment = moment(filters.filterStartDate);
        if (!startMoment.isValid() || startMoment.isBefore(filterMoment, 'day')) {
          return false;
        }
      }

      // Filter by end date - show tours ending on or before the selected date
      if (filters.filterEndDate) {
        if (!tour.endDate) {
          return false;
        }
        const endMoment = moment(tour.endDate);
        const filterMoment = moment(filters.filterEndDate);
        if (!endMoment.isValid() || endMoment.isAfter(filterMoment, 'day')) {
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
      {/* Stats Cards - Compact buttons on desktop, tabs on mobile */}
      <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 rounded-lg border-2 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between sm:justify-center sm:flex-col sm:gap-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Tours</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 rounded-lg border-2 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between sm:justify-center sm:flex-col sm:gap-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Tours</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.active}</p>
          </div>
        </div>
        <div className="flex-1 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 rounded-lg border-2 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between sm:justify-center sm:flex-col sm:gap-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Inactive Tours</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.inactive}</p>
          </div>
        </div>
      </div>

      {/* Tours Table */}
      <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="bg-linear-to-r from-primary/5 to-primary/10 border-b p-4 sm:p-6 rounded-t-lg mb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 mt-0">
                Tours Management
              </CardTitle>
              <CardDescription className="mt-1 text-sm sm:text-base">
                {filteredTours.length}
                {' '}
                of
                {' '}
                {tours.length}
                {' '}
                tours
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
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
                <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3">
                    {filteredTours.map(tour => (
                      <Card key={tour.id} className="border-2 hover:shadow-md transition-all">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <NavigationLink
                              href={`/dashboard/tours/${tour.id}`}
                              message="Loading tour..."
                              className="hover:text-primary transition-colors duration-200 font-semibold hover:underline flex-1"
                            >
                              <h3 className="text-base font-semibold max-w-[80%] truncate">{tour.name}</h3>
                            </NavigationLink>
                            <Badge
                              variant={
                                tour.status === 'active' ? 'success' : 'secondary'
                              }
                              className="shadow-sm ml-2"
                            >
                              {tour.status.charAt(0).toUpperCase() + tour.status.slice(1)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Start</p>
                                <p className="font-medium">
                                  {tour.startDate ? formatDate(tour.startDate) : '-'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">End</p>
                                <p className="font-medium">
                                  {tour.endDate ? formatDate(tour.endDate) : '-'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="size-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">From</p>
                                <p className="font-medium truncate">{tour.startLocation || '-'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="size-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">To</p>
                                <p className="font-medium truncate">{tour.endLocation || '-'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <TourActions
                              tourId={tour.id}
                              currentStatus={tour.status}
                              activeTourId={activeTourId}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold">Tour Name</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Start Date</TableHead>
                          <TableHead className="font-semibold">End Date</TableHead>
                          <TableHead className="font-semibold">Start Location</TableHead>
                          <TableHead className="font-semibold">End Location</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTours.map((tour, index) => (
                          <AnimatedTableRow key={tour.id} index={index}>
                            <TableCell className="font-medium">
                              <NavigationLink
                                href={`/dashboard/tours/${tour.id}`}
                                message="Loading tour..."
                                className="hover:text-primary transition-colors duration-200 font-semibold hover:underline"
                              >
                                {tour.name}
                              </NavigationLink>
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
                </>
              )}
        </CardContent>
      </Card>
    </>
  );
}
