'use client';

import type { RouteData } from '../DirectionsControl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/common/Text';
import { cn, formatDate } from '@/lib/utils';
import destinationController from '@/store/destinationController';
import searchController from '@/store/searchController';
import {
  addFallbackRoute,
  addRoutesToMap,
  clearRouteLayers,
  fitMapToCoordinates,
  initializeMap,
} from '@/utils/map-utils';
import { DestinationDetailPanelMobile } from './DestinationDetailPanelMobile';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

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
  // Adjust this value to change the top margin of the search control
  const GEOCODER_TOP_MARGIN = '60px';

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>('');
  const [appleMapsUrl, setAppleMapsUrl] = useState<string>('');

  // Get selected destination and searched location from stores
  const selectedDestinationId = destinationController.useScopeState('selectedDestinationId')[0];
  const searchedLocation = searchController.useScopeState('searchedLocation')[0];

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }, []);

  // Get user's current location using Geolocation API
  const getCurrentLocation = useCallback((): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser.');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Return [lng, lat] format for Mapbox
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.warn('Error getting current location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  }, []);

  const fetchRoute = useCallback(async (
    from: [number, number],
    to: [number, number],
  ): Promise<RouteData[]> => {
    try {
      // Request alternatives to get multiple route options
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&steps=true&alternatives=true&access_token=${mapboxAccessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // Return all available routes (up to 3)
        return data.routes.slice(0, 3).map((route: any) => ({
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry as RouteData['geometry'],
          legs: route.legs,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching route:', error);
      return [];
    }
  }, [mapboxAccessToken]);

  // Helper function to clear all routes
  const clearAllRoutes = useCallback(() => {
    if (!map.current) {
      return;
    }

    clearRouteLayers(map.current);
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }
    setRouteData(null);
    setGoogleMapsUrl('');
    setAppleMapsUrl('');
  }, []);

  // Helper function to calculate and display route between two points
  const calculateAndDisplayRoute = useCallback(async (
    from: [number, number],
    to: [number, number],
  ) => {
    if (!map.current) {
      return;
    }

    // Clear previous routes
    clearRouteLayers(map.current);

    // Fetch routes from Mapbox Directions API (returns array of routes)
    const fetchedRoutes = await fetchRoute(from, to);

    if (fetchedRoutes.length > 0) {
      // Store route data (first route)
      if (fetchedRoutes[0]) {
        setRouteData(fetchedRoutes[0]);
      }

      // Generate URLs for buttons
      const googleUrl = `https://www.google.com/maps/dir/?api=1&origin=${from[1]},${from[0]}&destination=${to[1]},${to[0]}`;
      const appleUrl = `https://maps.apple.com/?saddr=${from[1]},${from[0]}&daddr=${to[1]},${to[0]}`;
      setGoogleMapsUrl(googleUrl);
      setAppleMapsUrl(appleUrl);

      // Add all routes to map (first one selected by default)
      addRoutesToMap(map.current, fetchedRoutes, 0, from);
    } else {
      // Fallback: show straight line if route fetch fails
      addFallbackRoute(map.current, from, to);
      // Clear route data if fetch fails
      setRouteData(null);
      setGoogleMapsUrl('');
      setAppleMapsUrl('');
    }
  }, [fetchRoute]);

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

      // Fit map to coordinates with mobile-specific padding (extra top and bottom)
      // Top padding accounts for sticky date navigation bar (~72px) plus safe area
      if (map.current && coordinates.length > 0) {
        fitMapToCoordinates(map.current, coordinates, {
          top: 180, // Extra top padding for date navigation bar
          right: 50,
          bottom: 200, // Extra bottom padding for destinations list
          left: 50,
        });
      }

      // Add search if MapboxGeocoder exists
      if (MapboxGeocoder) {
        const geocoder = new MapboxGeocoder({
          accessToken: mapboxAccessToken,
          mapboxgl: mapboxgl as any,
          marker: false,
          placeholder: 'Search for a location',
        });
        map.current?.addControl(geocoder as any);

        // Apply custom top margin to geocoder control
        // The margin value is defined at the top of the component (GEOCODER_TOP_MARGIN)
        const marginTimeout = setTimeout(() => {
          const geocoderElement = map.current?.getContainer()?.querySelector('.mapboxgl-ctrl-geocoder') as HTMLElement;
          if (geocoderElement) {
            geocoderElement.style.marginTop = GEOCODER_TOP_MARGIN;
          }
        }, 0);

        // Store timeout on map for cleanup
        if (map.current) {
          (map.current as any)._geocoderMarginTimeout = marginTimeout;
        }

        geocoder.on('result', (e: any) => {
          const { center, place_name } = e.result;
          if (!map.current) {
            return;
          }

          // Save searched location to searchController
          // The route calculation will be handled by a separate useEffect
          searchController.setSearchedLocation(center, place_name || 'Searched Location');

          // Fly to searched location
          map.current.flyTo({ center, zoom: 14 });
        });
      }
    });

    return () => {
      // Clean up geocoder margin timeout if it exists
      if (map.current && (map.current as any)._geocoderMarginTimeout) {
        clearTimeout((map.current as any)._geocoderMarginTimeout);
      }
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxAccessToken]);

  // Clear routes when selectedDestinationId changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    // Clear all routes when selectedDestinationId changes
    clearAllRoutes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDestinationId, isMapLoaded]);

  /**
   * useEffect: Display search marker when searched location is set
   */
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    // Remove previous search marker if exists
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    // If no searched location, just remove marker and return
    if (!searchedLocation) {
      return;
    }

    // Create red marker for searched location
    const searchMarkerEl = document.createElement('div');
    searchMarkerEl.style.cssText = `
      width: 30px;
      height: 30px;
      background-color: #FF4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
    `;
    const searchMarker = new mapboxgl.Marker({
      element: searchMarkerEl,
      anchor: 'center',
    })
      .setLngLat(searchedLocation.center)
      .setPopup(
        new mapboxgl.Popup({
          offset: 15,
          closeButton: true,
          closeOnClick: false,
        }).setHTML(
          `<div style="padding: 8px;">
            <strong style="font-size: 14px;">${searchedLocation.placeName}</strong>
          </div>`,
        ),
      )
      .addTo(map.current as any);
    searchMarkerRef.current = searchMarker as any;

    return () => {
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
    };
  }, [searchedLocation, isMapLoaded]);

  /**
   * useEffect: Calculate and display routes based on searched location
   * It calculates routes from selected destination (or current location) to searched location
   */
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    // If no searched location, clear routes
    if (!searchedLocation) {
      clearAllRoutes();
      return;
    }

    // Determine route endpoints
    // Searched location is always the DESTINATION
    // Starting point is either selected destination or current location
    let from: [number, number] | null = null;
    let to: [number, number] | null = null;

    if (selectedDestinationId) {
      // Route from selected destination to searched location
      const destination = destinations.find(d => d.id === selectedDestinationId);
      if (destination?.coordinate) {
        from = [destination.coordinate.lng, destination.coordinate.lat];
        to = searchedLocation.center;
        calculateAndDisplayRoute(from, to);
      }
    } else {
      // No selected destination - use current location as starting point
      getCurrentLocation().then((currentLocation) => {
        if (currentLocation && map.current) {
          from = currentLocation;
          to = searchedLocation.center;
          calculateAndDisplayRoute(from, to);
        } else {
          // Could not get current location - clear route data
          clearAllRoutes();
        }
      });
      return;
    }

    // Calculate and display route if we have both endpoints
    if (from && to) {
      calculateAndDisplayRoute(from, to);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedLocation, selectedDestinationId, getCurrentLocation, isMapLoaded]);

  // Clear searched location when geocoder input is cleared
  useEffect(() => {
    if (!searchedLocation) {
      return;
    }

    const geocoderContainer = document.querySelector('.mapboxgl-ctrl-geocoder');
    const input = geocoderContainer?.querySelector('.mapboxgl-ctrl-geocoder--input') as HTMLInputElement;

    const handleInput = () => {
      if (input.value.trim() === '') {
        searchController.clearSearchedLocation();
      }
    };

    input.addEventListener('input', handleInput);

    return () => {
      input.removeEventListener('input', handleInput);
    };
  }, [searchedLocation]);

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
            padding: {
              top: 180, // Extra top padding for date navigation bar
              right: 50,
              bottom: 200, // Extra bottom padding for destinations list
              left: 50,
            },
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

      {/* Bottom Section - Show either destinations list OR detailed card */}
      <div className="sticky bottom-0 z-50 bg-background border-t shadow-lg">
        {selectedDestinationId
          ? (
            /* Mobile Detail Card - Show when destination is selected */
              <div className="p-4">
                <DestinationDetailPanelMobile
                  destinations={destinations}
                  selectedDestinationId={selectedDestinationId}
                  routeData={routeData}
                  googleMapsUrl={googleMapsUrl}
                  appleMapsUrl={appleMapsUrl}
                  formatDistance={formatDistance}
                  formatDuration={formatDuration}
                />
              </div>
            )
          : (
            /* Bottom Destinations List - Show when no destination is selected */
              <div className="py-3">
                {/* Day Header */}
                {currentDate && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0 ml-3">
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
                        className="overflow-x-auto pb-2 mx-4 px-4"
                      >
                        <div className="flex gap-3" style={{ width: 'max-content' }}>
                          {destinations.map((destination) => {
                            return (
                              <div
                                key={destination.id}
                                className={cn(
                                  'shrink-0 transition-all w-[240px]',
                                )}
                              >
                                {/* Compact card view */}
                                <Card
                                  className={cn(
                                    'cursor-pointer transition-all h-full',
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
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
              </div>
            )}
      </div>
    </div>
  );
}
