'use client';

import type { Tour } from '@/db/schema';
import { yupResolver } from '@hookform/resolvers/yup';
import moment from 'moment';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NavigationLink } from '@/components/ui/navigation-link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useNavigation } from '@/hooks/useNavigation';

const tourSchema = yup.object({
  name: yup.string().required('Tour name is required'),
  description: yup.string(),
  startDate: yup.string(),
  endDate: yup.string(),
  startLocation: yup.string(),
  endLocation: yup.string(),
  status: yup.string().oneOf(['active', 'inactive']).default('inactive'),
});

type TourFormData = yup.InferType<typeof tourSchema>;

type EditTourFormProps = {
  tour: Tour;
};

export function EditTourForm({ tour }: EditTourFormProps) {
  const { navigate } = useNavigation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Format dates for input using moment
  const startDate = tour.startDate
    ? moment(tour.startDate).format('YYYY-MM-DD')
    : '';
  const endDate = tour.endDate
    ? moment(tour.endDate).format('YYYY-MM-DD')
    : '';

  const form = useForm<TourFormData>({
    resolver: yupResolver(tourSchema) as any,
    defaultValues: {
      name: tour.name || '',
      description: tour.description || '',
      startDate,
      endDate,
      startLocation: tour.startLocation || '',
      endLocation: tour.endLocation || '',
      status: tour.status || 'inactive',
    },
  });

  const onSubmit = async (data: TourFormData) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/tours/${tour.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tour');
      }

      navigate(`/dashboard/tours/${tour.id}`, { message: 'Loading tour...' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <CardTitle className="mt-4">Tour Information</CardTitle>
        <CardDescription>
          Update the tour details
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tour Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Summer Adventure Tour"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your tour..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Select start date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Select end date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="New York"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Los Angeles"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button type="submit" disabled={loading} className="flex-1 shadow-md hover:shadow-lg transition-all duration-300">
                {loading ? 'Updating...' : 'Update Tour'}
              </Button>
              <NavigationLink href={`/dashboard/tours/${tour.id}`} message="Loading..." className="flex-1 sm:flex-none">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </NavigationLink>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
