'use client';

import type { PropsWithChildren } from 'react';
import { JotaiProvider } from './jotai-provider';

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <JotaiProvider>
      {children}
    </JotaiProvider>
  );
};
