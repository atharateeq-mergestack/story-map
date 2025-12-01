'use client';

import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

type Destination = {
  id: string;
  name: string;
  coordinate: { lat: number; lng: number } | null;
  timeSlot: {
    start_time: string;
    end_time: string;
    slot_label?: string;
  } | null;
  description: string | null;
  images?: string[];
};

type TourMapProps = {
  destinations: Destination[];
  activeDestinationId: string | null;
  mapboxAccessToken: string;
  onMarkerClick?: (destinationId: string) => void;
};

export function TourMap({
  destinations,
  activeDestinationId,
  mapboxAccessToken,
  onMarkerClick,
}: TourMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const clickHandlersRef = useRef<Array<{ element: HTMLElement; handler: () => void }>>([]);
  const routeMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Refs to track previous values and prevent unnecessary updates
  const prevActiveDestinationIdRef = useRef<string | null>(null);
  const prevDestinationsLengthRef = useRef<number>(0);
  const prevDestinationsWithCoordsRef = useRef<string>('');
  const destinationsRef = useRef<Destination[]>([]);

  type RouteData = {
    distance: number; // in meters
    duration: number; // in seconds
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
    legs: Array<{
      steps: Array<{
        maneuver: {
          type: string;
          instruction: string;
          modifier?: string;
        };
        distance: number;
        duration: number;
      }>;
    }>;
  };

  const fetchRoute = useCallback(async (
    from: [number, number],
    to: [number, number],
  ): Promise<RouteData | null> => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&steps=true&access_token=${mapboxAccessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry as RouteData['geometry'],
          legs: route.legs,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching route:', error);
      return null;
    }
  }, [mapboxAccessToken]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    mapboxgl.accessToken = mapboxAccessToken;

    const coordinates = destinations
      .filter(dest => dest.coordinate)
      .map(dest => [dest.coordinate!.lng, dest.coordinate!.lat] as [number, number]);

    // Always initialize the map, even if there are no coordinates
    // Use a default center (e.g., world center) if no coordinates available
    const defaultCenter: [number, number] = [0, 0]; // [lng, lat] - world center
    const initialCenter = coordinates.length > 0 ? coordinates[0] : defaultCenter;
    const initialZoom = coordinates.length > 0 ? 10 : 2;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
    }) as any;

    map.current?.on('load', () => {
      setIsMapLoaded(true);
      // Only fit bounds if we have multiple coordinates
      if (coordinates.length > 1 && map.current) {
        const bounds = coordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
        );
        map.current?.fitBounds(bounds as unknown as mapboxgl.LngLatBounds, { padding: 50, maxZoom: 15 });
      } else if (coordinates.length === 1 && map.current) {
        // If only one coordinate, center on it with appropriate zoom
        map.current.flyTo({
          center: coordinates[0],
          zoom: 12,
          duration: 0,
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

        geocoder.on('result', async (e: any) => {
          const { center } = e.result;
          if (!map.current) {
            return;
          }
          map.current.flyTo({ center, zoom: 14 });

          // Optional: Show route to active destination if exists
          const dest = destinations.find(d => d.id === activeDestinationId);
          if (dest?.coordinate) {
            const from: [number, number] = [center[0], center[1]]; // [lng, lat]
            const to: [number, number] = [dest.coordinate.lng, dest.coordinate.lat]; // [lng, lat]

            // Remove previous route
            if (map.current.getSource('route')) {
              map.current.removeLayer('route');
              map.current.removeSource('route');
            }
            if (routeMarkerRef.current) {
              routeMarkerRef.current.remove();
              routeMarkerRef.current = null;
            }

            // Fetch route from Mapbox Directions API
            const routeData = await fetchRoute(from, to);

            if (routeData) {
              // Add route to map
              map.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: routeData.geometry,
                },
              });
              map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#0074D9', 'line-width': 4 },
              });

              // Build turn-by-turn directions
              const directions: string[] = [];
              routeData.legs.forEach((leg) => {
                leg.steps.forEach((step, index) => {
                  const instruction = step.maneuver.instruction;
                  const modifier = step.maneuver.modifier
                    ? ` ${step.maneuver.modifier}`
                    : '';
                  const distance = formatDistance(step.distance);
                  directions.push(
                    `${index + 1}. ${instruction}${modifier} (${distance})`,
                  );
                });
              });

              // Create directions HTML
              const directionsHtml = `
                <div style="max-width: 300px; max-height: 400px; overflow-y: auto;">
                  <div style="margin-bottom: 8px; color: #666; font-size: 12px;">
                    <strong>Distance:</strong> ${formatDistance(routeData.distance)}<br/>
                    <strong>Duration:</strong> ${formatDuration(routeData.duration)}
                  </div>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;">
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${center[1]},${center[0]}&destination=${dest.coordinate.lat},${dest.coordinate.lng}" 
                       target="_blank" 
                       style="color: #0074D9; text-decoration: none; font-size: 12px;">
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              `;

              // Calculate midpoint for popup
              const routeCoordinates = routeData.geometry.coordinates;
              if (routeCoordinates.length > 0) {
                const midIndex = Math.floor(routeCoordinates.length / 2);
                const midPoint = routeCoordinates[midIndex];
                if (midPoint) {
                  // Add route info marker
                  const marker = new mapboxgl.Marker({ color: '#0074D9' })
                    .setLngLat(midPoint)
                    .setPopup(
                      new mapboxgl.Popup({ offset: 25, maxWidth: '350px' }).setHTML(directionsHtml),
                    )
                    .addTo(map.current as any);
                  routeMarkerRef.current = marker as any;

                  // Open popup automatically
                  marker.togglePopup();
                }
              }

              // Fit map to show entire route
              const bounds = routeData.geometry.coordinates.reduce(
                (bounds, coord) => bounds.extend(coord as [number, number]),
                new mapboxgl.LngLatBounds(from, from),
              );
              map.current.fitBounds(bounds as unknown as mapboxgl.LngLatBounds, {
                padding: 50,
                maxZoom: 15,
              });
            } else {
              // Fallback: show straight line if route fetch fails
              map.current.addSource('route', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [from, to],
                  },
                },
              });
              map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#0074D9', 'line-width': 4 },
              });
            }
          }
        });
      }
    });

    return () => {
      if (routeMarkerRef.current) {
        routeMarkerRef.current.remove();
        routeMarkerRef.current = null;
      }
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxAccessToken, destinations, activeDestinationId, fetchRoute]);

  // Update destinations ref whenever destinations change
  useEffect(() => {
    destinationsRef.current = destinations;
  }, [destinations]);

  // Only update markers and zoom when activeDestinationId changes or number of destinations changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    const currentDestinations = destinationsRef.current;
    const destinationsLength = currentDestinations.length;
    const hasActiveDestinationIdChanged = activeDestinationId !== prevActiveDestinationIdRef.current;
    const hasDestinationsLengthChanged = destinationsLength !== prevDestinationsLengthRef.current;

    // Create a hash of destinations with coordinates to detect coordinate changes
    const destinationsWithCoords = currentDestinations
      .filter(dest => dest.coordinate)
      .map(dest => `${dest.id}:${dest.coordinate?.lat},${dest.coordinate?.lng}`)
      .sort()
      .join('|');
    const hasDestinationsWithCoordsChanged = destinationsWithCoords !== prevDestinationsWithCoordsRef.current;

    // Only update if activeDestinationId changed, number of destinations changed, or coordinates changed
    if (!hasActiveDestinationIdChanged && !hasDestinationsLengthChanged && !hasDestinationsWithCoordsChanged) {
      return;
    }

    // Update refs
    prevActiveDestinationIdRef.current = activeDestinationId;
    prevDestinationsLengthRef.current = destinationsLength;
    prevDestinationsWithCoordsRef.current = destinationsWithCoords;

    // Remove all existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clean up previous click handlers
    clickHandlersRef.current.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler);
    });
    clickHandlersRef.current = [];

    // Filter destinations: if activeDestinationId is set, only show that destination
    const destinationsToShow = activeDestinationId
      ? currentDestinations.filter(dest => dest.id === activeDestinationId)
      : currentDestinations;

    // If a destination is selected, zoom in on it
    if (activeDestinationId && destinationsToShow.length > 0) {
      const activeDest = destinationsToShow[0];
      if (activeDest?.coordinate && map.current) {
        map.current.flyTo({
          center: [activeDest.coordinate.lng, activeDest.coordinate.lat],
          zoom: 15,
          duration: 1000,
          essential: true,
        });
      }
    } else if (!activeDestinationId && destinationsLength > 0) {
      // If no destination is selected, zoom out to show all destinations
      const coordinates = currentDestinations
        .filter(dest => dest.coordinate)
        .map(dest => [dest.coordinate!.lng, dest.coordinate!.lat] as [number, number]);

      if (coordinates.length > 0 && map.current) {
        if (coordinates.length === 1) {
          map.current.flyTo({
            center: coordinates[0],
            zoom: 12,
            duration: 1000,
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
          });
        }
      }
    }

    destinationsToShow.forEach((destination) => {
      if (!destination.coordinate) {
        return;
      }

      const el = document.createElement('div');
      el.className = 'destination-marker';

      // Set the marker style with custom pin SVG
      el.style.width = '40px';
      el.style.height = '60px';
      el.style.backgroundImage = 'url(/marker-pin.svg)';
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.3s ease';
      // el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.position = 'absolute';

      // Change size and color on active destination
      if (activeDestinationId === destination.id) {
        el.style.width = '50px';
        el.style.height = '75px';
        el.style.zIndex = '10';
        el.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))';
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([destination.coordinate.lng, destination.coordinate.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px;">
              <strong>${destination.name}</strong>
              ${destination.timeSlot ? `<br/><small>${destination.timeSlot.start_time} - ${destination.timeSlot.end_time}</small>` : ''}
              ${destination.description ? `<br/><p style="margin-top: 8px; font-size: 12px;">${destination.description}</p>` : ''}
            </div>`,
          ),
        )
        .addTo(map.current as any);

      const clickHandler = () => {
        if (onMarkerClick) {
          onMarkerClick(destination.id);
        }
      };
      el.addEventListener('click', clickHandler);
      clickHandlersRef.current.push({ element: el, handler: clickHandler });

      markersRef.current.push(marker as any);

      // Open popup automatically for active destination
      if (activeDestinationId === destination.id) {
        marker.togglePopup();
      }
    });

    return () => {
      clickHandlersRef.current.forEach(({ element, handler }) => {
        element.removeEventListener('click', handler);
      });
      clickHandlersRef.current = [];
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [activeDestinationId, destinations.length, isMapLoaded, onMarkerClick]);

  // Check if we have any destinations with coordinates
  const hasCoordinates = destinations.some(dest => dest.coordinate !== null);

  return (
    <div className="h-full w-full relative" style={{ minHeight: '600px' }}>
      <div ref={mapContainer} className="h-full w-full" />
      {!hasCoordinates && destinations.length > 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-background/95 backdrop-blur border rounded-lg px-4 py-2 shadow-lg">
          <p className="text-sm text-muted-foreground">
            No location data available for destinations
          </p>
        </div>
      )}
    </div>
  );
}
