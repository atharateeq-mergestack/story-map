import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import moment from 'moment';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string (ISO format) or Date object to "DD MMM, YYYY" format (e.g., "15 DEC, 2024")
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  return moment(date).format('D MMM, YYYY').toUpperCase();
}
