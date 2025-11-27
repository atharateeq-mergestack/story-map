'use client';

import mapboxgl from 'mapbox-gl';
import { useEffect, useRef, useState } from 'react';
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

type TourMapProps = {
  destinations: Destination[];
  activeDestinationId: string | null;
  mapboxAccessToken: string;
  onMarkerClick?: (destinationId: string) => void;
};

export function TourMap({ destinations, activeDestinationId, mapboxAccessToken, onMarkerClick }: TourMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
      center: coordinates[0] || [0, 0],
      zoom: 10,
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);

      if (coordinates.length > 1) {
        const bounds = coordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
        );
        map.current?.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxAccessToken, destinations]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      return;
    }

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const clickHandlers: Array<{ element: HTMLElement; handler: () => void }> = [];

    destinations.forEach((destination) => {
      if (!destination.coordinate) {
        return;
      }

      const el = document.createElement('div');
      el.className = 'destination-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = activeDestinationId === destination.id ? '#000000' : '#cccccc';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.transition = 'all 0.3s ease';

      if (activeDestinationId === destination.id) {
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.zIndex = '10';
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([destination.coordinate.lng, destination.coordinate.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px;">
              <strong>${destination.name}</strong>
              ${destination.timeSlot
                  ? `<br/><small>${destination.timeSlot.start_time} - ${destination.timeSlot.end_time}</small>`
                  : ''
              }
              ${destination.description
                  ? `<br/><p style="margin-top: 8px; font-size: 12px;">${destination.description}</p>`
                  : ''
              }
            </div>`,
          ),
        )
        .addTo(map.current!);

      const clickHandler = () => {
        if (onMarkerClick) {
          onMarkerClick(destination.id);
        }
      };
      el.addEventListener('click', clickHandler);
      clickHandlers.push({ element: el, handler: clickHandler });

      markersRef.current.push(marker);

      if (activeDestinationId === destination.id) {
        map?.current?.flyTo({
          center: [destination.coordinate.lng, destination.coordinate.lat],
          zoom: 14,
          duration: 1000,
          essential: true,
        });
        marker.togglePopup();
      }
    });

    return () => {
      clickHandlers.forEach(({ element, handler }) => {
        element.removeEventListener('click', handler);
      });
    };
  }, [destinations, activeDestinationId, isMapLoaded, onMarkerClick]);

  return <div ref={mapContainer} className="h-full w-full" style={{ minHeight: '600px' }} />;
}
