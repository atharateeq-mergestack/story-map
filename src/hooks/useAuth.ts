/**
 * Authentication Hook
 *
 * React hook for managing authentication state and operations.
 *
 * Usage:
 * ```tsx
 * const { user, session, signIn, signUp, signOut, loading } = useAuth();
 * ```
 */

'use client';

import type { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = getBrowserClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
    return data;
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // Create profile after signup
    if (data.user) {
      try {
        const response = await fetch('/api/profiles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.user.id,
            email,
            fullName,
          }),
        });

        if (!response.ok) {
          console.error('Failed to create profile');
        }
      } catch (err) {
        console.error('Error creating profile:', err);
      }
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
  };
}
