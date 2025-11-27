'use client';

import { CheckCircleIcon, EyeIcon, TrashIcon, XCircleIcon } from 'lucide-react';
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
import { useNavigation } from '@/hooks/useNavigation';

type TourActionsProps = {
  tourId: string;
  currentStatus: 'active' | 'inactive';
  activeTourId: string | null;
};

export function TourActions({
  tourId,
  currentStatus,
  activeTourId,
}: TourActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const { navigate } = useNavigation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const isActive = currentStatus === 'active';
  const isThisTourActive = activeTourId === tourId;
  const hasActiveTour = activeTourId !== null;

  // Disable activate button if another tour is active (not this one)
  const canActivate = !hasActiveTour || isThisTourActive;
  // Only show deactivate button for the active tour
  const canDeactivate = isThisTourActive;

  const handleActivate = async () => {
    if (isActive || !canActivate) {
      return;
    }

    setLoading('activate');
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate tour');
      }

      toast.success('Tour activated successfully');
      router.refresh();
    } catch (error) {
      console.error('Error activating tour:', error);
      toast.error('Failed to activate tour', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDeactivate = async () => {
    if (!isActive || !canDeactivate) {
      return;
    }

    setLoading('deactivate');
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'inactive' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deactivate tour');
      }

      toast.success('Tour deactivated successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deactivating tour:', error);
      toast.error('Failed to deactivate tour', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading('delete');
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tour');
      }

      toast.success('Tour deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting tour:', error);
      toast.error('Failed to delete tour', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <TooltipProvider>
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading !== null} onClick={() => navigate(`/dashboard/tours/${tourId}`)}>
                <EyeIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View tour details and destinations</p>
            </TooltipContent>
          </Tooltip>

          {canDeactivate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeactivateDialogOpen(true)}
                  disabled={loading !== null}
                >
                  <XCircleIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Deactivate this tour</p>
              </TooltipContent>
            </Tooltip>
          )}

          {!isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivateDialogOpen(true)}
                  disabled={!canActivate || loading !== null}
                >
                  <CheckCircleIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {!canActivate
                    ? 'Another tour is already active. Deactivate it first.'
                    : 'Mark this tour as active'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading !== null}
              >
                <TrashIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete this tour</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Tour"
        description="Are you sure you want to delete this tour? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        loading={loading === 'delete'}
      />

      <ConfirmationDialog
        open={activateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        title="Activate Tour"
        description="This will activate this tour and deactivate any currently active tour. Do you want to continue?"
        confirmText="Activate"
        cancelText="Cancel"
        onConfirm={handleActivate}
        loading={loading === 'activate'}
      />

      <ConfirmationDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        title="Deactivate Tour"
        description="Are you sure you want to deactivate this tour? You can activate it again later."
        confirmText="Deactivate"
        cancelText="Cancel"
        onConfirm={handleDeactivate}
        loading={loading === 'deactivate'}
      />
    </>
  );
}
