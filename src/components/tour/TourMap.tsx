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

// Custom Mapbox Control for Directions (similar to geocoder)
class DirectionsControl implements mapboxgl.IControl {
  private container: HTMLElement;
  private directionsContainer: HTMLElement | null = null;
  private routes: RouteData[] = [];
  private routeDirections: string[][] = [];
  private googleMapsUrl: string = '';
  private appleMapsUrl: string = '';
  private selectedRouteIndex: number = 0;
  private onRouteChange?: (routeIndex: number, routeData: RouteData) => void;
  private map: mapboxgl.Map | null = null;
  private isVisible: boolean = false;

  constructor(
    private formatDistanceFn: (meters: number) => string,
    private formatDurationFn: (seconds: number) => string,
  ) {
    this.container = document.createElement('div');
    this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this.container.style.display = 'none';
  }

  onAdd(map: mapboxgl.Map): HTMLElement {
    this.map = map;
    return this.container;
  }

  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  onRemove(): void {
    this.map = null;
    this.container.parentNode?.removeChild(this.container);
  }

  getDefaultPosition(): string {
    return 'top-right';
  }

  setRouteChangeCallback(callback: (routeIndex: number, routeData: RouteData) => void): void {
    this.onRouteChange = callback;
  }

  showDirections(
    routes: RouteData[],
    allDirections: string[][],
    googleMapsUrl: string,
    appleMapsUrl: string,
  ): void {
    this.routes = routes;
    this.routeDirections = allDirections;
    this.googleMapsUrl = googleMapsUrl;
    this.appleMapsUrl = appleMapsUrl;
    this.selectedRouteIndex = 0;
    this.isVisible = true;
    this.render();
    this.container.style.display = 'block';
  }

  hideDirections(): void {
    // Keep route data so we can reopen
    this.isVisible = false;
    this.container.style.display = 'none';
    if (this.directionsContainer) {
      this.directionsContainer.innerHTML = '';
    }
  }

  isDirectionsVisible(): boolean {
    return this.isVisible;
  }

  reopenDirections(): void {
    if (this.routes.length > 0 && this.routeDirections.length > 0) {
      this.isVisible = true;
      this.render();
      this.container.style.display = 'block';
      // Trigger route change callback to update map styling
      const selectedRoute = this.routes[this.selectedRouteIndex];
      if (this.onRouteChange && selectedRoute) {
        this.onRouteChange(this.selectedRouteIndex, selectedRoute);
      }
    }
  }

  switchRoute(index: number): void {
    if (index < 0 || index >= this.routes.length) {
      return;
    }
    this.selectedRouteIndex = index;
    this.render();
    if (this.onRouteChange && this.routes[index]) {
      this.onRouteChange(index, this.routes[index]);
    }
  }

