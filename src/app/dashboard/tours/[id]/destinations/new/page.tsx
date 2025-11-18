'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

const destinationSchema = yup.object({
  name: yup.string().required('Destination name is required'),
  date: yup.string().required('Date is required'),
  startTime: yup.string(),
  endTime: yup.string(),
  slotLabel: yup.string(),
  lat: yup.number().nullable(),
  lng: yup.number().nullable(),
  images: yup.string(),
  description: yup.string(),
});

type DestinationFormData = yup.InferType<typeof destinationSchema>;

export default function CreateDestinationPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<DestinationFormData>({
    resolver: yupResolver(destinationSchema),
    defaultValues: {
      name: '',
      date: '',
      startTime: '',
      endTime: '',
      slotLabel: '',
      lat: null,
      lng: null,
      images: '',
      description: '',
    },
  });

  const onSubmit = async (data: DestinationFormData) => {
    setError(null);
    setLoading(true);

    try {
      // Parse images from comma-separated string
      const images = data.images
        ? data.images.split(',').map((url) => url.trim()).filter(Boolean)
        : [];

      // Build time slot object if times are provided
      const timeSlot =
        data.startTime && data.endTime
          ? {
              start_time: data.startTime,
              end_time: data.endTime,
              slot_label: data.slotLabel || undefined,
            }
          : null;

      // Build coordinate object if lat/lng are provided
      const coordinate =
        data.lat !== null && data.lng !== null
          ? {
              lat: data.lat,
              lng: data.lng,
            }
          : null;

      const payload = {
        name: data.name,
        date: data.date,
        timeSlot,
        images,
        coordinate,
        description: data.description || null,
      };

      const response = await fetch(`/api/tours/${tourId}/destinations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create destination');
      }

      router.push(`/dashboard/tours/${tourId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create destination');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/tours/${tourId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="size-4" />
              Back to Tour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Add Destination</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Destination Information</CardTitle>
            <CardDescription>
              Fill in the details to add a new destination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Grand Canyon"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
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
                  name="slotLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Slot Label</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Morning, Afternoon, Evening"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="36.1069"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val ? parseFloat(val) : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="-112.1129"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val ? parseFloat(val) : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URLs</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Enter image URLs separated by commas
                      </p>
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
                          placeholder="Describe this destination..."
                          rows={4}
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

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creating...' : 'Add Destination'}
                  </Button>
                  <Link href={`/dashboard/tours/${tourId}`}>
                    <Button type="button" variant="outline">
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

