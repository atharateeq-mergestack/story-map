'use client';

import { CopyIcon, CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type CopyLinkButtonProps = {
  tourId: string;
  isActive: boolean;
};

export function CopyLinkButton({ tourId, isActive }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!isActive) {
      toast.error('Tour is inactive', {
        description: 'Only active tours can be shared with this link.',
      });
      return;
    }

    const link = `${window.location.origin}/tour/${tourId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            disabled={!isActive}
            className="shadow-md hover:shadow-lg transition-all duration-300"
          >
            {copied ? (
              <>
                <CheckIcon className="size-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="size-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isActive
              ? 'Copy shareable link for this tour'
              : 'Tour must be active to share'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

