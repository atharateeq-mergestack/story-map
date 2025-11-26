'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type TourStatusToggleProps = {
  tourId: string;
  currentStatus: 'active' | 'inactive';
};

export function TourStatusToggle({ tourId, currentStatus }: TourStatusToggleProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: 'active' | 'inactive') => {
    if (newStatus === status) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tour status');
      }

      setStatus(newStatus);
      router.refresh();
    } catch (error) {
      console.error('Error updating tour status:', error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = status === 'active';

  return (
    <div className="flex items-center gap-3">
      <Badge
        variant={isActive ? 'success' : 'secondary'}
        className="shadow-sm min-w-[80px] justify-center"
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => {
                  handleStatusChange(checked ? 'active' : 'inactive');
                }}
                disabled={loading}
                className="data-[state=checked]:bg-success"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isActive ? 'Deactivate tour' : 'Activate tour'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
