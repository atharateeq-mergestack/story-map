import { ProfileForm } from '@/components/profile/ProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your account settings and profile information
          </p>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
            <CardDescription className="text-sm">
              Update your profile details below
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ProfileForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
