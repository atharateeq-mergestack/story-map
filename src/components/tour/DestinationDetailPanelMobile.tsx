'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, XIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
  destination: Destination | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DestinationDetailPanelMobile({
  destination,
  open,
  onOpenChange,
}: DestinationDetailPanelMobileProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when destination changes
  useEffect(() => {
    if (destination) {
      setCurrentImageIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination?.id]);

  if (!destination) {
    return null;
  }

  const images = destination.images && destination.images.length > 0
    ? destination.images
    : ['/placeholder.svg'];

  const goToPrevious = () => {
    setCurrentImageIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-background border-t border-border rounded-t-2xl shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
            'duration-300 ease-out',
            'max-h-[60vh] overflow-hidden flex flex-col',
          )}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Close Button */}
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full p-0"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Image Section - Compact */}
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
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 transition-all z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Right Arrow */}
                  <button
                    type="button"
                    onClick={goToNext}
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
