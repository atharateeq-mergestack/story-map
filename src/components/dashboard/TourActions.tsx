'use client';

import { CheckCircleIcon, EyeIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type TourActionsProps = {
  tourId: string;
  currentStatus: 'active' | 'inactive';
  hasActiveTour: boolean;
};

export function TourActions({
  tourId,
  currentStatus,
  hasActiveTour,
}: TourActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Disable if another tour is active (not this one)
  const isDisabled = hasActiveTour && currentStatus !== 'active';

  const handleMarkAsActive = async () => {
    if (currentStatus === 'active' || isDisabled) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate tour');
      }

      router.refresh();
    } catch (error) {
      console.error('Error activating tour:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-end gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/dashboard/tours/${tourId}`}>
              <Button variant="outline" size="sm">
                <EyeIcon className="size-4" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>View tour details and destinations</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsActive}
              disabled={isDisabled || loading || currentStatus === 'active'}
            >
              <CheckCircleIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isDisabled
                ? 'Another tour is already active. Deactivate it first.'
                : currentStatus === 'active'
                  ? 'This tour is already active'
                  : 'Mark this tour as active'}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
