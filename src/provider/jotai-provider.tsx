'use client';

import { createStore, Provider } from 'jotai';
import * as React from 'react';

export const store = createStore();

export function JotaiProvider({ children }: React.PropsWithChildren) {
  return <Provider store={store}>{children}</Provider>;
}
