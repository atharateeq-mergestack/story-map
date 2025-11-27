'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heading } from '@/components/ui/common/Heading';
import { Text } from '@/components/ui/common/Text';
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
};

export function DestinationDetailPanel({ destination, onClose }: DestinationDetailPanelProps) {
  return (
    <Card className="overflow-hidden border border-foreground/20 bg-background">
      <CardContent className="p-0">
        <div className="p-4">
          <ImageCarousel images={destination.images || []} title={destination.name} />
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-4 border-t border-foreground/10">
          {/* Title */}
          <div>
            <Heading level={3} size="lg" weight="bold" className="text-lg sm:text-xl text-foreground">
              {destination.name}
            </Heading>
          </div>

          {/* Time Slot */}
          {destination.timeSlot && (
            <div className="space-y-1">
              <Text size="sm" color="muted" weight="medium" className="text-xs">
                TIME SLOT
              </Text>
              <Text size="base" weight="semibold" className="text-sm sm:text-base">
                {destination.timeSlot.start_time}
                {' '}
                -
                {destination.timeSlot.end_time}
                {destination.timeSlot.slot_label && (
                  <>
                    {' '}
                    <span className="text-muted-foreground">
                      (
                      {destination.timeSlot.slot_label}
                      )
                    </span>
                  </>
                )}
              </Text>
            </div>
          )}

          {/* Description */}
          {destination.description && (
            <div className="space-y-1">
              <Text size="sm" color="muted" weight="medium" className="text-xs">
                DESCRIPTION
              </Text>
              <Text size="base" className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                {destination.description}
              </Text>
            </div>
          )}

          {/* Close Button */}
          <Button variant="outline" size="sm" onClick={onClose} className="w-full mt-4 gap-2 bg-transparent">
            <X size={16} />
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
