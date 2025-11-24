'use server';

import moment from 'moment';
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

type GeoJSONFeature = {
  type: 'Feature';
  properties: {
    id?: number | string;
    Name?: string;
    Type?: string;
    Price?: number | null;
    Comment?: string | null;
    Lat?: number;
    Long?: number;
    Location?: string;
    Website?: string | null;
    Image_URL?: string | null;
    Day?: string;
    icon_url?: string | null;
    [key: string]: unknown;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
};

type GeoJSONFeatureCollection = {
  type: 'FeatureCollection';
  name?: string;
  features: GeoJSONFeature[];
};

type BulkUploadResult = {
  success: boolean;
  message: string;
  tourId?: string;
  destinationsCount?: number;
  error?: string;
};

/**
 * Server action to handle bulk CSV or GeoJSON upload for tours and destinations
 */
export async function bulkUploadTours(formData: FormData): Promise<BulkUploadResult> {
  try {
    const file = formData.get('file') as File | null;

    if (!file) {
      return {
        success: false,
        message: 'No file provided',
        error: 'Please select a CSV or GeoJSON file to upload',
      };
    }

    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    const isGeoJSON = file.type === 'application/geo+json'
      || file.type === 'application/json'
      || file.name.endsWith('.geojson');

    if (!isCSV && !isGeoJSON) {
      return {
        success: false,
        message: 'Invalid file type',
        error: 'Please upload a CSV or GeoJSON file',
      };
    }

    // Handle GeoJSON files
    if (isGeoJSON) {
      return await handleGeoJSONUpload(file);
    }

    // Read file content and parse CSV
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
    if (!firstRow) {
      return {
        success: false,
        message: 'Invalid CSV file',
        error: 'The CSV file does not contain valid data',
      };
    }
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
      timestamp: moment().toISOString(),
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

    if (!newTour) {
      return {
        success: false,
        message: 'Failed to create tour',
        error: 'Unable to create tour in database',
      };
    }

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

/**
 * Handle GeoJSON file upload
 */
async function handleGeoJSONUpload(file: File): Promise<BulkUploadResult> {
  try {
    // Read and parse GeoJSON
    const text = await file.text();
    let geoJSON: GeoJSONFeatureCollection;

    try {
      geoJSON = JSON.parse(text) as GeoJSONFeatureCollection;
    } catch {
      return {
        success: false,
        message: 'GeoJSON parsing error',
        error: 'Failed to parse GeoJSON file. Please ensure it is valid JSON.',
      };
    }

    // Validate GeoJSON structure
    if (geoJSON.type !== 'FeatureCollection' || !Array.isArray(geoJSON.features)) {
      return {
        success: false,
        message: 'Invalid GeoJSON structure',
        error: 'File must be a GeoJSON FeatureCollection',
      };
    }

    if (geoJSON.features.length === 0) {
      return {
        success: false,
        message: 'Empty GeoJSON file',
        error: 'The GeoJSON file contains no features',
      };
    }

    // Extract tour information
    const tourName = geoJSON.name?.trim()
      || geoJSON.features[0]?.properties?.Location?.trim()
      || 'Imported Tour';

    // Extract dates from features
    const dates = geoJSON.features
      .map(f => f.properties.Day)
      .filter((day): day is string => Boolean(day))
      .sort();

    const startDate = dates.length > 0 ? dates[0] : null;
    const endDate = dates.length > 0 ? dates[dates.length - 1] : null;

    // Extract locations from first and last features
    const locations = geoJSON.features
      .map(f => f.properties.Location)
      .filter((loc): loc is string => Boolean(loc));

    const startLocation = locations[0] || null;
    const endLocation = locations[locations.length - 1] || null;

    // Create history entry
    const historyEntry = {
      action: 'created',
      timestamp: moment().toISOString(),
      notes: 'Tour created via bulk upload from GeoJSON',
    };

    // Create tour
    const [newTour] = await db
      .insert(tours)
      .values({
        name: tourName,
        description: null,
        startDate: startDate || null,
        endDate: endDate || null,
        startLocation: startLocation || null,
        endLocation: endLocation || null,
        status: 'inactive',
        history: [historyEntry],
        metadata: {
          source: 'geojson',
          originalFileName: file.name,
        },
      })
      .returning();

    if (!newTour) {
      return {
        success: false,
        message: 'Failed to create tour',
        error: 'Unable to create tour in database',
      };
    }

    const tourId = newTour.id;

    // Process destinations from features
    const destinationValues = geoJSON.features
      .map((feature) => {
        const props = feature.properties;
        const name = props.Name?.trim();
        const day = props.Day?.trim();
        const comment = props.Comment?.trim() || null;
        const location = props.Location?.trim() || null;
        const type = props.Type?.trim() || null;
        const price = props.Price ?? null;
        const website = props.Website?.trim() || null;
        const imageUrl = props.Image_URL?.trim() || null;
        const iconUrl = props.icon_url?.trim() || null;

        // Skip features without required fields
        if (!name || !day) {
          return null;
        }

        // Extract coordinates from geometry (GeoJSON uses [lng, lat])
        let coordinate = null;
        if (feature.geometry?.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
          const [lng, lat] = feature.geometry.coordinates;
          if (typeof lng === 'number' && typeof lat === 'number'
            && !Number.isNaN(lng) && !Number.isNaN(lat)) {
            coordinate = { lat, lng };
          }
        }

        // Fallback to properties Lat/Long if geometry coordinates are not available
        if (!coordinate && props.Lat && props.Long) {
          const lat = Number.parseFloat(String(props.Lat));
          const lng = Number.parseFloat(String(props.Long));
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            coordinate = { lat, lng };
          }
        }

        // Build images array
        const images = imageUrl ? [imageUrl] : [];

        // Build metadata with additional properties
        const metadata: Record<string, unknown> = {
          type: type || undefined,
          location: location || undefined,
          website: website || undefined,
          iconUrl: iconUrl || undefined,
        };

        if (price !== null && price !== undefined) {
          metadata.price = price;
        }

        return {
          tourId,
          name,
          date: day,
          timeSlot: null,
          images,
          coordinate,
          description: comment,
          metadata,
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null);

    if (destinationValues.length === 0) {
      return {
        success: false,
        message: 'No valid destinations found',
        error: 'The GeoJSON file must contain at least one feature with Name and Day properties',
      };
    }

    // Insert all destinations
    const insertedDestinations = await db
      .insert(destinations)
      .values(destinationValues)
      .returning();

    return {
      success: true,
      message: `Successfully created tour "${tourName}" with ${insertedDestinations.length} destinations from GeoJSON`,
      tourId,
      destinationsCount: insertedDestinations.length,
    };
  } catch (error) {
    console.error('GeoJSON upload error:', error);
    return {
      success: false,
      message: 'GeoJSON upload failed',
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
