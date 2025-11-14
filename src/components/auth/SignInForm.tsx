/**
 * Sign In Form Component
 *
 * Login form with React Hook Form + Yup validation.
 * Uses shadcn/ui components and reusable InputField.
 */

'use client';

import type { SignInFormData } from '@/lib/validations/signin.schema';
import { yupResolver } from '@hookform/resolvers/yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { signInSchema } from '@/lib/validations/signin.schema';

export function SignInForm() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignInFormData>({
    resolver: yupResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setError(null);

    try {
      await signIn(data.email, data.password);
      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please try again.');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?
              {' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
