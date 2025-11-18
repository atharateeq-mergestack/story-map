/**
 * Authentication Hook
 *
 * React hook for managing authentication state and operations.
 * Uses userController for state management (hydrated from server-side).
 * All Supabase calls are made server-side via API routes.
 *
 * Usage:
 * ```tsx
 * const { user, signIn, signUp, signOut, loading } = useAuth();
 * ```
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import userController from '@/store/userController';

export function useAuth() {
  const router = useRouter();
  const { user, loading } = userController.useState(['user', 'loading']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signIn = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sign in');
      }

      // Refresh router to update server-side state and re-hydrate userController
      router.refresh();

      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sign up');
      }

      // After successful signup, sign in the user
      const signInResponse = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const signInResult = await signInResponse.json();

      if (!signInResponse.ok) {
        throw new Error(signInResult.error || 'Failed to sign in after signup');
      }

      // Refresh router to update server-side state and re-hydrate userController
      router.refresh();

      return signInResult;
    } finally {
      setIsSubmitting(false);
    }
  };

  const signOut = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to sign out');
      }

      // Clear user state in controller
      userController.updateState({ user: null, loading: false });

      // Redirect to landing page after sign out

      // router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    user,
    signIn,
    signUp,
    signOut,
    loading: loading || isSubmitting,
  };
}
