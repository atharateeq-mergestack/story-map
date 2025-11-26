/**
 * Profile Form Component
 *
 * Profile editing form with React Hook Form + Yup validation.
 * Uses shadcn/ui components.
 */

'use client';

import type { ProfileFormData } from '@/lib/validations/profile.schema';
import { yupResolver } from '@hookform/resolvers/yup';
import * as React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { profileSchema } from '@/lib/validations/profile.schema';

export function ProfileForm() {
  const { profile, loading, error, updateProfile } = useProfile();

  const form = useForm<ProfileFormData>({
    // @ts-expect-error - yup resolver type mismatch with optional fields
    resolver: yupResolver(profileSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  });

  // Sync form with profile data
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName || '',
        email: profile.email || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile({
        fullName: data.fullName || undefined,
        email: data.email,
      });
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading profile...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading profile:
          {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert>
        <AlertDescription>No profile found</AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      {/* @ts-expect-error - React Hook Form type mismatch */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control as any}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}
