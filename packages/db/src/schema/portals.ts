import {
  pgTable, uuid, varchar, boolean, jsonb, char, unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const portals = pgTable('portals', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  adapterKey: varchar('adapter_key', { length: 50 }).notNull(),
  baseUrl: varchar('base_url', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  config: jsonb('config').notNull().default({}),
  createdAt: varchar('created_at', { length: 50 }).notNull().default('now()'),
});

export const modalidades = pgTable('modalidades', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  portalId: uuid('portal_id').notNull().references(() => portals.id),
  isActive: boolean('is_active').notNull().default(true),
}, (t) => ({
  uniqCodePortal: unique().on(t.code, t.portalId),
}));

export const ufs = pgTable('ufs', {
  code: char('code', { length: 2 }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
});

// Relations
export const portalsRelations = relations(portals, ({ many }) => ({
  modalidades: many(modalidades),
}));

export const modalidadesRelations = relations(modalidades, ({ one }) => ({
  portal: one(portals, { fields: [modalidades.portalId], references: [portals.id] }),
}));
