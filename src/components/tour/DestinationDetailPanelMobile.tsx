'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
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
};

export function DestinationDetailPanelMobile({
  destinations,
  selectedDestinationId,
  open,
  onOpenChange,
}: DestinationDetailPanelMobileProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const destinationRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [currentImageIndices, setCurrentImageIndices] = useState<Map<string, number>>(() => new Map());
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialScrolledRef = useRef(false);
  const isUserScrollingRef = useRef(false);

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

  // Scroll to selected destination when modal first opens
  useEffect(() => {
    if (!selectedDestinationId || !scrollContainerRef.current || !open || hasInitialScrolledRef.current) {
      return;
    }

    // Wait for refs to be set and DOM to be ready
    const scrollToSelected = () => {
      const selectedElement = destinationRefs.current.get(selectedDestinationId);
      if (selectedElement && scrollContainerRef.current) {
        const container = scrollContainerRef.current;

        // Calculate scroll position to show the selected element
        // Position it so it's visible but not necessarily centered
        const scrollLeft = selectedElement.offsetLeft - container.offsetLeft - 20; // 20px padding from left

        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth',
        });

        hasInitialScrolledRef.current = true;
      } else {
        // Retry if refs aren't ready yet
        requestAnimationFrame(scrollToSelected);
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(scrollToSelected, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedDestinationId, open]);

  // Reset initial scroll flag when modal closes
  useEffect(() => {
    if (!open) {
      hasInitialScrolledRef.current = false;
      isUserScrollingRef.current = false;
    }
  }, [open]);

  // Handle scroll to detect which destination is in view (70% threshold)
  const handleScroll = () => {
    if (!scrollContainerRef.current) {
      return;
    }

    // Mark that user is scrolling
    isUserScrollingRef.current = true;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerLeft = containerRect.left;
    const containerWidth = containerRect.width;

    // Calculate 70% visibility threshold
    const visibilityThreshold = containerWidth * 0.5;
    const thresholdStart = containerLeft;
    const thresholdEnd = containerLeft + visibilityThreshold;

    type VisibleDestination = { id: string; visibility: number };
    let mostVisibleDestination: VisibleDestination | null = null;

    for (const [destinationId, element] of destinationRefs.current.entries()) {
      const elementRect = element.getBoundingClientRect();
      const elementLeft = elementRect.left;
      const elementRight = elementRect.right;
      const elementWidth = elementRect.width;

      // Calculate how much of the element is within the 70% threshold
      const visibleStart = Math.max(elementLeft, thresholdStart);
      const visibleEnd = Math.min(elementRight, thresholdEnd);
      const visibleWidth = Math.max(0, visibleEnd - visibleStart);
      const visibilityPercentage = visibleWidth / elementWidth;

      // Check if this element has more visibility than the current most visible
      if (visibilityPercentage > 0 && (!mostVisibleDestination || visibilityPercentage > mostVisibleDestination.visibility)) {
        mostVisibleDestination = { id: destinationId, visibility: visibilityPercentage };
      }
    }

    // Update selected destination if we found one that's 70% visible
    if (mostVisibleDestination && mostVisibleDestination.visibility >= 0.5) {
      const newSelectedId: string = mostVisibleDestination.id;
      if (newSelectedId !== selectedDestinationId) {
        // Update selected destination
        destinationController.setSelectedDestination(newSelectedId);
      }
    }

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Clear user scrolling flag after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 100);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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
          {/* Header with Close Button */}
          <div className="flex justify-end pt-3 pb-2 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Horizontal Scrollable Destinations */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4 scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollBehavior: 'smooth',
            }}
          >
            <div className="flex gap-4" style={{ width: 'max-content' }}>
              {destinations.map((destination) => {
                const isSelected = destination.id === selectedDestinationId;
                const images = destination.images && destination.images.length > 0
                  ? destination.images
                  : ['/placeholder.svg'];
                const currentImageIndex = getImageIndex(destination.id);

                return (
                  <div
                    key={destination.id}
                    ref={(el) => {
                      if (el) {
                        destinationRefs.current.set(destination.id, el);
                      } else {
                        destinationRefs.current.delete(destination.id);
                      }
                    }}
                    className={cn(
                      'snap-center shrink-0 w-[85vw] transition-all duration-300',
                      !isSelected && 'blur-sm opacity-60',
                      isSelected && 'blur-0 opacity-100',
                    )}
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
                      {destination.description && (
                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                          {destination.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
