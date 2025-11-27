import { redirect } from 'next/navigation';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { ThemeToggleButton } from '@/components/ui/theme/ThemeToggleButton';
import { isAuthenticated } from '@/lib/supabase/server-auth';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function SignUpPage() {
  // Check if user is authenticated
  const authenticated = await isAuthenticated();

  // If logged in, redirect to dashboard
  if (authenticated) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted p-4 sm:p-6">
      <ThemeToggleButton />
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Sign up to get started with your account
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
