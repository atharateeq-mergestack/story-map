'use client';

import type { Destination } from '@/db/schema';
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
import { Textarea } from '@/components/ui/textarea';
import { useNavigation } from '@/hooks/useNavigation';

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

type EditDestinationFormProps = {
  destination: Destination;
  tourId: string;
};

export function EditDestinationForm({ destination, tourId }: EditDestinationFormProps) {
  const { navigate } = useNavigation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Format date for input using moment
  const date = destination.date
    ? moment(destination.date).format('YYYY-MM-DD')
    : '';

  // Format time slot
  const startTime = destination.timeSlot?.start_time || '';
  const endTime = destination.timeSlot?.end_time || '';
  const slotLabel = destination.timeSlot?.slot_label || '';

  // Format coordinates
  const lat = destination.coordinate?.lat || null;
  const lng = destination.coordinate?.lng || null;

  // Format images (join array with commas)
  const images = destination.images && Array.isArray(destination.images)
    ? destination.images.join(', ')
    : '';

  const form = useForm<DestinationFormData>({
    resolver: yupResolver(destinationSchema) as any,
    defaultValues: {
      name: destination.name || '',
      date,
      startTime,
      endTime,
      slotLabel,
      lat,
      lng,
      images,
      description: destination.description || '',
    },
  });

  const onSubmit = async (data: DestinationFormData) => {
    setError(null);
    setLoading(true);

    try {
      // Parse images from comma-separated string
      const images = data.images
        ? data.images.split(',').map(url => url.trim()).filter(Boolean)
        : [];

      // Build time slot object if times are provided
      const timeSlot
        = data.startTime && data.endTime
          ? {
              start_time: data.startTime,
              end_time: data.endTime,
              slot_label: data.slotLabel || undefined,
            }
          : null;

      // Build coordinate object if lat/lng are provided
      const coordinate
        = data.lat !== null && data.lng !== null
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

      const response = await fetch(`/api/destinations/${destination.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update destination');
      }

      navigate(`/dashboard/tours/${tourId}`, { message: 'Loading tour...' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update destination');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Destination Information</CardTitle>
        <CardDescription className="text-sm">
          Update the destination details
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
                    <DatePicker
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Select date"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          field.onChange(val ? Number.parseFloat(val) : null);
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
                          field.onChange(val ? Number.parseFloat(val) : null);
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
                    Enter image URLs separated by commas. Google Drive sharing links will be automatically converted.
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

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button type="submit" disabled={loading} className="flex-1 shadow-md hover:shadow-lg transition-all duration-300">
                {loading ? 'Updating...' : 'Update Destination'}
              </Button>
              <NavigationLink href={`/dashboard/tours/${tourId}`} message="Loading..." className="flex-1 sm:flex-none">
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

