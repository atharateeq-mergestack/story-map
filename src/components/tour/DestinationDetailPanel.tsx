'use client';

import { X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heading } from '@/components/ui/common/Heading';
import { Text } from '@/components/ui/common/Text';
import { formatDate } from '@/lib/utils';

type Destination = {
  id: string;
  name: string;
  date: string;
  timeSlot: {
    start_time: string;
    end_time: string;
    slot_label?: string;
  } | null;
  coordinate: { lat: number; lng: number } | null;
  description: string | null;
  images?: string[];
};

type DestinationDetailPanelProps = {
  destination: Destination;
  onClose: () => void;
};

export function DestinationDetailPanel({
  destination,
  onClose,
}: DestinationDetailPanelProps) {
  return (
    <div className="flex flex-col bg-background border rounded-lg shadow-lg" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        <Heading level={3} size="lg" weight="bold">
          Destination Details
        </Heading>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Name */}
        <div>
          <Heading level={2} size="2xl" weight="bold" className="mb-2">
            {destination.name}
          </Heading>
          <Text size="sm" color="muted">
            {formatDate(destination.date)}
          </Text>
        </div>

        {/* Time Slot */}
        {destination.timeSlot && (
          <Card>
            <CardHeader>
              <CardTitle>Time</CardTitle>
            </CardHeader>
            <CardContent>
              <Text>
                {destination.timeSlot.start_time}
                {' '}
                -
                {' '}
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
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {destination.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Text>{destination.description}</Text>
            </CardContent>
          </Card>
        )}

        {/* Images */}
        {destination.images && destination.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {destination.images.map(image => (
                  <div
                    key={image}
                    className="aspect-square rounded-lg overflow-hidden bg-muted relative"
                  >
                    <Image
                      src={image}
                      alt={`${destination.name}`}
                      fill
                      className="object-cover"
                      unoptimized={image.includes('drive.google.com')}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coordinates */}
        {destination.coordinate && (
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <Text size="sm" color="muted">
                Latitude:
                {' '}
                {destination.coordinate.lat.toFixed(6)}
              </Text>
              <Text size="sm" color="muted">
                Longitude:
                {' '}
                {destination.coordinate.lng.toFixed(6)}
              </Text>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t shrink-0">
        <Button onClick={onClose} className="w-full">
          Back to Overview
        </Button>
      </div>
    </div>
  );
}
