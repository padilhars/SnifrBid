import {
  pgTable, uuid, varchar, boolean, jsonb, integer, timestamp, text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, tenants } from './tenants.js';
import { matches } from './matches.js';
import { licitacoes } from './licitacoes.js';

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  telegramChatId: varchar('telegram_chat_id', { length: 100 }),
  telegramEnabled: boolean('telegram_enabled').notNull().default(false),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  webpushEnabled: boolean('webpush_enabled').notNull().default(false),
  webpushSubscription: jsonb('webpush_subscription'),
  notifyNewMatch: boolean('notify_new_match').notNull().default(true),
  notifyAnalysisComplete: boolean('notify_analysis_complete').notNull().default(true),
  notifyStatusChange: boolean('notify_status_change').notNull().default(true),
  notifyDeadlineAlert: boolean('notify_deadline_alert').notNull().default(true),
  deadlineAlertDays: integer('deadline_alert_days').notNull().default(3),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').references(() => users.id),
  matchId: uuid('match_id').references(() => matches.id),
  type: varchar('type', { length: 100 }).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(),
  title: varchar('title', { length: 500 }),
  body: text('body'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const licitacaoSnapshots = pgTable('licitacao_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  licitacaoId: uuid('licitacao_id').notNull().references(() => licitacoes.id, { onDelete: 'cascade' }),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  snapshot: jsonb('snapshot').notNull(),
  changesDetected: jsonb('changes_detected'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  tenant: one(tenants, { fields: [notifications.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  match: one(matches, { fields: [notifications.matchId], references: [matches.id] }),
}));

export const licitacaoSnapshotsRelations = relations(licitacaoSnapshots, ({ one }) => ({
  licitacao: one(licitacoes, { fields: [licitacaoSnapshots.licitacaoId], references: [licitacoes.id] }),
}));
