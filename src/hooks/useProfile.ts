/**
 * Profile Hook
 * 
 * React hook for managing user profile data.
 * 
 * Usage:
 * ```tsx
 * const { profile, loading, error, updateProfile, refreshProfile } = useProfile();
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Profile } from '@/db/schema';

export function useProfile() {
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user || !session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/profiles', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: { fullName?: string; email?: string }) => {
      if (!user || !session) {
        throw new Error('Not authenticated');
      }

      try {
        setError(null);

        const response = await fetch(`/api/profiles/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update profile');
        }

        const data = await response.json();
        setProfile(data.profile);
        return data.profile;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      }
    },
    [user, session],
  );

  const refreshProfile = useCallback(() => {
    return fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };
}

