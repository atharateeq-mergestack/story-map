'use client';

import { TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type DestinationActionsProps = {
  destinationId: string;
  destinationName: string;
};

export function DestinationActions({
  destinationId,
  destinationName,
}: DestinationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/destinations/${destinationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete destination');
      }

      toast.success('Destination deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting destination:', error);
      toast.error('Failed to delete destination', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={loading}
            >
              <TrashIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete this destination</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Destination"
        description={`Are you sure you want to delete "${destinationName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}

