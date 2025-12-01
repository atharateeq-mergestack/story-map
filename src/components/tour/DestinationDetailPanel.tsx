'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageCarousel } from './ImageCarousel';

type Destination = {
  id: string;
  name: string;
  timeSlot: {
    start_time: string;
    end_time: string;
    slot_label?: string;
  } | null;
  description: string | null;
  images?: string[];
};

type DestinationDetailPanelProps = {
  destination: Destination;
  onClose: () => void;
  isBlurred?: boolean;
  isTop?: boolean;
};

export function DestinationDetailPanel({ destination, onClose, isBlurred = false, isTop = false }: DestinationDetailPanelProps) {
  return (
    <div
      className={`bg-background border border-foreground/20 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
        isBlurred ? 'blur-sm opacity-60' : 'blur-0 opacity-100'
      } ${isTop ? 'z-10' : 'z-0'}`}
    >
      {/* Media / Carousel */}
      <div className="w-full h-64 sm:h-80 bg-gray-100">
        <ImageCarousel images={destination.images || []} title={destination.name} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Time */}
        {destination.timeSlot && (
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {destination.timeSlot.start_time}
              {' '}
              -
              {destination.timeSlot.end_time}
              {destination.timeSlot.slot_label && ` (${destination.timeSlot.slot_label})`}
            </h3>
          </div>
        )}

        {/* Description */}
        {destination.description && (
          <p className="text-sm text-foreground/80 leading-relaxed">{destination.description}</p>
        )}

        {/* Close */}
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="mt-4 w-full gap-2 bg-transparent flex justify-center items-center"
        >
          <X size={16} />
          Back to overview
        </Button>
      </div>
    </div>
  );
}
