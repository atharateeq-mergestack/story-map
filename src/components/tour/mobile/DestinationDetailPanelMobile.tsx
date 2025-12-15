'use client';

import type { RouteData } from '../DirectionsControl';
import { ChevronLeft, ChevronRight, ExternalLink, Navigation, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import destinationController from '@/store/destinationController';

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

type DestinationDetailPanelMobileProps = {
  destinations: Destination[];
  selectedDestinationId: string | null;
  routeData: RouteData | null;
  googleMapsUrl: string;
  appleMapsUrl: string;
  formatDistance: (meters: number) => string;
  formatDuration: (seconds: number) => string;
};

export function DestinationDetailPanelMobile({
  destinations,
  selectedDestinationId,
  routeData,
  googleMapsUrl,
  appleMapsUrl,
  formatDistance,
  formatDuration,
}: DestinationDetailPanelMobileProps) {
  const [currentImageIndices, setCurrentImageIndices] = useState<Map<string, number>>(() => new Map());

  // Get selected destination
  const selectedDestination = destinations.find(d => d.id === selectedDestinationId) || null;

  // Create a stable key for destinations to track changes
  const destinationsKey = useMemo(() => destinations.map(d => d.id).join(','), [destinations]);

  // Reset image indices when destinations change
  useEffect(() => {
    const newIndices = new Map<string, number>();
    destinations.forEach((dest) => {
      newIndices.set(dest.id, 0);
    });
    // Initialize image indices for all destinations when destinations change
    // Using destinationsKey to track changes without re-running on every render
    setCurrentImageIndices(newIndices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationsKey]);

  // Navigation functions
  const goToPreviousDestination = () => {
    if (!selectedDestinationId || destinations.length === 0) {
      return;
    }

    const currentIndex = destinations.findIndex(d => d.id === selectedDestinationId);
    if (currentIndex > 0) {
      const previousDestination = destinations[currentIndex - 1];
      if (previousDestination) {
        destinationController.setSelectedDestination(previousDestination.id);
      }
    } else if (destinations.length > 0) {
      // Loop to last destination
      const lastDestination = destinations[destinations.length - 1];
      if (lastDestination) {
        destinationController.setSelectedDestination(lastDestination.id);
      }
    }
  };

  const goToNextDestination = () => {
    if (!selectedDestinationId || destinations.length === 0) {
      return;
    }

    const currentIndex = destinations.findIndex(d => d.id === selectedDestinationId);
    if (currentIndex < destinations.length - 1) {
      const nextDestination = destinations[currentIndex + 1];
      if (nextDestination) {
        destinationController.setSelectedDestination(nextDestination.id);
      }
    } else if (destinations.length > 0) {
      // Loop to first destination
      const firstDestination = destinations[0];
      if (firstDestination) {
        destinationController.setSelectedDestination(firstDestination.id);
      }
    }
  };

  const currentIndex = selectedDestinationId
    ? destinations.findIndex(d => d.id === selectedDestinationId)
    : -1;
  const canGoPrevious = destinations.length > 1;
  const canGoNext = destinations.length > 1;

  // Don't render if no destination is selected
  if (destinations.length === 0 || !selectedDestination || !selectedDestinationId) {
    return null;
  }

  const getImageIndex = (destinationId: string) => currentImageIndices.get(destinationId) || 0;

  const setImageIndex = (destinationId: string, index: number) => {
    setCurrentImageIndices((prev) => {
      const newMap = new Map(prev);
      newMap.set(destinationId, index);
      return newMap;
    });
  };

  const goToPreviousImage = (destinationId: string, totalImages: number) => {
    const currentIndex = getImageIndex(destinationId);
    const newIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1;
    setImageIndex(destinationId, newIndex);
  };

  const goToNextImage = (destinationId: string, totalImages: number) => {
    const currentIndex = getImageIndex(destinationId);
    const newIndex = currentIndex === totalImages - 1 ? 0 : currentIndex + 1;
    setImageIndex(destinationId, newIndex);
  };

  const images = selectedDestination.images && selectedDestination.images.length > 0
    ? selectedDestination.images
    : ['/placeholder.svg'];
  const currentImageIndex = getImageIndex(selectedDestination.id);

  return (
    <Card className="relative w-full border-none shadow-none">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => destinationController.clearSelectedDestination()}
        className="absolute top-0 right-0 h-8 w-8 rounded-full p-0 z-20 bg-background/90 hover:bg-background shadow-sm"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="p-4">
        {/* Image Section */}
        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted mb-3">
          <Image
            src={images[currentImageIndex] || '/placeholder.svg'}
            width={400}
            height={200}
            alt={selectedDestination.name || 'Destination Image'}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              {/* Left Arrow */}
              <button
                type="button"
                onClick={() => goToPreviousImage(selectedDestination.id, images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 transition-all z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Right Arrow */}
              <button
                type="button"
                onClick={() => goToNextImage(selectedDestination.id, images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 transition-all z-10"
                aria-label="Next image"
              >
                <ChevronRight size={16} />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                {currentImageIndex + 1}
                {' '}
                /
                {' '}
                {images.length}
              </div>
            </>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-2">
          {/* Name */}
          {selectedDestination.name && (
            <h3 className="text-base font-semibold text-foreground line-clamp-2">
              {selectedDestination.name}
            </h3>
          )}

          {/* Time */}
          {selectedDestination.timeSlot && (
            <p className="text-sm text-muted-foreground">
              {selectedDestination.timeSlot.start_time}
              {' '}
              -
              {' '}
              {selectedDestination.timeSlot.end_time}
              {selectedDestination.timeSlot.slot_label && ` (${selectedDestination.timeSlot.slot_label})`}
            </p>
          )}

          {/* Description */}
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 h-20">
            {selectedDestination.description}
          </p>

          {/* Route Information - Only show if route data exists */}
          {routeData && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Route to Search Location
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Distance:</span>
                  <span className="font-medium text-foreground">
                    {formatDistance(routeData.distance)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium text-foreground">
                    {formatDuration(routeData.duration)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {googleMapsUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(googleMapsUrl, '_blank')}
                    className="w-full justify-start gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Google Maps
                  </Button>
                )}
                {appleMapsUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(appleMapsUrl, '_blank')}
                    className="w-full justify-start gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in Apple Maps
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {destinations.length > 1 && (
          <div className="flex justify-between items-center pt-3 border-t border-border mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousDestination}
              disabled={!canGoPrevious}
              className="disabled:opacity-30"
              aria-label="Previous destination"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1}
              {' '}
              /
              {destinations.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextDestination}
              disabled={!canGoNext}
              className="disabled:opacity-30"
              aria-label="Next destination"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
