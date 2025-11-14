/**
 * Protected Layout Component
 * 
 * Wrapper for protected pages that includes navigation.
 * Only renders navigation when user is authenticated.
 */

'use client';

import { Navigation } from './Navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to landing page if not authenticated (client-side check)
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Show loading state or nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">{children}</main>
    </div>
  );
}

