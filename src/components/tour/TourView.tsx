'use client';

import { AnimatePresence, motion } from 'framer-motion';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heading } from '@/components/ui/common/Heading';
import { Text } from '@/components/ui/common/Text';
import { formatDate } from '@/lib/utils';
import { Env } from '@/libs/Env';
import { DestinationCard } from './DestinationCard';
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
  return end.diff(start, 'days') + 1;
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

  const allDestinations = dates.flatMap(date => destinationsByDate[date] || []);
  const totalDays = calculateTotalDays(tour.startDate, tour.endDate);

  useEffect(() => {
    const handleScroll = () => {
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

      if (newActiveDate !== activeDate && selectedDestination?.date !== newActiveDate) {
        setSelectedDestination(() => null);
        setActiveDestinationId(() => null);
      }

      setActiveDate((prevDate) => {
        return prevDate !== newActiveDate ? newActiveDate : prevDate;
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [dates, activeDate, selectedDestination?.date]);

  const handleDestinationClick = (destination: Destination) => {
    setSelectedDestination(destination);
    setActiveDestinationId(destination.id);
    setActiveDate(destination.date);
  };

  const handleMarkerClick = (destinationId: string) => {
    const destination = allDestinations.find(d => d.id === destinationId);
    if (destination) {
      setSelectedDestination(destination);
      setActiveDestinationId(destinationId);
      setActiveDate(destination.date);
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

  const handleBackToOverview = () => {
    setSelectedDestination(null);
    setActiveDestinationId(null);
  };

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
      setSelectedDestination(null);
      setActiveDestinationId(null);
    }
  };

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh] flex flex-col justify-end bg-muted/30"
      >
        <div className="relative z-10 container mx-auto px-4 sm:px-6 pb-6 sm:pb-8 pt-16 sm:pt-20 md:pt-24">
          <div className="max-w-3xl space-y-4 sm:space-y-6">
            <Heading
              level={1}
              size="5xl"
              weight="bold"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground"
            >
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
                  <Text weight="medium" className="text-xs sm:text-sm">
                    Going from
                  </Text>
                  <Text color="muted" className="text-xs sm:text-sm">
                    {tour.startLocation}
                  </Text>
                  <Text color="muted" className="text-xs sm:text-sm">
                    →
                  </Text>
                  <Text weight="medium" className="text-xs sm:text-sm">
                    Going to
                  </Text>
                  <Text color="muted" className="text-xs sm:text-sm">
                    {tour.endLocation}
                  </Text>
                </div>
              )}

              {tour.startDate && tour.endDate && (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div>
                    <Text size="sm" color="muted" className="text-xs">
                      Start Date
                    </Text>
                    <Text weight="medium" className="text-xs sm:text-sm">
                      {formatDate(tour.startDate)}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" color="muted" className="text-xs">
                      End Date
                    </Text>
                    <Text weight="medium" className="text-xs sm:text-sm">
                      {formatDate(tour.endDate)}
                    </Text>
                  </div>
                  {totalDays > 0 && (
                    <div>
                      <Text size="sm" color="muted" className="text-xs">
                        Total Days
                      </Text>
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

      </section>
      {dates.length > 0 && (
        <nav
          ref={navRef}
          className="sticky top-[-8px] z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm"
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

      <div className="">
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
              {/* Sticky Day Heading */}
              <Heading
                level={2}
                size="2xl"
                weight="bold"
                className="mb-4 sm:mb-6 text-xl sm:text-2xl sticky top-0 bg-background z-10 py-2 border-b border-foreground/10"
              >
                Day
                {' '}
                {dayNumber}
                {' '}
                –
                {' '}
                {formatDate(date)}
              </Heading>

              <div className="flex flex-col lg:flex-row">
                {/* Left Panel: Destinations / Detail Panel */}
                <div className="w-full lg:w-[30%] order-2 lg:order-1 space-y-3 sm:space-y-4">
                  {dayDestinations.length === 0
                    ? (
                        <Card>
                          <CardContent className="p-4 sm:p-6 text-center">
                            <Text color="muted" className="text-sm sm:text-base">
                              No destinations for this day
                            </Text>
                          </CardContent>
                        </Card>
                      )
                    : (
                        dayDestinations.map((destination) => {
                          const isSelected = selectedDestination?.id === destination.id;

                          const refCallback = (el: HTMLDivElement | null) => {
                            if (el) {
                              destinationRefs.current[destination.id] = el;
                              if (isSelected) {
                                setTimeout(() => {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 50);
                              }
                            }
                          };

                          return (
                            <div key={destination.id} ref={refCallback}>
                              <AnimatePresence mode="wait">
                                {selectedDestination?.id === destination.id
                                  ? (
                                // Detail Panel for the clicked destination
                                      <motion.div
                                        key={`detail-${destination.id}`}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                      >
                                        <DestinationDetailPanel
                                          destination={selectedDestination}
                                          onClose={handleBackToOverview}
                                        />
                                      </motion.div>
                                    )
                                  : (
                                // Regular Destination Card
                                      <motion.div
                                        key={`card-${destination.id}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                      >
                                        <DestinationCard
                                          destination={destination}
                                          isActive={activeDestinationId === destination.id}
                                          onClick={() => handleDestinationClick(destination)}
                                        />
                                      </motion.div>
                                    )}
                              </AnimatePresence>

                            </div>
                          );
                        })
                      )}
                </div>

                {/* Right Panel: Map */}
                <div className="w-full lg:w-[70%] relative order-1 lg:order-2">
                  <div
                    className="sticky top-20 sm:top-24"
                    style={{
                      height: 'calc(100vh - 8rem)',
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
