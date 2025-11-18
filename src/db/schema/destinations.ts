import { pgTable, timestamp, uuid, varchar, text, date, jsonb } from 'drizzle-orm/pg-core';
import { tours } from './tours';

export const destinations = pgTable('destinations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tourId: uuid('tour_id').notNull().references(() => tours.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  timeSlot: jsonb('time_slot').$type<{
    start_time: string;
    end_time: string;
    slot_label?: string;
  }>(),
  images: jsonb('images').$type<string[]>().default([]),
  coordinate: jsonb('coordinate').$type<{
    lat: number;
    lng: number;
  }>(),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  limits: jsonb('limits').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Destination = typeof destinations.$inferSelect;
export type NewDestination = typeof destinations.$inferInsert;

