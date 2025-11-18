'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface TourStatusToggleProps {
  tourId: string;
  currentStatus: 'active' | 'inactive';
}

export function TourStatusToggle({ tourId, currentStatus }: TourStatusToggleProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: 'active' | 'inactive') => {
    if (newStatus === status) return;

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
      alert('Failed to update tour status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={status === 'active' ? 'default' : 'secondary'}
      >
        {status}
      </Badge>
      <Select
        value={status}
        onValueChange={(value) => handleStatusChange(value as 'active' | 'inactive')}
        disabled={loading}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="active">Active</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

