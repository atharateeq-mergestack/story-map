'use client';

import type { RouteData } from './DirectionsControl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl from 'mapbox-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import destinationController from '@/store/destinationController';
import searchController from '@/store/searchController';
import {
  addFallbackRoute,
  addRouteHandlers,
  addRoutesToMap,
  clearAllRoutes as clearAllRoutesUtil,
  fitMapToCoordinates,
  initializeMap,
  updateRouteStyling,
} from '@/utils/map-utils';
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
  mapboxAccessToken: string;
  onMarkerClick?: (destinationId: string) => void;
};

export function TourMap({
  destinations,
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
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Get selected destination and searched location from stores
  const selectedDestinationId = destinationController.useScopeState('selectedDestinationId')[0];
  const searchedLocation = searchController.useScopeState('searchedLocation')[0];

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

  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }, []);

  // Helper function to update marker z-index based on directions visibility
  const updateMarkerZIndex = useCallback((directionsVisible?: boolean) => {
    // If directionsVisible is not provided, check the actual state from the control
    const isVisible = directionsVisible !== undefined
      ? directionsVisible
      : directionsControlRef.current?.isDirectionsVisible() ?? false;

    markersRef.current.forEach((marker) => {
      const el = marker.getElement();
      if (el) {
        // When directions are visible, set z-index to 0 or negative to be below directions card (z-index: 50)
        // When directions are hidden, restore normal z-index
        if (isVisible) {
          el.style.zIndex = '0';
        } else {
          // Restore based on selection state
          const isSelected = selectedDestinationId
            && destinations.find(
              d => d.id === selectedDestinationId
                && d.coordinate
                && Math.abs(marker.getLngLat().lng - d.coordinate.lng) < 0.0001
                && Math.abs(marker.getLngLat().lat - d.coordinate.lat) < 0.0001,
            );
          el.style.zIndex = isSelected ? '10' : '1';
        }
      }
    });
  }, [selectedDestinationId, destinations]);

  // Helper function to clear all routes and hide directions
  const clearAllRoutes = useCallback(() => {
    if (!map.current) {
      return;
    }

    clearAllRoutesUtil(
      map.current,
      directionsControlRef,
      routeMarkerRef,
      updateMarkerZIndex,
      setRouteData,
      setRouteDirections,
      setRouteOrigin,
      setRouteDestination,
    );
  }, [updateMarkerZIndex]);

  // Helper function to calculate and display route between two points
  // This is used by the route rendering useEffect
  const calculateAndDisplayRoute = useCallback(async (
    from: [number, number],
    to: [number, number],
  ) => {
    if (!map.current) {
      return;
    }

    // Clear previous routes
    clearAllRoutesUtil(
      map.current,
      directionsControlRef,
      routeMarkerRef,
      updateMarkerZIndex,
      setRouteData,
      setRouteDirections,
      setRouteOrigin,
      setRouteDestination,
    );

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

      // Function to update selected route styling
      const updateMapRoute = (routeIndex: number, _routeData: RouteData) => {
        if (!map.current) {
          return;
        }
        updateRouteStyling(map.current, fetchedRoutes, routeIndex, from);
      };

      // Set up route change callback
      if (directionsControlRef.current) {
        directionsControlRef.current.setRouteChangeCallback(updateMapRoute);
      }

      // Add all routes to map (first one selected by default)
      addRoutesToMap(map.current, fetchedRoutes, 0, from);

      // Add click handlers to route layers for switching
      addRouteHandlers(map.current, fetchedRoutes, directionsControlRef);

      // Show directions in Mapbox control with all routes
      if (directionsControlRef.current) {
        // Generate URLs for buttons
        const googleUrl = `https://www.google.com/maps/dir/?api=1&origin=${from[1]},${from[0]}&destination=${to[1]},${to[0]}`;
        const appleUrl = `https://maps.apple.com/?saddr=${from[1]},${from[0]}&daddr=${to[1]},${to[0]}`;
        directionsControlRef.current.showDirections(fetchedRoutes, allDirections, googleUrl, appleUrl);
        updateMarkerZIndex(true);
      }
    } else {
      // Fallback: show straight line if route fetch fails
      addFallbackRoute(map.current, from, to);
      // Clear route data if fetch fails
      setRouteData(null);
      setRouteDirections([]);
      setRouteOrigin(null);
      setRouteDestination(null);
      if (directionsControlRef.current) {
        directionsControlRef.current.hideDirections();
        updateMarkerZIndex(false);
      }
    }
  }, [fetchRoute, formatDistance, updateMarkerZIndex]);

  /**
   * useEffect 1: Initialize map and set up all destination markers with coordinates
   * This runs once on mount and sets up all markers for all destinations
   */
  useEffect(() => {
    if (!mapContainer.current || map.current) {
      return;
    }

    mapboxgl.accessToken = mapboxAccessToken;

    // Helper function to check if two coordinates are the same (with tolerance for floating point)
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

    // Get unique coordinates only (first destination at each coordinate)
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

    // Initialize map using utility function
    map.current = initializeMap(mapContainer.current, mapboxAccessToken, coordinates);

    map.current?.on('load', () => {
      setIsMapLoaded(true);

      // Fit map to coordinates using utility function
      if (map.current) {
        fitMapToCoordinates(map.current, coordinates);
      }

      // Initialize and add directions control
      const directionsControl = new DirectionsControl(
        formatDistance,
        formatDuration,
      );
      directionsControlRef.current = directionsControl;
      map.current?.addControl(directionsControl, 'top-right');

      // Add search if MapboxGeocoder exists
      if (MapboxGeocoder) {
        const geocoder = new MapboxGeocoder({
          accessToken: mapboxAccessToken,
          mapboxgl: mapboxgl as any,
          marker: false,
          placeholder: 'Search for a location',
        });
        map.current?.addControl(geocoder as any);

        geocoder.on('result', (e: any) => {
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

          // Save searched location to searchController
          // The route calculation will be handled by a separate useEffect
          searchController.setSearchedLocation(center, place_name || 'Searched Location');

          // Fly to searched location
          map.current.flyTo({ center, zoom: 14 });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxAccessToken]);

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
   * useEffect 2: Set up all destination markers with coordinates
   * This runs when destinations change and sets up markers for all destinations
   */
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    // Remove all existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clean up previous click handlers
    clickHandlersRef.current.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler);
    });
    clickHandlersRef.current = [];

    // Helper function to check if two coordinates are the same (with tolerance for floating point)
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

    // Track which coordinates have been used to avoid duplicate markers
    const usedCoordinates: Array<{ lat: number; lng: number }> = [];

    // Filter destinations to only include the first one at each unique coordinate
    const uniqueDestinations = destinations.filter((destination) => {
      if (!destination.coordinate) {
        return false;
      }

      // Check if this coordinate has already been used
      const isDuplicate = usedCoordinates.some(usedCoord =>
        areCoordinatesEqual(usedCoord, destination.coordinate!),
      );

      if (!isDuplicate) {
        // Mark this coordinate as used
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

      // Create Mapbox native marker
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
        offset: [0, 3],
        draggable: false,
      })
        .setLngLat([destination.coordinate.lng, destination.coordinate.lat]);

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: [0, -50],
        closeButton: true,
        closeOnClick: false,
        anchor: 'bottom',
        className: 'mapboxgl-popup destination-popup',
        maxWidth: '300px',
      }).setHTML(
        `<div style="padding: 0; width: 300px;">
          ${destination.images && destination.images.length > 0
            ? `
            <div style="width: 92%; height: 120px; overflow: hidden; border-radius: 8px 8px 0 0; margin-bottom: 12px;">
              <img 
                src="${destination.images[0]}" 
                alt="${destination.name}"
                style="width: 100%; height: 100%; object-fit: cover; display: block;"
                onerror="this.style.display='none'"
              />
            </div>
          `
            : ` <div style="width: 92%; height: 120px; overflow: hidden; border-radius: 8px 8px 0 0; margin-bottom: 12px;">
              <img 
                src="${'/placeholder.svg'}" 
                alt="${destination.name}"
                style="width: 100%; height: 100%; object-fit: cover; display: block;"
                onerror="this.style.display='none'"
              />
            </div>`}
          <div style="padding: 0 12px 12px 12px;">
            <strong style="font-size: 16px; display: block; margin-bottom: 8px;">${destination.name}</strong>
            ${destination.timeSlot ? `<div style="font-size: 13px; color: #666; margin-bottom: 8px;"><small>${destination.timeSlot.start_time} - ${destination.timeSlot.end_time}</small></div>` : ''}
            ${destination.description ? `<p style="font-size: 13px; color: #333; line-height: 1.5; margin: 0;">${destination.description}</p>` : ''}
          </div>
        </div>`,
      );

      // Attach popup to marker
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
          // Event listeners are cleaned up in useEffect cleanup via clickHandlersRef
          closeButton.addEventListener('mouseenter', handleMouseEnter);
          closeButton.addEventListener('mouseleave', handleMouseLeave);

          // Store handlers for cleanup (handled in useEffect cleanup)
          clickHandlersRef.current.push(
            { element: closeButton, handler: handleMouseEnter },
            { element: closeButton, handler: handleMouseLeave },
          );
        }
      };
      popup.on('open', styleCloseButton);

      // Add click handler
      const clickHandler = () => {
        if (onMarkerClick) {
          const destinationId = el.getAttribute('data-destination-id');
          if (destinationId) {
            onMarkerClick(destinationId);
          }
        }
      };
      // Event listener is cleaned up in useEffect cleanup via clickHandlersRef
      el.addEventListener('click', clickHandler);
      clickHandlersRef.current.push({ element: el, handler: clickHandler });

      markersRef.current.push(marker as any);
    });

    return () => {
      // Clean up all event listeners (including close button handlers)
      clickHandlersRef.current.forEach(({ element, handler }) => {
        element.removeEventListener('click', handler);
        element.removeEventListener('mouseenter', handler);
        element.removeEventListener('mouseleave', handler);
      });
      clickHandlersRef.current = [];
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [destinations, isMapLoaded, onMarkerClick]);

  /**
   * useEffect 3: Listen to selected destination from store and fly to it
   * This runs when selectedDestinationId changes and flies to the destination if it exists
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
      // Update z-index for all markers based on directions visibility
      updateMarkerZIndex();

      // Close all open popups
      markersRef.current.forEach((marker) => {
        if (marker.getPopup()?.isOpen()) {
          marker.togglePopup();
        }
      });

      // Get unique coordinates only (first destination at each coordinate)
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
          // If only one coordinate, center on it with appropriate zoom
          map.current.flyTo({
            center: coordinates[0],
            zoom: 12,
            duration: 1500,
            essential: true,
          });
        } else {
          // Fit bounds to show all destinations
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

    // Find the destination in the destinations array
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
    // Use updateMarkerZIndex to ensure correct z-index based on directions visibility
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
    // Update z-index for all markers based on directions visibility
    updateMarkerZIndex();

    // Fly to the destination
    const targetCenter: [number, number] = [destination.coordinate.lng, destination.coordinate.lat];
    map.current.stop();
    map.current.flyTo({
      center: targetCenter,
      zoom: 15,
      duration: 1500,
      essential: true,
    });

    // Open popup after animation completes
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    popupTimeoutRef.current = setTimeout(() => {
      marker.togglePopup();
      popupTimeoutRef.current = null;
    }, 1500);

    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    };
  }, [selectedDestinationId, destinations, isMapLoaded, updateMarkerZIndex]);

  /**
   * useEffect 4: Display search marker when searched location is set
   * This runs when searchedLocation changes and displays/removes the search marker
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
   * useEffect 5: Clear routes when selectedDestinationId changes
   * This runs when selectedDestinationId changes and removes all routes and direction modal
   */
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    // Clear all routes and hide directions when selectedDestinationId changes
    clearAllRoutes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDestinationId, isMapLoaded]);

  /**
   * useEffect 6: Calculate and display routes based on searched location
   * This runs when searchedLocation changes
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
  }, [searchedLocation, getCurrentLocation]);

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
