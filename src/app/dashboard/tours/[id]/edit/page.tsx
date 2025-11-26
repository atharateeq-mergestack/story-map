'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowLeftIcon } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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

export default function EditTourPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const form = useForm<TourFormData>({
    resolver: yupResolver(tourSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      startLocation: '',
      endLocation: '',
      status: 'inactive',
    },
  });

  useEffect(() => {
    async function fetchTour() {
      try {
        const response = await fetch(`/api/tours/${tourId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tour');
        }
        const data = await response.json();
        const tour = data.tour;

        // Format dates for input using moment
        const startDate = tour.startDate
          ? moment(tour.startDate).format('YYYY-MM-DD')
          : '';
        const endDate = tour.endDate
          ? moment(tour.endDate).format('YYYY-MM-DD')
          : '';

        form.reset({
          name: tour.name || '',
          description: tour.description || '',
          startDate,
          endDate,
          startLocation: tour.startLocation || '',
          endLocation: tour.endLocation || '',
          status: tour.status || 'inactive',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tour');
      } finally {
        setFetching(false);
      }
    }

    fetchTour();
  }, [tourId, form]);

  const onSubmit = async (data: TourFormData) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/tours/${tourId}`, {
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

      router.push(`/dashboard/tours/${tourId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tour');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading tour...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link href={`/dashboard/tours/${tourId}`}>
            <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-all duration-300 text-xs sm:text-sm w-full sm:w-auto">
              <ArrowLeftIcon className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
              Back to Tour
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Edit Tour</h1>
        </div>

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
                  <Link href={`/dashboard/tours/${tourId}`} className="flex-1 sm:flex-none">
                    <Button type="button" variant="outline" className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
