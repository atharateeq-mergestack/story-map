'use client';

import { Loader2 } from 'lucide-react';
import globalController from '@/store/globalController';

export function LoaderOverlay() {
  const { isLoading, loadingMessage } = globalController.useState(['isLoading', 'loadingMessage']);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        {loadingMessage && (
          <p className="text-sm font-medium text-foreground">{loadingMessage}</p>
        )}
      </div>
    </div>
  );
}
