import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Env } from '@/libs/Env';
import * as schema from './schema';

// Create the connection string
const connectionString = Env.DATABASE_URL;

// Create the postgres client
// For serverless environments, we disable prepared statements
// Set max connections to prevent pool exhaustion
const client = postgres(connectionString, {
  prepare: false,
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create the Drizzle database instance
export const db = drizzle(client, { schema });

// Export schema for convenience
export { schema };
