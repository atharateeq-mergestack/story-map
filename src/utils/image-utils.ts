/* eslint-disable node/prefer-global/buffer */
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Check if a URL is a Google Drive sharing link
 */
export async function isGoogleDriveLink(url: string): Promise<boolean> {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes('drive.google.com')
      || urlObj.hostname.includes('docs.google.com')
    );
  } catch {
    return false;
  }
}

/**
 * Convert Google Drive sharing link to direct download link
 */
export async function convertGoogleDriveLink(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);

    // Handle different Google Drive link formats
    if (urlObj.hostname.includes('drive.google.com')) {
      // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
      const fileIdMatch = url.match(/\/d\/([\w-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      }

      // Format: https://drive.google.com/open?id=FILE_ID
      const openIdMatch = url.match(/[?&]id=([\w-]+)/);
      if (openIdMatch && openIdMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${openIdMatch[1]}`;
      }
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Download image from URL (including Google Drive)
 */
export async function downloadImage(url: string): Promise<Buffer> {
  try {
    // Convert Google Drive link if needed
    const isDriveLink = await isGoogleDriveLink(url);
    const downloadUrl = isDriveLink ? await convertGoogleDriveLink(url) : url;

    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(`Error downloading image from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadImageToSupabase(
  buffer: Buffer,
  fileName: string,
  folder: string = 'destinations',
): Promise<string> {
  try {
    const fileExt = fileName.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueFileName = `${folder}/${timestamp}-${randomString}.${fileExt}`;

    const { error } = await supabaseAdmin.storage
      .from('images')
      .upload(uniqueFileName, buffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(uniqueFileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    return urlData.publicUrl;
  } catch (error) {
    throw new Error(`Error uploading image to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process image URLs: download from Google Drive and upload to Supabase if needed
 */
export async function processImageUrls(
  imageUrls: string[],
  folder: string = 'destinations',
): Promise<string[]> {
  const processedUrls: string[] = [];

  for (const url of imageUrls) {
    if (!url || !url.trim()) {
      continue;
    }

    try {
      // Check if it's a Google Drive link
      const isDriveLink = await isGoogleDriveLink(url);
      if (isDriveLink) {
        // Download and upload to Supabase
        const buffer = await downloadImage(url);
        const fileName = url.split('/').pop() || `image-${Date.now()}.jpg`;
        const supabaseUrl = await uploadImageToSupabase(buffer, fileName, folder);
        processedUrls.push(supabaseUrl);
      } else {
        // Keep original URL if not Google Drive
        processedUrls.push(url.trim());
      }
    } catch (error) {
      console.error(`Failed to process image URL ${url}:`, error);
      // Continue with other images even if one fails
      // Optionally, you could keep the original URL as fallback
      // processedUrls.push(url.trim());
    }
  }

  return processedUrls;
}
