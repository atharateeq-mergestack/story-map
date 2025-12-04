'use client';

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
  isBlurred?: boolean;
  isTop?: boolean;
};

export function DestinationDetailPanel({ destination, isBlurred = false, isTop = false }: DestinationDetailPanelProps) {
  return (
    <div
      className={`bg-background rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
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
        {destination.name && (
          <p className="text-md font-semibold text-foreground/80 leading-relaxed">{destination.name}</p>
        )}
        {/* Description */}
        {destination.description && (
          <p className="text-sm text-foreground/80 leading-relaxed">{destination.description}</p>
        )}
      </div>
    </div>
  );
}
