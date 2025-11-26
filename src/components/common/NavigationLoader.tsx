'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import globalController from '@/store/globalController';

/**
 * Component that automatically stops loading when navigation completes
 * This should be placed in the root layout
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Stop loading when pathname changes (navigation completed)
    if (pathname && previousPathname.current !== pathname) {
      // Small delay to ensure the page has rendered
      const timer = setTimeout(() => {
        globalController.stopLoading();
      }, 100);

      previousPathname.current = pathname;

      return () => {
        clearTimeout(timer);
      };
    }
  }, [pathname]);

  return null;
}
