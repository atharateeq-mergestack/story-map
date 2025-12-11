'use client';

import moment from 'moment';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/common/Text';
import { cn, formatDate } from '@/lib/utils';
import { Env } from '@/libs/Env';
import destinationController from '@/store/destinationController';
import { DestinationDetailPanel } from './DestinationDetailPanel';
import { TourHero } from './TourHero';
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
  const selectedDestinationId = destinationController.useScopeState('selectedDestinationId')[0];
  const activeDate = destinationController.useScopeState('activeDate')[0];
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const destinationRefs = useRef<Record<string, HTMLDivElement>>({});
  const isAutoScrollingRef = useRef<boolean>(false);
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

  // Handle destination card click
  const handleDestinationClick = (destination: Destination) => {
    destinationController.setSelectedDestination(destination.id);
    destinationController.setActiveDate(destination.date);
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    destinationController.clearSelectedDestination();
  };

  // Calculate current destinations using useMemo to avoid dependency issues
  const currentDate = dates[selectedDateIndex] || dates[0] || '';
  const currentDestinations = useMemo(
    () => destinationsByDate[currentDate] || [],
    [destinationsByDate, currentDate],
  );
  const selectedDestination = useMemo(
    () => (selectedDestinationId
      ? currentDestinations.find(d => d.id === selectedDestinationId) || null
      : null),
    [currentDestinations, selectedDestinationId],
  );

  // Check if detail mode is active (any destination selected for current day)
  const isDetailMode = selectedDestinationId !== null && selectedDestination !== null;

  // Auto-select destination when it's 50% in view during scroll
  useEffect(() => {
    if (!isDetailMode || !scrollContainerRef.current) {
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    const handleScroll = () => {
      // Skip if auto-scrolling (programmatic scroll)
      if (isAutoScrollingRef.current) {
        return;
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      // Find destination that's 50% in view (closest to center)
      let closestDestinationId: string | null = null;
      let closestDistance = Infinity;

      currentDestinations.forEach((destination: Destination) => {
        const element = destinationRefs.current[destination.id];
        if (!element) {
          return;
        }

        const rect = element.getBoundingClientRect();
        const elementCenter = rect.left + rect.width / 2;
        const distance = Math.abs(elementCenter - containerCenter);

        // Check if element is at least 50% visible
        const visibleWidth = Math.min(rect.right, containerRect.right) - Math.max(rect.left, containerRect.left);
        const visibilityRatio = visibleWidth / rect.width;

        if (visibilityRatio >= 0.5 && distance < closestDistance) {
          closestDestinationId = destination.id;
          closestDistance = distance;
        }
      });

      // Update selection if a different destination is closest
      if (closestDestinationId && closestDestinationId !== selectedDestinationId) {
        destinationController.setSelectedDestination(closestDestinationId);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    // Call immediately to set initial state
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [isDetailMode, currentDestinations, selectedDestinationId]);

  // Scroll to selected destination when it changes (if in detail mode)
  useEffect(() => {
    if (!isDetailMode || !selectedDestinationId || !scrollContainerRef.current) {
      return;
    }

    const element = destinationRefs.current[selectedDestinationId];
    if (!element) {
      return;
    }

    // Set flag to prevent scroll handler from updating selection
    isAutoScrollingRef.current = true;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const elementLeft = elementRect.left - containerRect.left + scrollLeft;
    const elementWidth = elementRect.width;
    const containerWidth = containerRect.width;
    const targetScroll = elementLeft - (containerWidth / 2) + (elementWidth / 2);

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });

    // Clear flag after scroll completes
    const timeoutId = setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 600);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedDestinationId, isDetailMode]);

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
      <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 200px)' }}>
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
              {/* Map */}
              <div className="h-full w-full">
                <TourMapMobile
                  destinations={dayDestinations}
                  mapboxAccessToken={mapboxToken}
                  onMarkerClick={handleMarkerClick}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Destinations List - Horizontal Scrollable */}
      <div className="sticky bottom-0 z-50 bg-background border-t shadow-lg">
        <div className="px-4 py-3">
          {/* Day Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
              {selectedDateIndex + 1}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Day
                {' '}
                {selectedDateIndex + 1}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatDate(currentDate)}
              </span>
            </div>
          </div>

          {/* Horizontal Scrollable Destinations */}
          {currentDestinations.length === 0
            ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <Text color="muted" className="text-sm">
                      No destinations for this day
                    </Text>
                  </CardContent>
                </Card>
              )
            : (
                <div
                  ref={scrollContainerRef}
                  className="overflow-x-auto pb-2 -mx-4 px-4"
                >
                  <div className="flex gap-3" style={{ width: 'max-content' }}>
                    {currentDestinations.map((destination, index) => {
                      const isActive = selectedDestinationId === destination.id;
                      const isSelected = selectedDestination?.id === destination.id;
                      const selectedIndex = currentDestinations.findIndex(d => d.id === selectedDestinationId);
                      const isBeforeSelected = selectedIndex !== -1 && index === selectedIndex - 1;
                      const isAfterSelected = selectedIndex !== -1 && index === selectedIndex + 1;
                      const shouldBlur = isDetailMode && (isBeforeSelected || isAfterSelected);

                      return (
                        <div
                          key={destination.id}
                          ref={(el: HTMLDivElement | null) => {
                            if (el) {
                              destinationRefs.current[destination.id] = el;
                            }
                          }}
                          className={cn(
                            'shrink-0 transition-all',
                            isDetailMode
                              ? 'w-[85vw] max-w-[350px]'
                              : 'w-[240px]',
                            shouldBlur && 'blur-sm opacity-70',
                          )}
                        >
                          {isDetailMode
                            ? (
                                // Expanded detail view for all destinations
                                <div
                                  className={cn(
                                    'bg-background rounded-lg overflow-hidden shadow-lg transition-all',
                                    isSelected
                                      ? 'border-2 border-primary'
                                      : 'border border-border',
                                  )}
                                >
                                  <div className="relative">
                                    <DestinationDetailPanel
                                      destination={destination}
                                      isBlurred={false}
                                      isTop={isSelected}
                                    />
                                    {/* Close button - only show on selected destination */}
                                    {isSelected && (
                                      <div className="absolute top-2 right-2 z-10">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleBackToOverview}
                                          className="h-8 w-8 rounded-full p-0 bg-background/90 backdrop-blur"
                                        >
                                          <span className="sr-only">Close</span>
                                          ×
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            : (
                                // Compact card view
                                <Card
                                  className={cn(
                                    'cursor-pointer transition-all h-full',
                                    isActive && 'ring-2 ring-primary shadow-lg',
                                  )}
                                  onClick={() => handleDestinationClick(destination)}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-2">
                                      {/* Name */}
                                      {destination.name && (
                                        <h3 className="text-sm font-semibold line-clamp-1">
                                          {destination.name}
                                        </h3>
                                      )}

                                      {/* Time */}
                                      {destination.timeSlot && (
                                        <p className="text-xs text-muted-foreground">
                                          {destination.timeSlot.start_time}
                                          {' '}
                                          -
                                          {' '}
                                          {destination.timeSlot.end_time}
                                          {destination.timeSlot.slot_label && ` (${destination.timeSlot.slot_label})`}
                                        </p>
                                      )}

                                      {/* Description */}
                                      {destination.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {destination.description}
                                        </p>
                                      )}

                                      {/* Image thumbnail if available */}
                                      {destination.images && destination.images.length > 0 && (
                                        <div className="w-full h-32 rounded overflow-hidden bg-gray-200 mt-2">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={destination.images[0]}
                                            alt={destination.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
