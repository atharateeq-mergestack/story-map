import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/auth/SignInForm';
import { ThemeToggleButton } from '@/components/ui/theme/ThemeToggleButton';
import { isAuthenticated } from '@/lib/supabase/server-auth';

export default async function LoginPage() {
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sign In</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Enter your credentials to access your account
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
