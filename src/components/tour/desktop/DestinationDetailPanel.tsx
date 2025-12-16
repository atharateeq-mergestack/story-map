'use client';

import { ImageCarousel } from '../ImageCarousel';

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
      className={`bg-background overflow-hidden  transition-all duration-300 my-30 ${
        isBlurred ? 'opacity-50' : 'blur-0 opacity-100'
      } ${isTop ? 'z-10' : 'z-0'}`}
    >
      {/* Media / Carousel */}
      <div className="w-full h-fit bg-gray-100">
        <ImageCarousel images={destination.images && destination.images?.length > 0 ? destination.images : ['/placeholder.svg']} title={destination.name} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Time */}
        {destination.timeSlot && (
          <div>
            <h3 className="text-lg font-semibold text-foreground">
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
          <p className="text-lg font-semibold text-foreground/80 leading-relaxed">{destination.name}</p>
        )}
        {/* Description */}
        {destination.description && (
          <p className="text-md text-foreground/80 leading-relaxed">{destination.description}</p>
        )}
      </div>
    </div>
  );
}
