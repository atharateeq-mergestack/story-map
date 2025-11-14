/**
 * Profiles Table Schema
 *
 * This table stores user profile information linked to Supabase Auth users.
 * The user_id references auth.users.id from Supabase Auth.
 */

import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  fullName: varchar('full_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
