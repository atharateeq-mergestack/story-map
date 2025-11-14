/**
 * Profile Page (/profile)
 * 
 * Protected page - only accessible when logged in.
 * If user is not logged in, redirects to /.
 */

import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase/server-auth';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage() {
  // Check if user is authenticated
  const user = await getServerUser();
  
  // If not logged in, redirect to landing page
  if (!user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information
          </p>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

