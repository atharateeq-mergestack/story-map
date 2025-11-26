/**
 * Drizzle Kit Configuration
 *
 * This file configures Drizzle ORM to connect to your Supabase Postgres database.
 *
 * To get your DATABASE_URL:
 * 1. Go to your Supabase project dashboard
 * 2. Navigate to Settings > Database
 * 3. Copy the "Connection string" under "Connection pooling"
 * 4. Replace [YOUR-PASSWORD] with your database password
 *
 * Format: postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    // Connection pool settings for migrations
    // Use transaction mode for better connection management
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  },
  // Use a single connection for migrations to avoid pool issues
  verbose: true,
  strict: true,
} satisfies Config;
