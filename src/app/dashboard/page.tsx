/**
 * Dashboard Page (/dashboard)
 *
 * Protected page - only accessible when logged in.
 * If user is not logged in, redirects to /.
 */

import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerUser } from '@/lib/supabase/server-auth';

export default async function DashboardPage() {
  // Check if user is authenticated
  const user = await getServerUser();

  // If not logged in, redirect to landing page
  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back,
            {' '}
            {user.email}
            !
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Your dashboard is being prepared. Check back soon for exciting features!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="text-6xl">🚀</div>
                <p className="text-lg text-muted-foreground">
                  We're working on something amazing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
