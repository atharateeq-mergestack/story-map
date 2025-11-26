'use client';

import { useRouter } from 'next/navigation';
import globalController from '@/store/globalController';

/**
 * Custom hook for navigation with loading state
 */
export function useNavigation() {
  const router = useRouter();

  const navigate = (href: string, options?: { message?: string }) => {
    globalController.startLoading(options?.message || 'Loading...');
    router.push(href);
  };

  const replace = (href: string, options?: { message?: string }) => {
    globalController.startLoading(options?.message || 'Loading...');
    router.replace(href);
  };

  return {
    navigate,
    replace,
    router,
  };
}
