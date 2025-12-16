'use client';

import Image from 'next/image';

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
type DestinationCardProps = {
  destination: Destination;
  isActive: boolean;
  onClick: () => void;
};

export function DestinationCard({ destination, isActive, onClick }: DestinationCardProps) {
  // Keyboard and ARIA support for accessibility (fixes lints)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Prevent space from scrolling
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      key={destination.id}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={() => onClick?.()}
      onKeyDown={handleKeyDown}
      className={`grid grid-cols-[130px_1fr] h-[15vh] gap-3 items-start p-3 cursor-pointer transition-all rounded-lg border ${isActive ? 'ring-2 ring-foreground shadow-lg' : 'border-transparent'} hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary`}
    >
      {/* Thumbnail */}
      <div className="w-28 h-20 overflow-hidden rounded-lg bg-gray-200">
        <Image
          width={120}
          height={80}
          src={destination.images?.[0] || '/placeholder.svg'}
          alt={destination.name}
          className="w-full h-full object-cover transition-transform hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-start">
        {/* Time */}
        {destination.name && (
          <h3 className="text-sm font-semibold line-clamp-1">
            {destination.name}
          </h3>
        )}
        {destination.timeSlot && (
          <h3 className="text-sm font-semibold line-clamp-1">
            {destination.timeSlot.start_time}
            {' '}
            -
            {destination.timeSlot.end_time}
            {destination.timeSlot.slot_label && ` (${destination.timeSlot.slot_label})`}
          </h3>
        )}

        {/* Description */}
        {destination.description && (
          <p className="text-xs  line-clamp-2 mt-1">
            {destination.description}
          </p>
        )}
      </div>
    </div>
  );
}
