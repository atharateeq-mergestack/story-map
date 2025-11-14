/**
 * Drizzle Database Connection
 *
 * This file provides the Drizzle database client for both frontend and backend.
 *
 * Usage in API routes:
 * ```ts
 * import { db } from '@/db';
 * const profiles = await db.select().from(profilesTable);
 * ```
 *
 * Usage in Server Components:
 * ```ts
 * import { db } from '@/db';
 * const profile = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));
 * ```
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Env } from '@/libs/Env';
import * as schema from './schema';

// Create the connection string
const connectionString = Env.DATABASE_URL;

// Create the postgres client
// For serverless environments, we disable prepared statements
const client = postgres(connectionString, {
  prepare: false,
});

// Create the Drizzle database instance
export const db = drizzle(client, { schema });

// Export schema for convenience
export { schema };
