'use client';

import mapboxgl from 'mapbox-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/common/Text';
import { cn, formatDate } from '@/lib/utils';
import destinationController from '@/store/destinationController';
import { fitMapToCoordinates, initializeMap } from '@/utils/map-utils';
import { DestinationDetailPanel } from './DestinationDetailPanel';
import 'mapbox-gl/dist/mapbox-gl.css';

type Destination = {
  id: string;
  name: string;
  date?: string;
  coordinate: { lat: number; lng: number } | null;
  timeSlot: {
    start_time: string;
    end_time: string;
    slot_label?: string;
  } | null;
  description: string | null;
  images?: string[];
};

type TourMapMobileProps = {
  destinations: Destination[];
  mapboxAccessToken: string;
  currentDate?: string;
  selectedDateIndex?: number;
  onMarkerClick?: (destinationId: string) => void;
};

export function TourMapMobile({
  destinations,
  mapboxAccessToken,
  currentDate,
  selectedDateIndex = 0,
  onMarkerClick,
}: TourMapMobileProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const destinationRefs = useRef<Record<string, HTMLDivElement>>({});
  const isAutoScrollingRef = useRef<boolean>(false);

  // Get selected destination from store
  const selectedDestinationId = destinationController.useScopeState('selectedDestinationId')[0];

  // Calculate selected destination and detail mode
  const selectedDestination = useMemo(
    () => (selectedDestinationId
      ? destinations.find(d => d.id === selectedDestinationId) || null
      : null),
    [destinations, selectedDestinationId],
  );

  const isDetailMode = selectedDestinationId !== null && selectedDestination !== null;

  /**
   * useEffect 1: Initialize map with disabled scroll-to-zoom
   * Only allows 2-finger touch zoom
   */
  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    mapboxgl.accessToken = mapboxAccessToken;

    // Helper function to check if two coordinates are the same
    const areCoordinatesEqual = (
      coord1: { lat: number; lng: number },
      coord2: { lat: number; lng: number },
    ): boolean => {
      const tolerance = 0.0001;
      return (
        Math.abs(coord1.lat - coord2.lat) < tolerance
        && Math.abs(coord1.lng - coord2.lng) < tolerance
      );
    };

    // Get unique coordinates only
    const usedCoordinates: Array<{ lat: number; lng: number }> = [];
    const coordinates = destinations
      .filter((dest) => {
        if (!dest.coordinate) {
          return false;
        }
        const isDuplicate = usedCoordinates.some(usedCoord =>
          areCoordinatesEqual(usedCoord, dest.coordinate!),
        );
        if (!isDuplicate) {
          usedCoordinates.push(dest.coordinate);
          return true;
        }
        return false;
      })
      .map(dest => [dest.coordinate!.lng, dest.coordinate!.lat] as [number, number]);

    // Initialize map
    map.current = initializeMap(mapContainer.current, mapboxAccessToken, coordinates);

    // Disable scroll-to-zoom: only allow 2-finger touch zoom
    map.current.scrollZoom.disable();
    // Enable double-click zoom (optional, can be disabled if needed)
    // map.current.doubleClickZoom.disable();

    map.current?.on('load', () => {
      setIsMapLoaded(true);

      // Fit map to coordinates
      if (map.current && coordinates.length > 0) {
        fitMapToCoordinates(map.current, coordinates);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxAccessToken]);

  /**
   * useEffect 2: Set up destination markers (no popups)
   */
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    // Remove all existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const cleanupHandlers: Array<() => void> = [];

    // Helper function to check if two coordinates are the same
    const areCoordinatesEqual = (
      coord1: { lat: number; lng: number },
      coord2: { lat: number; lng: number },
    ): boolean => {
      const tolerance = 0.0001;
      return (
        Math.abs(coord1.lat - coord2.lat) < tolerance
        && Math.abs(coord1.lng - coord2.lng) < tolerance
      );
    };

    // Track which coordinates have been used
    const usedCoordinates: Array<{ lat: number; lng: number }> = [];

    // Filter destinations to only include the first one at each unique coordinate
    const uniqueDestinations = destinations.filter((destination) => {
      if (!destination.coordinate) {
        return false;
      }

      const isDuplicate = usedCoordinates.some(usedCoord =>
        areCoordinatesEqual(usedCoord, destination.coordinate!),
      );

      if (!isDuplicate) {
        usedCoordinates.push(destination.coordinate);
        return true;
      }

      return false;
    });

    // Create markers only for unique destinations
    uniqueDestinations.forEach((destination) => {
      if (!destination.coordinate) {
        return;
      }

      // Create marker element
      const el = document.createElement('div');
      el.className = 'destination-marker';
      el.setAttribute('data-destination-id', destination.id);
      el.style.width = '40px';
      el.style.height = '60px';
      el.style.backgroundImage = 'url(/marker-pin.svg)';
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.cursor = 'pointer';
      el.style.position = 'absolute';
      el.style.pointerEvents = 'auto';
      el.style.transition = 'none';
      el.style.transform = 'none';

      // Create Mapbox native marker (no popup)
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
        offset: [0, 3],
        draggable: false,
      })
        .setLngLat([destination.coordinate.lng, destination.coordinate.lat])
        .addTo(map.current as any);

      // Add click handler that calls onMarkerClick callback
      const clickHandler = () => {
        if (onMarkerClick) {
          onMarkerClick(destination.id);
        }
      };
      el.onclick = clickHandler;
      cleanupHandlers.push(() => {
        el.onclick = null;
      });
      markersRef.current.push(marker as any);
    });

    return () => {
      cleanupHandlers.forEach(removeHandler => removeHandler());
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [destinations, isMapLoaded, onMarkerClick]);

  /**
   * useEffect 3: Update map view when selected destination changes
   */
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    // If no destination is selected, show all destinations
    if (!selectedDestinationId) {
      // Reset all marker styling to default
      markersRef.current.forEach((m) => {
        const el = m.getElement();
        if (el) {
          el.style.width = '40px';
          el.style.height = '60px';
          el.style.filter = 'none';
        }
      });

      // Get unique coordinates
      const usedCoordinates: Array<{ lat: number; lng: number }> = [];
      const areCoordinatesEqual = (
        coord1: { lat: number; lng: number },
        coord2: { lat: number; lng: number },
      ): boolean => {
        const tolerance = 0.0001;
        return (
          Math.abs(coord1.lat - coord2.lat) < tolerance
          && Math.abs(coord1.lng - coord2.lng) < tolerance
        );
      };
      const coordinates = destinations
        .filter((dest) => {
          if (!dest.coordinate) {
            return false;
          }
          const isDuplicate = usedCoordinates.some(usedCoord =>
            areCoordinatesEqual(usedCoord, dest.coordinate!),
          );
          if (!isDuplicate) {
            usedCoordinates.push(dest.coordinate);
            return true;
          }
          return false;
        })
        .map(dest => [dest.coordinate!.lng, dest.coordinate!.lat] as [number, number]);

      if (coordinates.length > 0) {
        map.current.stop();
        if (coordinates.length === 1) {
          map.current.flyTo({
            center: coordinates[0],
            zoom: 12,
            duration: 1500,
            essential: true,
          });
        } else {
          const bounds = coordinates.reduce(
            (bounds, coord) => bounds.extend(coord),
            new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
          );
          map.current.fitBounds(bounds as unknown as mapboxgl.LngLatBounds, {
            padding: 50,
            maxZoom: 15,
            duration: 1500,
          });
        }
      }

      return;
    }

    // Find the destination
    const destination = destinations.find(d => d.id === selectedDestinationId);

    if (!destination?.coordinate) {
      return;
    }

    // Find the marker for this destination
    const marker = markersRef.current.find((m) => {
      const lngLat = m.getLngLat();
      return (
        Math.abs(lngLat.lng - destination.coordinate!.lng) < 0.0001
        && Math.abs(lngLat.lat - destination.coordinate!.lat) < 0.0001
      );
    });

    if (!marker) {
      return;
    }

    // Update marker styling for selected destination
    markersRef.current.forEach((m) => {
      const el = m.getElement();
      if (el) {
        const isSelected = m === marker;
        if (isSelected) {
          el.style.width = '50px';
          el.style.height = '75px';
          el.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))';
        } else {
          el.style.width = '40px';
          el.style.height = '60px';
          el.style.filter = 'none';
        }
      }
    });

    // Fly to the destination
    const targetCenter: [number, number] = [destination.coordinate.lng, destination.coordinate.lat];
    map.current.stop();
    map.current.flyTo({
      center: targetCenter,
      zoom: 15,
      duration: 1500,
      essential: true,
    });
  }, [selectedDestinationId, destinations, isMapLoaded]);

  // Handle destination card click
  const handleDestinationClick = (destination: Destination) => {
    destinationController.setSelectedDestination(destination.id);
    if (destination.date) {
      destinationController.setActiveDate(destination.date);
    }
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    destinationController.clearSelectedDestination();
  };

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

      destinations.forEach((destination: Destination) => {
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
  }, [isDetailMode, destinations, selectedDestinationId]);

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

  // Check if we have any destinations with coordinates
  const hasCoordinates = destinations.some(dest => dest.coordinate !== null);

  return (
    <div className="h-full w-full relative flex flex-col" style={{ minHeight: '400px' }}>
      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="h-full w-full" />
        {!hasCoordinates && destinations.length > 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-background/95 backdrop-blur border rounded-lg px-4 py-2 shadow-lg">
            <p className="text-sm text-muted-foreground">
              No location data available for destinations
            </p>
          </div>
        )}
      </div>

      {/* Bottom Destinations List - Horizontal Scrollable */}
      <div className="sticky bottom-0 z-50 bg-background border-t shadow-lg">
        <div className="px-4 py-3">
          {/* Day Header */}
          {currentDate && (
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
          )}

          {/* Horizontal Scrollable Destinations */}
          {destinations.length === 0
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
                  className="overflow-x-auto pb-2 mx-4 px-4"
                >
                  <div className="flex gap-3" style={{ width: 'max-content' }}>
                    {destinations.map((destination, index) => {
                      const isActive = selectedDestinationId === destination.id;
                      const isSelected = selectedDestination?.id === destination.id;
                      const selectedIndex = destinations.findIndex(d => d.id === selectedDestinationId);
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
                                  <CardContent className="p-1">
                                    <div className="flex space-y-2 gap-2 items-center">
                                      {/* Image thumbnail if available */}
                                      <div className="w-20 h-12 rounded overflow-hidden bg-gray-200 mt-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={destination.images?.[0] ?? '/placeholder.svg'}
                                          alt={destination.name ?? 'Destination Image'}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>

                                      <div>
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
                                      </div>
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
