/**
 * Signup Page (/auth/signup)
 *
 * Public page - only accessible when NOT logged in.
 * If user is logged in, redirects to /dashboard.
 */

import { redirect } from 'next/navigation';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { isAuthenticated } from '@/lib/supabase/server-auth';

export default async function SignUpPage() {
  // Check if user is authenticated
  const authenticated = await isAuthenticated();

  // If logged in, redirect to dashboard
  if (authenticated) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Sign up to get started with your account
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
