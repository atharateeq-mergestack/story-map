import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggleButton } from '@/components/ui/theme/ThemeToggleButton';
import { isAuthenticated } from '@/lib/supabase/server-auth';

export default async function LandingPage() {
  // Check if user is authenticated
  const authenticated = await isAuthenticated();

  // If logged in, redirect to dashboard
  if (authenticated) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-background to-muted p-4 sm:p-6 md:p-8">
      <ThemeToggleButton />
      <div className="w-full max-w-4xl space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Welcome to Tour Map
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Your all-in-one platform for productivity and collaboration.
            Get started today and experience the future of work.
          </p>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 px-4">
          <Card className="py-4">
            <CardHeader>
              <CardTitle>Secure</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="py-4">
            <CardHeader>
              <CardTitle>Fast</CardTitle>
              <CardDescription>
                Lightning-fast performance for all your workflows
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="py-4">
            <CardHeader>
              <CardTitle>Reliable</CardTitle>
              <CardDescription>
                Built for scale with 99.9% uptime guarantee
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
