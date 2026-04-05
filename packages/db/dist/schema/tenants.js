import { pgTable, uuid, varchar, boolean, jsonb, integer, timestamp, numeric, inet, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
export const plans = pgTable('plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 50 }).unique().notNull(),
    maxInterests: integer('max_interests').notNull().default(3),
    maxPortals: integer('max_portals').notNull().default(1),
    maxAnalysesPerMonth: integer('max_analyses_per_month').notNull().default(50),
    maxUsers: integer('max_users').notNull().default(1),
    priceWithPlatformAiBrl: numeric('price_with_platform_ai_brl', { precision: 10, scale: 2 }).notNull().default('0'),
    priceWithOwnAiBrl: numeric('price_with_own_ai_brl', { precision: 10, scale: 2 }).notNull().default('0'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    cnpj: varchar('cnpj', { length: 18 }),
    slug: varchar('slug', { length: 100 }).unique().notNull(),
    planId: uuid('plan_id').notNull().references(() => plans.id),
    isActive: boolean('is_active').notNull().default(true),
    analysesUsedThisMonth: integer('analyses_used_this_month').notNull().default(0),
    analysesResetAt: timestamp('analyses_reset_at', { withTimezone: true }).notNull().defaultNow(),
    currentPriceBrl: numeric('current_price_brl', { precision: 10, scale: 2 }).notNull().default('0'),
    aiSource: varchar('ai_source', { length: 20 }).notNull().default('platform'),
    settings: jsonb('settings').notNull().default({}),
    aiConfig: jsonb('ai_config'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('member'),
    isActive: boolean('is_active').notNull().default(true),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const refreshTokens = pgTable('refresh_tokens', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }),
    resourceId: uuid('resource_id'),
    metadata: jsonb('metadata').default({}),
    ipAddress: inet('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// Relations
export const plansRelations = relations(plans, ({ many }) => ({
    tenants: many(tenants),
}));
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
    plan: one(plans, { fields: [tenants.planId], references: [plans.id] }),
    users: many(users),
}));
export const usersRelations = relations(users, ({ one, many }) => ({
    tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
    refreshTokens: many(refreshTokens),
}));
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
    user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));
//# sourceMappingURL=tenants.js.map