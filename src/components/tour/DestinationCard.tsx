'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Heading } from '@/components/ui/common/Heading';
import { Text } from '@/components/ui/common/Text';

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
  return (
    <Card
      className={`cursor-pointer transition-all overflow-hidden ${isActive ? 'ring-2 ring-foreground shadow-lg' : ''}`}
      onClick={onClick}
    >
      {destination.images && destination.images.length > 0 && (
        <div className="w-full h-32 bg-muted overflow-hidden">
          <img
            src={destination.images[0] || '/placeholder.svg'}
            alt={destination.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
      )}

      <CardContent className="p-3 sm:p-4">
        <Heading level={4} size="sm" weight="semibold" className="mb-2 text-sm sm:text-base line-clamp-1">
          {destination.name}
        </Heading>

        {destination.timeSlot && (
          <Text size="sm" color="muted" className="mb-2 text-xs sm:text-sm">
            {destination.timeSlot.start_time}
            {' '}
            -
            {destination.timeSlot.end_time}
            {destination.timeSlot.slot_label && (
              <>
                {' '}
                (
                {destination.timeSlot.slot_label}
                )
              </>
            )}
          </Text>
        )}

        {destination.description && (
          <Text size="sm" color="muted" lineClamp={2} className="text-xs sm:text-sm">
            {destination.description}
          </Text>
        )}
      </CardContent>
    </Card>
  );
}
