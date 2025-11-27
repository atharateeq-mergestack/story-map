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

      // If email confirmation is required, don't try to sign in
      if (result.requiresEmailConfirmation) {
        return {
          ...result,
          requiresEmailConfirmation: true,
        };
      }

      // After successful signup, sign in the user (only if email is already confirmed)
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
