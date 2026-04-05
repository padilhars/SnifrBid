import { pgTable, uuid, varchar, boolean, jsonb, char, unique, timestamp, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.js';
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
export const tenantPortals = pgTable('tenant_portals', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    portalId: uuid('portal_id').notNull().references(() => portals.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
    uniqTenantPortal: unique().on(t.tenantId, t.portalId),
}));
export const tenantUfs = pgTable('tenant_ufs', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    ufCode: char('uf_code', { length: 2 }).notNull().references(() => ufs.code, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
    uniqTenantUf: unique().on(t.tenantId, t.ufCode),
}));
// Relations
export const portalsRelations = relations(portals, ({ many }) => ({
    modalidades: many(modalidades),
    tenantPortals: many(tenantPortals),
}));
export const modalidadesRelations = relations(modalidades, ({ one }) => ({
    portal: one(portals, { fields: [modalidades.portalId], references: [portals.id] }),
}));
export const tenantPortalsRelations = relations(tenantPortals, ({ one }) => ({
    tenant: one(tenants, { fields: [tenantPortals.tenantId], references: [tenants.id] }),
    portal: one(portals, { fields: [tenantPortals.portalId], references: [portals.id] }),
}));
export const tenantUfsRelations = relations(tenantUfs, ({ one }) => ({
    tenant: one(tenants, { fields: [tenantUfs.tenantId], references: [tenants.id] }),
    uf: one(ufs, { fields: [tenantUfs.ufCode], references: [ufs.code] }),
}));
//# sourceMappingURL=portals.js.map