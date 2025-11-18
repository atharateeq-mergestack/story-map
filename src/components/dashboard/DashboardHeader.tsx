'use client';

import userController from '@/store/userController';

export function DashboardHeader() {
  const { user: profile } = userController.useState(['user']);

  return (
    <div className="space-y-2">
      <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back,
        {' '}
        {profile?.fullName || 'User'}
        !
      </p>
    </div>
  );
}
