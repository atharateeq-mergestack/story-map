'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Env } from '@/libs/Env';
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

export function TourView({ tour, destinationsByDate, dates }: TourViewProps) {
  const [activeDate, setActiveDate] = useState<string | null>(dates[0] || null);
  const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);
  const destinationRefs = useRef<Record<string, HTMLDivElement>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mapboxToken = Env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Flatten all destinations for the map
  const allDestinations = dates.flatMap(date => destinationsByDate[date] || []);

  // Scroll to destination when clicked
  const handleDestinationClick = (destinationId: string) => {
    const element = destinationRefs.current[destinationId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle scroll to detect which destination is in view
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const handleScroll = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const viewportCenter = containerRect.top + containerRect.height / 2;

      // Find which destination card is closest to the center
      let closestDestination: { id: string; distance: number } | null = null;

      for (const [destinationId, element] of Object.entries(destinationRefs.current)) {
        const rect = element.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const distance = Math.abs(viewportCenter - elementCenter);

        if (!closestDestination || distance < closestDestination.distance) {
          closestDestination = { id: destinationId, distance };
        }
      }

      if (closestDestination) {
        setActiveDestinationId(closestDestination.id);
        const destination = allDestinations.find(d => d.id === closestDestination!.id);
        if (destination) {
          setActiveDate(destination.date);
        }
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [allDestinations]);

  // Scroll to date section when date is clicked
  const handleDateClick = (date: string) => {
    const firstDestination = destinationsByDate[date]?.[0];
    if (firstDestination) {
      const element = destinationRefs.current[firstDestination.id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveDate(date);
      }
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
          <p className="text-xs text-muted-foreground">
            Use a public access token (pk.*) from
            {' '}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Validate token format
  if (!mapboxToken.startsWith('pk.')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">
            Invalid Mapbox token format
          </p>
          <p className="text-sm text-muted-foreground">
            Use a public access token (pk.*) with Mapbox GL, not a secret access token (sk.*).
          </p>
          <p className="text-xs text-muted-foreground">
            See
            {' '}
            <a
              href="https://docs.mapbox.com/api/overview/#access-tokens-and-token-scopes"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Mapbox documentation
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-bold">{tour.name}</h1>
            {tour.description && (
              <p className="text-sm text-muted-foreground">{tour.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {tour.startLocation && (
              <span>
                From:
                {' '}
                {tour.startLocation}
              </span>
            )}
            {tour.endLocation && (
              <span>
                To:
                {' '}
                {tour.endLocation}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Day Navigation */}
      {dates.length > 0 && (
        <nav className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="container flex h-14 items-center gap-2 overflow-x-auto px-4">
            {dates.map(date => (
              <Button
                key={date}
                variant={activeDate === date ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateClick(date)}
                className="whitespace-nowrap"
              >
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </Button>
            ))}
          </div>
        </nav>
      )}

      {/* Main Content - Split View */}
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left Side - Destinations (20%) */}
        <div ref={scrollContainerRef} className="w-1/5 overflow-y-auto border-r bg-muted/30">
          <div className="p-4 space-y-4">
            {dates.map((date) => {
              const dayDestinations = destinationsByDate[date] || [];
              return (
                <div key={date} className="space-y-3">
                  <h3 className="text-lg font-semibold sticky top-0 bg-background py-2 z-10">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  {dayDestinations.map(destination => (
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
                      onClick={() => handleDestinationClick(destination.id)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">{destination.name}</h4>
                        {destination.timeSlot && (
                          <p className="text-sm text-muted-foreground mb-2">
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
                          </p>
                        )}
                        {destination.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {destination.description}
                          </p>
                        )}
                        {destination.coordinate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            📍
                            {' '}
                            {destination.coordinate.lat.toFixed(6)}
                            ,
                            {' '}
                            {destination.coordinate.lng.toFixed(6)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Map (80%) */}
        <div className="w-4/5 relative">
          <TourMap
            destinations={allDestinations}
            activeDestinationId={activeDestinationId}
            mapboxAccessToken={mapboxToken}
          />
        </div>
      </div>
    </div>
  );
}