  private render(): void {
    if (this.routes.length === 0 || this.routeDirections.length === 0) {
      return;
    }

    if (!this.directionsContainer) {
      this.directionsContainer = document.createElement('div');
      this.directionsContainer.className = 'mapbox-directions';
      this.directionsContainer.style.cssText = `
        position: absolute;
        top: 60px;
        right: 10px;
        width: 320px;
        max-width: calc(100vw - 20px);
        max-height: calc(100vh - 80px);
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 50;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      `;
      this.container.appendChild(this.directionsContainer);
    }

    const currentRoute = this.routes[this.selectedRouteIndex];
    if (!currentRoute) {
      return;
    }
    const currentDirections = this.routeDirections[this.selectedRouteIndex] || [];

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
      position: relative;
    `;

    // Route selection buttons if multiple routes available
    let routeSelector = '';
    if (this.routes.length > 1) {
      routeSelector = `
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; color: #666; margin-bottom: 6px; font-weight: 500;">Select Route:</div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            ${this.routes.map((route, index) => `
              <button 
                class="route-option-btn" 
                data-route-index="${index}"
                style="
                  flex: 1;
                  min-width: 80px;
                  padding: 6px 10px;
                  background: ${index === this.selectedRouteIndex ? '#0074D9' : 'white'};
                  color: ${index === this.selectedRouteIndex ? 'white' : '#333'};
                  border: 1px solid ${index === this.selectedRouteIndex ? '#0074D9' : '#ccc'};
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                  transition: all 0.2s;
                  font-weight: ${index === this.selectedRouteIndex ? '600' : '400'};
                "
              >
                Route ${index + 1}
                <div style="font-size: 10px; margin-top: 2px; opacity: 0.9;">
                  ${this.formatDistanceFn(route.distance)}
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <div style="font-weight: 600; font-size: 16px;">Directions</div>
        <button 
          class="close-directions-btn"
          style="
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.2s;
          "
          title="Close directions"
        >×</button>
      </div>
      ${routeSelector}
      <div style="font-size: 13px; color: #666;">
        <div style="margin-bottom: 4px;"><strong>Distance:</strong> ${this.formatDistanceFn(currentRoute.distance)}</div>
        <div><strong>Duration:</strong> ${this.formatDurationFn(currentRoute.duration)}</div>
      </div>
    `;

    // Add close button handler
    const closeBtn = header.querySelector('.close-directions-btn') as HTMLElement;
    if (closeBtn) {
      closeBtn.onmouseover = () => {
        closeBtn.style.background = '#e0e0e0';
      };
      closeBtn.onmouseout = () => {
        closeBtn.style.background = 'transparent';
      };
      closeBtn.onclick = () => {
        this.hideDirections();
      };
    }

    // Add click handlers for route selection buttons
    if (this.routes.length > 1) {
      const routeButtons = header.querySelectorAll('.route-option-btn');
      routeButtons.forEach((btn) => {
        const routeIndex = Number.parseInt(btn.getAttribute('data-route-index') || '0', 10);
        btn.addEventListener('click', () => {
          this.switchRoute(routeIndex);
        });
      });
    }

    const directionsList = document.createElement('div');
    directionsList.style.cssText = `
      max-height: 400px;
      overflow-y: auto;
      padding: 12px 16px;
    `;
    currentDirections.forEach((direction) => {
      const directionItem = document.createElement('div');
      directionItem.style.cssText = `
        font-size: 13px;
        line-height: 1.6;
        margin-bottom: 8px;
        color: #333;
      `;
      directionItem.textContent = direction;
      directionsList.appendChild(directionItem);
    });

    const actions = document.createElement('div');
    actions.style.cssText = `
      padding: 12px 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    const googleMapsBtn = document.createElement('button');
    googleMapsBtn.textContent = 'Open in Google Maps';
    googleMapsBtn.style.cssText = `
      width: 100%;
      padding: 0px 12px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    `;
    googleMapsBtn.onmouseover = () => {
      googleMapsBtn.style.background = '#f5f5f5';
    };
    googleMapsBtn.onmouseout = () => {
      googleMapsBtn.style.background = 'white';
    };
    googleMapsBtn.onclick = () => {
      window.open(this.googleMapsUrl, '_blank');
    };

    const appleMapsBtn = document.createElement('button');
    appleMapsBtn.textContent = 'Open in Apple Maps';
    appleMapsBtn.style.cssText = `
      width: 100%;
      padding: 0px 12px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    `;
    appleMapsBtn.onmouseover = () => {
      appleMapsBtn.style.background = '#f5f5f5';
    };
    appleMapsBtn.onmouseout = () => {
      appleMapsBtn.style.background = 'white';
    };
    appleMapsBtn.onclick = () => {
      window.open(this.appleMapsUrl, '_blank');
    };

    actions.appendChild(googleMapsBtn);
    actions.appendChild(appleMapsBtn);

    this.directionsContainer.innerHTML = '';
    this.directionsContainer.appendChild(header);
    this.directionsContainer.appendChild(directionsList);
    this.directionsContainer.appendChild(actions);
  }
}

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

          // Optional: Show route to active destination if exists
          const dest = destinations.find(d => d.id === activeDestinationId);
          if (dest?.coordinate) {
            const from: [number, number] = [center[0], center[1]]; // [lng, lat]
            const to: [number, number] = [dest.coordinate.lng, dest.coordinate.lat]; // [lng, lat]

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
          } else {
            // Clear route data if no destination
            setRouteData(null);
            setRouteDirections([]);
            setRouteOrigin(null);
            setRouteDestination(null);
            if (directionsControlRef.current) {
              directionsControlRef.current.hideDirections();
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
  }, [mapboxAccessToken, destinations, activeDestinationId, fetchRoute]);

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

        // Reset animation flag after animation completes
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
          animationInProgressRef.current = false;
          animationTimeoutRef.current = null;
        }, 1500);
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
