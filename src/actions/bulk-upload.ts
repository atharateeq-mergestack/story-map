'use server';

import Papa from 'papaparse';
import { db } from '@/db';
import { destinations, tours } from '@/db/schema';

type CSVRow = {
  tour_name?: string;
  tour_description?: string;
  start_date?: string;
  end_date?: string;
  start_location?: string;
  end_location?: string;
  destination_name?: string;
  destination_date?: string;
  start_time?: string;
  end_time?: string;
  slot_label?: string;
  images?: string;
  lat?: string;
  lng?: string;
  destination_description?: string;
};

type BulkUploadResult = {
  success: boolean;
  message: string;
  tourId?: string;
  destinationsCount?: number;
  error?: string;
};

/**
 * Server action to handle bulk CSV upload for tours and destinations
 */
export async function bulkUploadTours(formData: FormData): Promise<BulkUploadResult> {
  try {
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        message: 'No file provided',
        error: 'Please select a CSV file to upload',
      };
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return {
        success: false,
        message: 'Invalid file type',
        error: 'Please upload a CSV file',
      };
    }

    // Read file content
    const text = await file.text();

    // Parse CSV
    const parseResult = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        message: 'CSV parsing error',
        error: `Failed to parse CSV: ${parseResult.errors[0]?.message || 'Unknown error'}`,
      };
    }

    const rows = parseResult.data;

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Empty CSV file',
        error: 'The CSV file is empty',
      };
    }

    // Extract tour information from first row
    const firstRow = rows[0];
    const tourName = firstRow.tour_name?.trim();
    const tourDescription = firstRow.tour_description?.trim() || null;
    const startDate = firstRow.start_date?.trim() || null;
    const endDate = firstRow.end_date?.trim() || null;
    const startLocation = firstRow.start_location?.trim() || null;
    const endLocation = firstRow.end_location?.trim() || null;

    if (!tourName) {
      return {
        success: false,
        message: 'Missing tour name',
        error: 'Tour name is required in the CSV file',
      };
    }

    // Create history entry
    const historyEntry = {
      action: 'created',
      timestamp: new Date().toISOString(),
      notes: 'Tour created via bulk upload',
    };

    // Create tour
    const [newTour] = await db
      .insert(tours)
      .values({
        name: tourName,
        description: tourDescription,
        startDate: startDate || null,
        endDate: endDate || null,
        startLocation: startLocation || null,
        endLocation: endLocation || null,
        status: 'inactive',
        history: [historyEntry],
        metadata: {},
      })
      .returning();

    const tourId = newTour.id;

    // Process destinations from all rows
    const destinationValues = rows
      .map((row) => {
        const destinationName = row.destination_name?.trim();
        const destinationDate = row.destination_date?.trim();
        const startTime = row.start_time?.trim();
        const endTime = row.end_time?.trim();
        const slotLabel = row.slot_label?.trim();
        const imagesStr = row.images?.trim() || '';
        const latStr = row.lat?.trim();
        const lngStr = row.lng?.trim();
        const description = row.destination_description?.trim() || null;

        // Skip rows without required fields
        if (!destinationName || !destinationDate) {
          return null;
        }

        // Parse images (split by |)
        const images = imagesStr
          ? imagesStr.split('|').map(url => url.trim()).filter(Boolean)
          : [];

        // Parse coordinates
        let coordinate = null;
        if (latStr && lngStr) {
          const lat = Number.parseFloat(latStr);
          const lng = Number.parseFloat(lngStr);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            coordinate = { lat, lng };
          }
        }

        // Build time slot object if times are provided
        const timeSlot
          = startTime && endTime
            ? {
                start_time: startTime,
                end_time: endTime,
                slot_label: slotLabel || undefined,
              }
            : null;

        return {
          tourId,
          name: destinationName,
          date: destinationDate,
          timeSlot,
          images,
          coordinate,
          description,
          metadata: {},
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null);

    if (destinationValues.length === 0) {
      return {
        success: false,
        message: 'No valid destinations found',
        error: 'The CSV file must contain at least one destination with name and date',
      };
    }

    // Insert all destinations
    const insertedDestinations = await db
      .insert(destinations)
      .values(destinationValues)
      .returning();

    return {
      success: true,
      message: `Successfully created tour "${tourName}" with ${insertedDestinations.length} destinations`,
      tourId,
      destinationsCount: insertedDestinations.length,
    };
  } catch (error) {
    console.error('Bulk upload error:', error);
    return {
      success: false,
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
