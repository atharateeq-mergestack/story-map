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

    if (coordinates.length === 0) {
      return;
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordinates[0],
      zoom: 10,
    }) as any;

    map.current?.on('load', () => {
      setIsMapLoaded(true);
      if (coordinates.length > 1 && map.current) {
        const bounds = coordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
        );
        map.current?.fitBounds(bounds as unknown as mapboxgl.LngLatBounds, { padding: 50, maxZoom: 15 });
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

  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clean up previous click handlers
    clickHandlersRef.current.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler);
    });
    clickHandlersRef.current = [];

    destinations.forEach((destination) => {
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

      if (activeDestinationId === destination.id && map.current) {
        map.current.flyTo({
          center: [destination.coordinate.lng, destination.coordinate.lat],
          zoom: 14,
          duration: 1000,
          essential: true,
        });
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
  }, [destinations, activeDestinationId, isMapLoaded, onMarkerClick]);

  return <div ref={mapContainer} className="h-full w-full" style={{ minHeight: '600px' }} />;
}
