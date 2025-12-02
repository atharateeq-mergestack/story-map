'use client';

import type { RouteData } from './DirectionsControl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DirectionsControl } from './DirectionsControl';
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
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const directionsControlRef = useRef<DirectionsControl | null>(null);
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationInProgressRef = useRef<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Refs to track previous values and prevent unnecessary updates
  const prevActiveDestinationIdRef = useRef<string | null>(null);
  const prevDestinationsLengthRef = useRef<number>(0);
  const prevDestinationsWithCoordsRef = useRef<string>('');
  const destinationsRef = useRef<Destination[]>([]);

  // Route data state (kept for potential future use, but display is handled by Mapbox control)
  const [, setRouteData] = useState<RouteData | null>(null);
  const [, setRouteDirections] = useState<string[]>([]);
  const [, setRouteOrigin] = useState<[number, number] | null>(null);
  const [, setRouteDestination] = useState<[number, number] | null>(null);

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
    const initialZoom = coordinates.length > 0 ? 11 : 2;

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

      // Initialize and add directions control
      const directionsControl = new DirectionsControl(
        formatDistance,
        formatDuration,
      );
      directionsControlRef.current = directionsControl;
      map.current?.addControl(directionsControl, 'top-right');

      // Helper function to calculate and display route between two points
      const calculateAndDisplayRoute = async (
        from: [number, number],
        to: [number, number],
      ) => {
        if (!map.current) {
          return;
        }

        // Remove previous route layers (all routes)
        for (let i = 0; i < 3; i++) {
          if (map.current.getLayer(`route-${i}`)) {
            map.current.removeLayer(`route-${i}`);
          }
          if (map.current.getSource(`route-${i}`)) {
            map.current.removeSource(`route-${i}`);
          }
        }
        // Also remove old single route if it exists
        if (map.current.getSource('route')) {
          map.current.removeLayer('route');
          map.current.removeSource('route');
        }
        if (routeMarkerRef.current) {
          routeMarkerRef.current.remove();
          routeMarkerRef.current = null;
        }

        // Fetch routes from Mapbox Directions API (returns array of routes)
        const fetchedRoutes = await fetchRoute(from, to);

        if (fetchedRoutes.length > 0) {
          // Build turn-by-turn directions for all routes
          const allDirections: string[][] = [];
          fetchedRoutes.forEach((route) => {
            const directions: string[] = [];
            route.legs.forEach((leg) => {
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
            allDirections.push(directions);
          });

          // Store route data in state (first route)
          if (fetchedRoutes[0]) {
            setRouteData(fetchedRoutes[0]);
          }
          if (allDirections[0]) {
            setRouteDirections(allDirections[0]);
          }
          setRouteOrigin(from);
          setRouteDestination(to);

          // Function to add all routes to map with proper styling
          const addAllRoutesToMap = (routes: RouteData[], selectedIndex: number) => {
            if (!map.current) {
              return;
            }
            // Remove existing route layers
            for (let i = 0; i < 3; i++) {
              if (map.current.getLayer(`route-${i}`)) {
                map.current.removeLayer(`route-${i}`);
              }
              if (map.current.getSource(`route-${i}`)) {
                map.current.removeSource(`route-${i}`);
              }
            }
            // Add all routes as separate layers
            routes.forEach((route, index) => {
              const isSelected = index === selectedIndex;
              map.current!.addSource(`route-${index}`, {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {
                    routeIndex: index,
                    isSelected,
                  },
                  geometry: route.geometry,
                },
              });
              map.current!.addLayer({
                id: `route-${index}`,
                type: 'line',
                source: `route-${index}`,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                  'line-color': isSelected ? '#0074D9' : '#7FC8F8', // Light blue for non-selected routes
                  'line-width': isSelected ? 4 : 3,
                  'line-opacity': isSelected ? 1 : 0.7, // Less grayed out
                },
              });
            });
            // Fit map to show all routes
            const allBounds = routes.reduce((bounds, route) => {
              route.geometry.coordinates.forEach((coord) => {
                bounds.extend(coord as [number, number]);
              });
              return bounds;
            }, new mapboxgl.LngLatBounds(from, from));
            map.current.fitBounds(allBounds as unknown as mapboxgl.LngLatBounds, {
              padding: 50,
              maxZoom: 15,
              duration: 500,
            });
          };

          // Function to update selected route styling
          const updateMapRoute = (routeIndex: number, _routeData: RouteData) => {
            if (!map.current) {
              return;
            }
            // Update all route layer styles
            fetchedRoutes.forEach((_route, index) => {
              const isSelected = index === routeIndex;
              if (map.current!.getLayer(`route-${index}`)) {
                map.current!.setPaintProperty(`route-${index}`, 'line-color', isSelected ? '#0074D9' : '#7FC8F8'); // Light blue for non-selected
                map.current!.setPaintProperty(`route-${index}`, 'line-width', isSelected ? 4 : 3);
                map.current!.setPaintProperty(`route-${index}`, 'line-opacity', isSelected ? 1 : 0.7); // Less grayed out
              }
            });
            // Fit map to show selected route
            const selectedRoute = fetchedRoutes[routeIndex];
            if (selectedRoute) {
              const bounds = selectedRoute.geometry.coordinates.reduce(
                (bounds, coord) => bounds.extend(coord as [number, number]),
                new mapboxgl.LngLatBounds(from, from),
              );
              map.current.fitBounds(bounds as unknown as mapboxgl.LngLatBounds, {
                padding: 50,
                maxZoom: 15,
                duration: 500,
              });
            }
          };

          // Set up route change callback
          if (directionsControlRef.current) {
            directionsControlRef.current.setRouteChangeCallback(updateMapRoute);
          }

          // Add all routes to map (first one selected by default)
          addAllRoutesToMap(fetchedRoutes, 0);

          // Add click handlers to route layers for switching
          fetchedRoutes.forEach((_route, index) => {
            // Click handler to switch routes
            const clickHandler = () => {
              if (directionsControlRef.current) {
                // Reopen directions if closed
                if (!directionsControlRef.current.isDirectionsVisible()) {
                  directionsControlRef.current.reopenDirections();
                }
                // Switch to clicked route
                directionsControlRef.current.switchRoute(index);
              }
            };
            map.current!.on('click', `route-${index}`, clickHandler);

            // Change cursor on hover for all routes (to indicate they're clickable)
            const mouseEnterHandler = () => {
              map.current!.getCanvas().style.cursor = 'pointer';
            };
            const mouseLeaveHandler = () => {
              map.current!.getCanvas().style.cursor = '';
            };
            map.current!.on('mouseenter', `route-${index}`, mouseEnterHandler);
            map.current!.on('mouseleave', `route-${index}`, mouseLeaveHandler);
          });

          // Show directions in Mapbox control with all routes
          if (directionsControlRef.current) {
            // Generate URLs for buttons
            const googleUrl = `https://www.google.com/maps/dir/?api=1&origin=${from[1]},${from[0]}&destination=${to[1]},${to[0]}`;
            const appleUrl = `https://maps.apple.com/?saddr=${from[1]},${from[0]}&daddr=${to[1]},${to[0]}`;
            directionsControlRef.current.showDirections(fetchedRoutes, allDirections, googleUrl, appleUrl);
          }
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
          // Clear route data if fetch fails
          setRouteData(null);
          setRouteDirections([]);
          setRouteOrigin(null);
          setRouteDestination(null);
          if (directionsControlRef.current) {
            directionsControlRef.current.hideDirections();
          }
        }
      };

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
          const { center, place_name } = e.result;
          if (!map.current) {
            return;
          }
          // Close all destination popups when searching
          markersRef.current.forEach((marker) => {
            if (marker.getPopup()?.isOpen()) {
              marker.togglePopup();
            }
          });
          // Remove previous search marker if exists
          if (searchMarkerRef.current) {
            searchMarkerRef.current.remove();
            searchMarkerRef.current = null;
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
            .setLngLat(center)
            .setPopup(
              new mapboxgl.Popup({
                offset: 15,
                closeButton: true,
                closeOnClick: false,
              }).setHTML(
                `<div style="padding: 8px;">
                  <strong style="font-size: 14px;">${place_name || 'Searched Location'}</strong>
                </div>`,
              ),
            )
            .addTo(map.current as any);
          searchMarkerRef.current = searchMarker as any;
          map.current.flyTo({ center, zoom: 14 });

          // Calculate and display route:
          // 1. If there's an active destination, show route from searched location to destination
          // 2. If no active destination, get current location and show route from current location to searched location
          const dest = destinations.find(d => d.id === activeDestinationId);
          if (dest?.coordinate) {
            // Case 1: Route from searched location to active destination
            const from: [number, number] = [center[0], center[1]]; // [lng, lat] - searched location
            const to: [number, number] = [dest.coordinate.lng, dest.coordinate.lat]; // [lng, lat] - destination
            await calculateAndDisplayRoute(from, to);
          } else {
            // Case 2: No active destination - use current location
            const currentLocation = await getCurrentLocation();
            if (currentLocation) {
              // Route from current location to searched location
              const from: [number, number] = currentLocation; // [lng, lat] - current location
              const to: [number, number] = [center[0], center[1]]; // [lng, lat] - searched location
              await calculateAndDisplayRoute(from, to);
            } else {
              // Could not get current location - clear route data
              setRouteData(null);
              setRouteDirections([]);
              setRouteOrigin(null);
              setRouteDestination(null);
              if (directionsControlRef.current) {
                directionsControlRef.current.hideDirections();
              }
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
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxAccessToken, destinations, activeDestinationId, fetchRoute, getCurrentLocation]);

  // Update destinations ref whenever destinations change
  useEffect(() => {
    destinationsRef.current = destinations;
  }, [destinations]);

  // Clear route data when active destination changes
  useEffect(() => {
    if (!activeDestinationId) {
      setRouteData(null);
      setRouteDirections([]);
      setRouteOrigin(null);
      setRouteDestination(null);
      // Also remove all route layers from map
      if (map.current) {
        for (let i = 0; i < 3; i++) {
          if (map.current.getLayer(`route-${i}`)) {
            map.current.removeLayer(`route-${i}`);
          }
          if (map.current.getSource(`route-${i}`)) {
            map.current.removeSource(`route-${i}`);
          }
        }
        // Also remove old single route if it exists
        if (map.current.getSource('route')) {
          map.current.removeLayer('route');
          map.current.removeSource('route');
        }
      }
      if (routeMarkerRef.current) {
        routeMarkerRef.current.remove();
        routeMarkerRef.current = null;
      }
      // Hide directions control
      if (directionsControlRef.current) {
        directionsControlRef.current.hideDirections();
      }
    }
  }, [activeDestinationId]);

  // Only update markers and zoom when activeDestinationId changes or number of destinations changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    const currentDestinations = destinationsRef.current;
    const destinationsLength = currentDestinations.length;

    // Create a hash of destinations with coordinates to detect coordinate changes
    const destinationsWithCoords = currentDestinations
      .filter(dest => dest.coordinate)
      .map(dest => `${dest.id}:${dest.coordinate?.lat},${dest.coordinate?.lng}`)
      .sort()
      .join('|');

    // // Only update if activeDestinationId changed, number of destinations changed, or coordinates changed
    // if (!hasActiveDestinationIdChanged && !hasDestinationsLengthChanged && !hasDestinationsWithCoordsChanged) {
    //   return;
    // }

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

    // Create markers first (before animation) so they appear together
    const markerMap = new Map<string, mapboxgl.Marker>();

    destinationsToShow.forEach((destination) => {
      if (!destination.coordinate) {
        return;
      }

      // Use Mapbox's native Marker with proper styling
      const el = document.createElement('div');
      el.className = 'destination-marker';

      // Use Mapbox's default marker styling as base, with custom image
      // No transitions or animations - marker must stay fixed at coordinates
      el.style.width = '40px';
      el.style.height = '60px';
      el.style.backgroundImage = 'url(/marker-pin.svg)';
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.cursor = 'pointer';
      el.style.position = 'absolute';
      el.style.pointerEvents = 'auto';
      // Remove any transitions that could cause marker movement
      el.style.transition = 'none';
      el.style.transform = 'none';

      // Change size and styling on active destination
      if (activeDestinationId === destination.id) {
        el.style.width = '50px';
        el.style.height = '75px';
        el.style.zIndex = '10';
        el.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))';
      }

      // Create Mapbox native marker with anchor point at bottom center
      // Marker will stay fixed at its geographic coordinates during zoom/pan
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom', // Mapbox native anchor point - bottom of marker pin
        offset: [0, 0],
        draggable: false, // Ensure marker is not draggable
      })
        .setLngLat([destination.coordinate.lng, destination.coordinate.lat]);

      // Create Mapbox native popup positioned above the marker
      // Offset: [x, y] where y is negative to position above the marker
      const popup = new mapboxgl.Popup({
        offset: [0, -50], // Position popup above the marker (negative y offset)
        closeButton: true,
        closeOnClick: false,
        anchor: 'bottom', // Anchor popup to bottom, so it sits above marker
        className: 'mapboxgl-popup destination-popup',
        maxWidth: '300px',
      }).setHTML(
        `<div style="padding: 0; max-width: 300px;">
          ${destination.images && destination.images.length > 0
            ? `
            <div style="width: 100%; height: 200px; overflow: hidden; border-radius: 8px 8px 0 0; margin-bottom: 12px;">
              <img 
                src="${destination.images[0]}" 
                alt="${destination.name}"
                style="width: 100%; height: 100%; object-fit: cover; display: block;"
                onerror="this.style.display='none'"
              />
            </div>
          `
            : ''}
          <div style="padding: 0 12px 12px 12px;">
            <strong style="font-size: 16px; display: block; margin-bottom: 8px;">${destination.name}</strong>
            ${destination.timeSlot ? `<div style="font-size: 13px; color: #666; margin-bottom: 8px;"><small>${destination.timeSlot.start_time} - ${destination.timeSlot.end_time}</small></div>` : ''}
            ${destination.description ? `<p style="font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${destination.description}</p>` : ''}
          </div>
        </div>`,
      );

      // Attach popup to marker - this ensures it positions relative to the marker
      marker.setPopup(popup).addTo(map.current as any);

      // Style the close button after popup is added
      const styleCloseButton = () => {
        const closeButton = popup.getElement()?.querySelector('.mapboxgl-popup-close-button') as HTMLElement;
        if (closeButton) {
          closeButton.style.cssText = `
            width: 32px !important;
            height: 32px !important;
            font-size: 20px !important;
            line-height: 32px !important;
            padding: 0 !important;
            right: 8px !important;
            top: 8px !important;
            background: rgba(255, 255, 255, 0.9) !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: background 0.2s !important;
            cursor: pointer !important;
          `;
          const handleMouseEnter = () => {
            closeButton.style.background = 'rgba(255, 255, 255, 1)';
          };
          const handleMouseLeave = () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.9)';
          };
          closeButton.addEventListener('mouseenter', handleMouseEnter);
          closeButton.addEventListener('mouseleave', handleMouseLeave);
          // Store handlers for cleanup (popup will be removed with marker cleanup)
        }
      };
      popup.on('open', styleCloseButton);

      // Store marker by destination ID for easy lookup
      markerMap.set(destination.id, marker as any);

      // Use Mapbox's built-in click handling via popup
      const clickHandler = () => {
        if (onMarkerClick) {
          onMarkerClick(destination.id);
        }
        // Also toggle popup on click
        marker.togglePopup();
      };
      el.addEventListener('click', clickHandler);
      clickHandlersRef.current.push({ element: el, handler: clickHandler });

      markersRef.current.push(marker as any);
    });

    // Animate the map with markers already visible - single smooth animation
    if (activeDestinationId && destinationsToShow.length > 0) {
      const activeDest = destinationsToShow[0];
      if (activeDest?.coordinate && map.current && !animationInProgressRef.current) {
        const targetCenter: [number, number] = [activeDest.coordinate.lng, activeDest.coordinate.lat];
        const currentCenter = map.current.getCenter();
        const currentZoom = map.current.getZoom();

        // Check if we're already close to the target (within 0.001 degrees and zoom level)
        const isAlreadyAtLocation
          = Math.abs(currentCenter.lng - targetCenter[0]) < 0.001
            && Math.abs(currentCenter.lat - targetCenter[1]) < 0.001
            && Math.abs(currentZoom - 15) < 1;

        if (!isAlreadyAtLocation) {
          // Prevent multiple animations
          animationInProgressRef.current = true;

          // Cancel any existing animations
          map.current.stop();

          // Single smooth zoom to destination
          map.current.flyTo({
            center: targetCenter,
            zoom: 15,
            duration: 1500,
            essential: true, // This ensures the animation completes
          });

          // Open popup after animation completes
          const activeMarker = markerMap.get(activeDestinationId);
          if (activeMarker) {
            // Clear any existing timeout
            if (popupTimeoutRef.current) {
              clearTimeout(popupTimeoutRef.current);
            }
            // Wait for animation to complete before opening popup
            popupTimeoutRef.current = setTimeout(() => {
              activeMarker.togglePopup();
              popupTimeoutRef.current = null;
              animationInProgressRef.current = false;
            }, 1500);
          } else {
            animationInProgressRef.current = false;
          }
        } else {
          // Already at location, just open popup
          const activeMarker = markerMap.get(activeDestinationId);
          if (activeMarker) {
            activeMarker.togglePopup();
          }
        }
      }
    } else if (!activeDestinationId && destinationsLength > 0 && !animationInProgressRef.current) {
      // If no destination is selected, zoom out to show all destinations
      // Only do this if we're not already animating
      const coordinates = currentDestinations
        .filter(dest => dest.coordinate)
        .map(dest => [dest.coordinate!.lng, dest.coordinate!.lat] as [number, number]);

      if (coordinates.length > 0 && map.current) {
        // Cancel any existing animations
        map.current.stop();

        animationInProgressRef.current = true;

        if (coordinates.length === 1) {
          map.current.flyTo({
            center: coordinates[0],
            zoom: 12,
            duration: 3000,
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

        // Reset animation flag after animation completes
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        // animationTimeoutRef.current = setTimeout(() => {
        //   animationInProgressRef.current = false;
        //   animationTimeoutRef.current = null;
        // }, 1500);
      }
    }

    return () => {
      // Clear all timeouts
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
      // Stop any ongoing animations
      if (map.current) {
        map.current.stop();
      }
      // Reset animation flag
      animationInProgressRef.current = false;
      clickHandlersRef.current.forEach(({ element, handler }) => {
        element.removeEventListener('click', handler);
      });
      clickHandlersRef.current = [];
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [activeDestinationId, isMapLoaded, onMarkerClick]);

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
