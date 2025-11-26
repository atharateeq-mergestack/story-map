'use client';

import type { PropsWithChildren } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ui/theme/ThemeProvider';
import { JotaiProvider } from './jotai-provider';

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <JotaiProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </JotaiProvider>
  );
};
