'use client';

import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heading } from '@/components/ui/common/Heading';
import { Text } from '@/components/ui/common/Text';
import { formatDate } from '@/lib/utils';
import { Env } from '@/libs/Env';
import { DestinationDetailPanel } from './DestinationDetailPanel';
import { TourMap } from './TourMap';

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

type TourViewProps = {
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
  return end.diff(start, 'days') + 1; // Include both start and end days
}

export function TourView({ tour, destinationsByDate, dates }: TourViewProps) {
  const [activeDate, setActiveDate] = useState<string | null>(dates[0] || null);
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const daySectionRefs = useRef<Record<string, HTMLDivElement>>({});
  const destinationRefs = useRef<Record<string, HTMLDivElement>>({});
  const mapboxToken = Env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Flatten all destinations for the map
  const allDestinations = dates.flatMap(date => destinationsByDate[date] || []);

  const totalDays = calculateTotalDays(tour.startDate, tour.endDate);

  // Handle scroll to detect which day section is in view
  useEffect(() => {
    const handleScroll = () => {
      // Detect which day section is in view
      let currentActiveIndex = 0;
      for (let i = 0; i < dates.length; i++) {
        const key = dates[i] as keyof typeof daySectionRefs.current;
        const section = daySectionRefs.current[key];
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100) {
            currentActiveIndex = i;
          }
        }
      }
      const newActiveDate = dates[currentActiveIndex] || null;
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setActiveDate((prevDate) => {
        // Only update if the date actually changed
        return prevDate !== newActiveDate ? newActiveDate : prevDate;
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [dates]);

  // Handle destination click - open detail panel
  const handleDestinationClick = (destination: Destination) => {
    setSelectedDestination(destination);
    setActiveDestinationId(destination.id);
    // Ensure the active date matches the destination's date
    setActiveDate(destination.date);
  };

  // Handle marker click from map
  const handleMarkerClick = (destinationId: string) => {
    const destination = allDestinations.find(d => d.id === destinationId);
    if (destination) {
      setSelectedDestination(destination);
      setActiveDestinationId(destinationId);
      // Ensure the active date matches the destination's date
      setActiveDate(destination.date);
      // Scroll to the day section for this destination
      const section = daySectionRefs.current[destination.date];
      if (section) {
        const navHeight = navRef.current?.offsetHeight || 0;
        const elementPosition = section.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - navHeight - 20,
          behavior: 'smooth',
        });
      }
    }
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    setSelectedDestination(null);
    setActiveDestinationId(null);
  };

  // Scroll to date section when date is clicked
  const handleDateClick = (date: string) => {
    const section = daySectionRefs.current[date];
    if (section) {
      const navHeight = navRef.current?.offsetHeight || 0;
      const elementPosition = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight - 20,
        behavior: 'smooth',
      });
      setActiveDate(date);
    }
  };

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Mapbox access token is not configured.
          </p>
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
          <p className="text-destructive font-medium">
            Invalid Mapbox token format
          </p>
          <p className="text-sm text-muted-foreground">
            Use a public access token (pk.*) with Mapbox GL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh] flex flex-col justify-end bg-muted/30"
      >
        {/* Background Image Placeholder */}
        {/* <div className="absolute inset-0 bg-linear-to-b from-muted/50 to-background/80" /> */}

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 pb-6 sm:pb-8 pt-16 sm:pt-20 md:pt-24">
          <div className="max-w-3xl space-y-4 sm:space-y-6">
            <Heading level={1} size="5xl" weight="bold" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground">
              {tour.name}
            </Heading>

            {tour.description && (
              <Text size="lg" color="muted" className="text-sm sm:text-base md:text-lg max-w-2xl">
                {tour.description}
              </Text>
            )}

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              {tour.startLocation && tour.endLocation && (
                <div className="flex flex-wrap items-center gap-2">
                  <Text weight="medium" className="text-xs sm:text-sm">Going from</Text>
                  <Text color="muted" className="text-xs sm:text-sm">{tour.startLocation}</Text>
                  <Text color="muted" className="text-xs sm:text-sm">→</Text>
                  <Text weight="medium" className="text-xs sm:text-sm">Going to</Text>
                  <Text color="muted" className="text-xs sm:text-sm">{tour.endLocation}</Text>
                </div>
              )}

              {tour.startDate && tour.endDate && (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div>
                    <Text size="sm" color="muted" className="text-xs">Start Date</Text>
                    <Text weight="medium" className="text-xs sm:text-sm">
                      {formatDate(tour.startDate)}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" color="muted" className="text-xs">End Date</Text>
                    <Text weight="medium" className="text-xs sm:text-sm">
                      {formatDate(tour.endDate)}
                    </Text>
                  </div>
                  {totalDays > 0 && (
                    <div>
                      <Text size="sm" color="muted" className="text-xs">Total Days</Text>
                      <Text weight="medium" className="text-xs sm:text-sm">
                        {totalDays}
                        {' '}
                        {totalDays === 1 ? 'Day' : 'Days'}
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Days Navigation - Sticky below header */}
        {dates.length > 0 && (
          <nav
            ref={navRef}
            className="sticky top-14 sm:top-16 z-20 w-full border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm"
          >
            <div className="container mx-auto px-3 sm:px-4">
              <div className="flex h-12 sm:h-14 md:h-16 items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
                {dates.map(date => (
                  <Button
                    key={date}
                    variant={activeDate === date ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateClick(date)}
                    className="whitespace-nowrap text-xs sm:text-sm shrink-0"
                  >
                    {formatDate(date)}
                  </Button>
                ))}
              </div>
            </div>
          </nav>
        )}
      </section>

      {/* Day Sections */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {dates.map((date, dayIndex) => {
          const dayDestinations = destinationsByDate[date] || [];
          const dayNumber = dayIndex + 1;

          return (
            <section
              key={date}
              ref={(el: HTMLDivElement | null) => {
                if (el) {
                  daySectionRefs.current[date] = el;
                }
              }}
              className="mb-12 sm:mb-16"
            >
              {/* Day Section Title */}
              <Heading level={2} size="2xl" weight="bold" className="mb-4 sm:mb-6 text-xl sm:text-2xl">
                Day
                {' '}
                {dayNumber}
                {' '}
                –
                {' '}
                {formatDate(date)}
              </Heading>

              {/* Split Layout: Destinations/Detail (30%) | Map (70%) - Stack on mobile/tablet */}
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                {/* Left: Destinations List or Detail Panel (30%) */}
                <div className="w-full lg:w-[30%] order-2 lg:order-1">
                  {selectedDestination && selectedDestination.date === date
                    ? (
                        <div className="sticky top-14 sm:top-20">
                          <DestinationDetailPanel
                            destination={selectedDestination}
                            onClose={handleBackToOverview}
                          />
                        </div>
                      )
                    : (
                        <div className="space-y-3 sm:space-y-4">
                          {dayDestinations.length === 0
                            ? (
                                <Card>
                                  <CardContent className="p-4 sm:p-6 text-center">
                                    <Text color="muted" className="text-sm sm:text-base">No destinations for this day</Text>
                                  </CardContent>
                                </Card>
                              )
                            : (
                                dayDestinations.map(destination => (
                                  <Card
                                    key={destination.id}
                                    ref={(el) => {
                                      if (el) {
                                        destinationRefs.current[destination.id] = el;
                                      }
                                    }}
                                    className={`cursor-pointer transition-all ${
                                      activeDestinationId === destination.id
                                        ? 'ring-2 ring-primary shadow-lg'
                                        : ''
                                    }`}
                                    onClick={() => handleDestinationClick(destination)}
                                  >
                                    <CardContent className="p-3 sm:p-4">
                                      <Heading level={4} size="sm" weight="semibold" className="mb-2 text-sm sm:text-base">
                                        {destination.name}
                                      </Heading>
                                      {destination.timeSlot && (
                                        <Text size="sm" color="muted" className="mb-2 text-xs sm:text-sm">
                                          {destination.timeSlot.start_time}
                                          {' '}
                                          -
                                          {' '}
                                          {destination.timeSlot.end_time}
                                          {destination.timeSlot.slot_label && (
                                            <>
                                              {' '}
                                              (
                                              {destination.timeSlot.slot_label}
                                              )
                                            </>
                                          )}
                                        </Text>
                                      )}
                                      {destination.description && (
                                        <Text size="sm" color="muted" lineClamp={2} className="text-xs sm:text-sm">
                                          {destination.description}
                                        </Text>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))
                              )}
                        </div>
                      )}
                </div>

                {/* Right: Map View (70%) - Sticky until all destinations scrolled */}
                <div className="w-full lg:w-[70%] relative order-1 lg:order-2">
                  <div
                    className="sticky top-14 sm:top-20"
                    style={{
                      height: 'calc(100vh - 6rem)',
                      minHeight: '400px',
                    }}
                  >
                    <TourMap
                      destinations={dayDestinations}
                      activeDestinationId={activeDestinationId}
                      mapboxAccessToken={mapboxToken}
                      onMarkerClick={handleMarkerClick}
                    />
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

    </div>
  );
}
