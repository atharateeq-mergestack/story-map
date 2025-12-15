'use client';

import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';
import { Env } from '@/libs/Env';
import destinationController from '@/store/destinationController';
import { TourHero } from '../TourHero';
import { TourMapMobile } from './TourMapMobile';

type Destination = {
  id: string;
  name: string;
  date: string;
  timeSlot: {
    start_time: string;
    end_time: string;
    slot_label?: string;
  } | null;
  coordinate: { lat: number; lng: number } | null;
  description: string | null;
  images?: string[];
};

type Tour = {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  startLocation: string | null;
  endLocation: string | null;
};

type TourViewMobileProps = {
  tour: Tour;
  destinationsByDate: Record<string, Destination[]>;
  dates: string[];
};

function calculateTotalDays(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) {
    return 0;
  }
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid()) {
    return 0;
  }
  return end.diff(start, 'days') + 1;
}

/**
 * TourViewMobile Component
 *
 * Mobile-optimized tour view for screens ≤1000px:
 * - Map for each day (no scroll-to-zoom, only 2-finger touch)
 * - Horizontal scrollable destination list at bottom
 * - Clicking destination shows detail in the same scrollable area
 * - No popups on map markers
 */
export function TourViewMobile({ tour, destinationsByDate, dates }: TourViewMobileProps) {
  const activeDate = destinationController.useScopeState('activeDate')[0];
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const mapboxToken = Env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  const totalDays = calculateTotalDays(tour.startDate, tour.endDate);

  // Initialize activeDate to first date on mount
  useEffect(() => {
    if (!activeDate && dates.length > 0) {
      destinationController.setActiveDate(dates[0] ?? null);
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setSelectedDateIndex(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync selectedDateIndex with activeDate
  useEffect(() => {
    const index = dates.findIndex(date => date === activeDate);
    if (index !== -1) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setSelectedDateIndex(index);
    }
  }, [activeDate, dates]);

  // Handle date navigation
  const handleDateClick = (date: string, index: number) => {
    destinationController.setActiveDate(date);
    destinationController.clearSelectedDestination();
    setSelectedDateIndex(index);
  };

  // Handle destination click from map marker
  const handleMarkerClick = (destinationId: string) => {
    destinationController.setSelectedDestination(destinationId);
  };

  // Calculate current date
  const currentDate = dates[selectedDateIndex] || dates[0] || '';

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Mapbox access token is not configured.</p>
          <p className="text-sm text-muted-foreground">
            Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (!mapboxToken.startsWith('pk.')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Invalid Mapbox token format</p>
          <p className="text-sm text-muted-foreground">Use a public access token (pk.*) with Mapbox GL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <TourHero
        tour={tour}
        totalDays={totalDays}
        backgroundImageUrl="/worldwide-tour.jpg"
      />

      {/* Date Navigation */}
      {dates.length > 0 && (
        <nav
          ref={navRef}
          className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm"
        >
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 overflow-x-auto py-2">
              {dates.map((date, index) => {
                const isActive = activeDate === date;
                return (
                  <Button
                    key={date}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateClick(date, index)}
                    className={cn(
                      'whitespace-nowrap shrink-0 flex items-center gap-2 px-3 sm:px-4 h-9 sm:h-10 transition-all',
                      isActive && 'shadow-md',
                    )}
                  >
                    <span className="text-xs sm:text-sm font-medium">
                      {formatDate(date)}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content: Map for current day */}
      <div className="flex-1 relative" style={{ minHeight: '100vh' }}>
        {dates.map((date, dayIndex) => {
          const dayDestinations = destinationsByDate[date] || [];
          const isActive = selectedDateIndex === dayIndex;

          return (
            <div
              key={date}
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
              )}
            >
              {/* Map with integrated destination cards and detail panels */}
              <div className="h-full w-full">
                <TourMapMobile
                  destinations={dayDestinations.map(dest => ({ ...dest, date }))}
                  mapboxAccessToken={mapboxToken}
                  currentDate={currentDate}
                  selectedDateIndex={selectedDateIndex}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
