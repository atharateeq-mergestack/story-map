'use client';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
import destinationController from '@/store/destinationController';
import { fitMapToCoordinates, initializeMap } from '@/utils/map-utils';
import 'mapbox-gl/dist/mapbox-gl.css';

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

type TourMapMobileProps = {
  destinations: Destination[];
  mapboxAccessToken: string;
  onMarkerClick?: (destinationId: string) => void;
};

export function TourMapMobile({
  destinations,
  mapboxAccessToken,
  onMarkerClick,
}: TourMapMobileProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Get selected destination from store
  const selectedDestinationId = destinationController.useScopeState('selectedDestinationId')[0];

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

  // Check if we have any destinations with coordinates
  const hasCoordinates = destinations.some(dest => dest.coordinate !== null);

  return (
    <div className="h-full w-full relative" style={{ minHeight: '400px' }}>
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
