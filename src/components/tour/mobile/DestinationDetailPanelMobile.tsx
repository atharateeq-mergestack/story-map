'use client';

import type { RouteData } from '../DirectionsControl';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogPortal,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routeData: RouteData | null;
  googleMapsUrl: string;
  appleMapsUrl: string;
  formatDistance: (meters: number) => string;
  formatDuration: (seconds: number) => string;
};

export function DestinationDetailPanelMobile({
  destinations,
  selectedDestinationId,
  open,
  onOpenChange,
  routeData,
  googleMapsUrl,
  appleMapsUrl,
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

  if (destinations.length === 0 || !selectedDestination) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogPrimitive.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-background',
            'duration-300 ease-out',
            'max-h-[60vh] overflow-hidden flex flex-col',
          )}
        >
          {/* Header with Close Button and Navigation */}
          <div className="flex justify-end items-center pt-3 px-4">

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full p-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Destinations Container */}
          <div className="flex-1 overflow-hidden px-4 pb-4 relative">
            <div className="h-full w-full">
              {destinations.map((destination) => {
                const isSelected = destination.id === selectedDestinationId;

                // Only render the selected destination
                if (!isSelected) {
                  return null;
                }

                const images = destination.images && destination.images.length > 0
                  ? destination.images
                  : ['/placeholder.svg'];
                const currentImageIndex = getImageIndex(destination.id);

                return (
                  <div
                    key={destination.id}
                    className="w-full h-full transition-all duration-300"
                  >
                    {/* Image Section */}
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted mb-3">
                      <Image
                        src={images[currentImageIndex] || '/placeholder.svg'}
                        width={400}
                        height={200}
                        alt={destination.name || 'Destination Image'}
                        className="w-full h-full object-cover"
                      />

                      {images.length > 1 && (
                        <>
                          {/* Left Arrow */}
                          <button
                            type="button"
                            onClick={() => goToPreviousImage(destination.id, images.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 transition-all z-10"
                            aria-label="Previous image"
                          >
                            <ChevronLeft size={16} />
                          </button>

                          {/* Right Arrow */}
                          <button
                            type="button"
                            onClick={() => goToNextImage(destination.id, images.length)}
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
                      {destination.name && (
                        <h3 className="text-base font-semibold text-foreground line-clamp-2">
                          {destination.name}
                        </h3>
                      )}

                      {/* Time */}
                      {destination.timeSlot && (
                        <p className="text-sm text-muted-foreground">
                          {destination.timeSlot.start_time}
                          {' '}
                          -
                          {' '}
                          {destination.timeSlot.end_time}
                          {destination.timeSlot.slot_label && ` (${destination.timeSlot.slot_label})`}
                        </p>
                      )}

                      {/* Description */}
                      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 h-20">
                        {destination.description}
                      </p>

                      {/* Route Information - Only show if route data exists */}
                      {routeData && (
                        <div className="m-1">
                          <div className="flex justify-between gap-2">
                            {googleMapsUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(googleMapsUrl, '_blank')}
                                className="w-1/2 justify-start gap-2"
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
                                className="w-1/2 justify-start gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open in Apple Maps
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center pt-3 pb-2 px-4">
              {/* Previous Button */}
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
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
