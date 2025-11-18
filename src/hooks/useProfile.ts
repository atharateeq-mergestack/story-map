'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import userController from '@/store/userController';

export function useProfile() {
  const router = useRouter();
  const { user: profile, loading } = userController.useState(['user', 'loading']);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateProfile = async (updates: { fullName?: string; email?: string }) => {
    if (!profile) {
      throw new Error('Not authenticated');
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use userController's updateProfile method which calls the API
      await userController.updateProfile(updates);

      // Refresh router to update server-side state
      router.refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshProfile = async () => {
    // Refresh router to re-fetch server-side data and re-hydrate userController
    router.refresh();
  };

  return {
    profile,
    loading: loading || isSubmitting,
    error,
    updateProfile,
    refreshProfile,
  };
}
