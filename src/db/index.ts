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
