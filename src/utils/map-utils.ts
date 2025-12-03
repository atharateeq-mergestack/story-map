import type { DirectionsControl, RouteData } from '@/components/tour/DirectionsControl';
import mapboxgl from 'mapbox-gl';

// Type for ref objects (compatible with React.MutableRefObject)
type RefObject<T> = {
  current: T | null;
};

/**
 * Clear all route layers and sources from the map
 */
export function clearRouteLayers(map: mapboxgl.Map): void {
  // Remove all route layers (up to 3 alternative routes)
  for (let i = 0; i < 3; i++) {
    if (map.getLayer(`route-${i}`)) {
      map.removeLayer(`route-${i}`);
    }
    if (map.getSource(`route-${i}`)) {
      map.removeSource(`route-${i}`);
    }
  }
  // Also remove old single route if it exists
  if (map.getSource('route')) {
    if (map.getLayer('route')) {
      map.removeLayer('route');
    }
    map.removeSource('route');
  }
}

/**
 * Clear route marker if it exists
 */
export function clearRouteMarker(routeMarkerRef: RefObject<mapboxgl.Marker>): void {
  if (routeMarkerRef.current) {
    routeMarkerRef.current.remove();
    routeMarkerRef.current = null;
  }
}

/**
 * Clear all routes, hide directions, and reset route state
 */
export function clearAllRoutes(
  map: mapboxgl.Map,
  directionsControlRef: RefObject<DirectionsControl>,
  routeMarkerRef: RefObject<mapboxgl.Marker>,
  updateMarkerZIndex: (directionsVisible: boolean) => void,
  setRouteData: (data: RouteData | null) => void,
  setRouteDirections: (directions: string[]) => void,
  setRouteOrigin: (origin: [number, number] | null) => void,
  setRouteDestination: (destination: [number, number] | null) => void,
): void {
  // Clear route layers
  clearRouteLayers(map);

  // Clear route marker
  clearRouteMarker(routeMarkerRef);

  // Hide directions control
  if (directionsControlRef.current) {
    directionsControlRef.current.hideDirections();
    updateMarkerZIndex(false);
  }

  // Reset route state
  setRouteData(null);
  setRouteDirections([]);
  setRouteOrigin(null);
  setRouteDestination(null);
}

/**
 * Add all routes to the map with proper styling
 */
export function addRoutesToMap(
  map: mapboxgl.Map,
  routes: RouteData[],
  selectedIndex: number,
  from: [number, number],
): void {
  // Remove existing route layers first
  clearRouteLayers(map);

  // Add all routes as separate layers
  routes.forEach((route, index) => {
    const isSelected = index === selectedIndex;
    map.addSource(`route-${index}`, {
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

    map.addLayer({
      id: `route-${index}`,
      type: 'line',
      source: `route-${index}`,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': isSelected ? '#0074D9' : '#989a9c',
        'line-width': isSelected ? 8 : 6,
        'line-opacity': isSelected ? 1 : 0.7,
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

  map.fitBounds(allBounds as unknown as mapboxgl.LngLatBounds, {
    padding: 50,
    maxZoom: 15,
    duration: 500,
  });
}

/**
 * Update selected route styling on the map
 */
export function updateRouteStyling(
  map: mapboxgl.Map,
  routes: RouteData[],
  selectedIndex: number,
  from: [number, number],
): void {
  // Update all route layer styles
  routes.forEach((_route, index) => {
    const isSelected = index === selectedIndex;
    if (map.getLayer(`route-${index}`)) {
      map.setPaintProperty(`route-${index}`, 'line-color', isSelected ? '#0074D9' : '#989a9c');
      map.setPaintProperty(`route-${index}`, 'line-width', 6);
      map.setPaintProperty(`route-${index}`, 'line-opacity', isSelected ? 1 : 0.7);
    }
  });

  // Fit map to show selected route
  const selectedRoute = routes[selectedIndex];
  if (selectedRoute) {
    const bounds = selectedRoute.geometry.coordinates.reduce(
      (bounds, coord) => bounds.extend(coord as [number, number]),
      new mapboxgl.LngLatBounds(from, from),
    );
    map.fitBounds(bounds as unknown as mapboxgl.LngLatBounds, {
      padding: 50,
      maxZoom: 15,
      duration: 500,
    });
  }
}

/**
 * Add click and hover handlers to route layers
 */
export function addRouteHandlers(
  map: mapboxgl.Map,
  routes: RouteData[],
  directionsControlRef: RefObject<DirectionsControl>,
): void {
  routes.forEach((_route, index) => {
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
    map.on('click', `route-${index}`, clickHandler);

    // Change cursor on hover for all routes (to indicate they're clickable)
    const mouseEnterHandler = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const mouseLeaveHandler = () => {
      map.getCanvas().style.cursor = '';
    };
    map.on('mouseenter', `route-${index}`, mouseEnterHandler);
    map.on('mouseleave', `route-${index}`, mouseLeaveHandler);
  });
}

/**
 * Add fallback straight line route when route fetch fails
 */
export function addFallbackRoute(
  map: mapboxgl.Map,
  from: [number, number],
  to: [number, number],
): void {
  map.addSource('route', {
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

  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#0074D9', 'line-width': 4 },
  });
}

/**
 * Initialize map with default settings
 */
export function initializeMap(
  container: HTMLDivElement,
  _mapboxAccessToken: string,
  coordinates: [number, number][],
): mapboxgl.Map {
  // Always initialize the map, even if there are no coordinates
  const defaultCenter: [number, number] = [0, 0]; // [lng, lat] - world center
  const initialCenter = coordinates.length > 0 ? coordinates[0] : defaultCenter;
  const initialZoom = coordinates.length > 0 ? 11 : 2;

  const map = new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: initialCenter,
    zoom: initialZoom,
  }) as any;

  return map;
}

/**
 * Fit map bounds to show all coordinates
 */
export function fitMapToCoordinates(
  map: mapboxgl.Map,
  coordinates: [number, number][],
): void {
  if (coordinates.length === 0) {
    return;
  }

  if (coordinates.length === 1) {
    // If only one coordinate, center on it with appropriate zoom
    map.flyTo({
      center: coordinates[0],
      zoom: 12,
      duration: 0,
    });
  } else {
    // Fit bounds to show all coordinates
    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(coord),
      new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
    );
    map.fitBounds(bounds as unknown as mapboxgl.LngLatBounds, {
      padding: 50,
      maxZoom: 15,
    });
  }
}
