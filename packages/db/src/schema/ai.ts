import {
  pgTable, uuid, varchar, boolean, jsonb, text, timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const aiProviders = pgTable('ai_providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 50 }).unique().notNull(),
  apiBaseUrl: varchar('api_base_url', { length: 255 }),
  modelDefault: varchar('model_default', { length: 100 }).notNull(),
  modelsAvailable: text('models_available').array().notNull().default([]),
  isActive: boolean('is_active').notNull().default(false),
  isDefault: boolean('is_default').notNull().default(false),
  config: jsonb('config').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const aiProviderCredentials = pgTable('ai_provider_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  providerId: uuid('provider_id').notNull().references(() => aiProviders.id, { onDelete: 'cascade' }),
  apiKeyEncrypted: text('api_key_encrypted').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastTestedAt: timestamp('last_tested_at', { withTimezone: true }),
  lastTestStatus: varchar('last_test_status', { length: 20 }),
  lastTestError: text('last_test_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const aiProvidersRelations = relations(aiProviders, ({ many }) => ({
  credentials: many(aiProviderCredentials),
}));

export const aiProviderCredentialsRelations = relations(aiProviderCredentials, ({ one }) => ({
  provider: one(aiProviders, {
    fields: [aiProviderCredentials.providerId],
    references: [aiProviders.id],
  }),
}));
