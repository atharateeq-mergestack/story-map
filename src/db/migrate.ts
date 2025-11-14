/**
 * Migration Runner
 *
 * This file can be used to run migrations programmatically.
 *
 * Usage:
 * ```ts
 * import { migrate } from '@/db/migrate';
 * await migrate();
 * ```
 *
 * Or use Drizzle Kit CLI commands:
 * - npm run db:generate - Generate migration files
 * - npm run db:migrate - Run migrations
 * - npm run db:push - Push schema changes directly (dev only)
 * - npm run db:studio - Open Drizzle Studio
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { Env } from '@/libs/Env';

async function runMigrations() {
  const connectionString = Env.DATABASE_URL;
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.warn('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.warn('Migrations completed!');

  await sql.end();
}

// Run if called directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { runMigrations as migrate };
