import { date, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const tourStatusEnum = pgEnum('tour_status', ['active', 'inactive']);

export const tours = pgTable('tours', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  startLocation: varchar('start_location', { length: 255 }),
  endLocation: varchar('end_location', { length: 255 }),
  status: tourStatusEnum('status').notNull().default('inactive'),
  history: jsonb('history').$type<Array<{
    action: string;
    timestamp: string;
    notes?: string;
    performed_by?: string;
  }>>().default([]),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Tour = typeof tours.$inferSelect;
export type NewTour = typeof tours.$inferInsert;
