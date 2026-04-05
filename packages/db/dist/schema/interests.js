import { pgTable, uuid, varchar, boolean, jsonb, timestamp, primaryKey, char, index, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenants.js';
import { portals, modalidades, ufs } from './portals.js';
export const interests = pgTable('interests', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    keywordContexts: jsonb('keyword_contexts').notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
    idxKeywords: index('idx_interests_keywords').on(t.keywordContexts),
}));
export const interestModalidades = pgTable('interest_modalidades', {
    interestId: uuid('interest_id').notNull().references(() => interests.id, { onDelete: 'cascade' }),
    modalidadeId: uuid('modalidade_id').notNull().references(() => modalidades.id),
}, (t) => ({
    pk: primaryKey({ columns: [t.interestId, t.modalidadeId] }),
}));
export const interestPortals = pgTable('interest_portals', {
    interestId: uuid('interest_id').notNull().references(() => interests.id, { onDelete: 'cascade' }),
    portalId: uuid('portal_id').notNull().references(() => portals.id),
}, (t) => ({
    pk: primaryKey({ columns: [t.interestId, t.portalId] }),
}));
export const interestUfs = pgTable('interest_ufs', {
    interestId: uuid('interest_id').notNull().references(() => interests.id, { onDelete: 'cascade' }),
    ufCode: char('uf_code', { length: 2 }).notNull().references(() => ufs.code),
}, (t) => ({
    pk: primaryKey({ columns: [t.interestId, t.ufCode] }),
}));
// Relations
export const interestsRelations = relations(interests, ({ one, many }) => ({
    tenant: one(tenants, { fields: [interests.tenantId], references: [tenants.id] }),
    modalidades: many(interestModalidades),
    portals: many(interestPortals),
    ufs: many(interestUfs),
}));
export const interestModalidadesRelations = relations(interestModalidades, ({ one }) => ({
    interest: one(interests, { fields: [interestModalidades.interestId], references: [interests.id] }),
    modalidade: one(modalidades, { fields: [interestModalidades.modalidadeId], references: [modalidades.id] }),
}));
export const interestPortalsRelations = relations(interestPortals, ({ one }) => ({
    interest: one(interests, { fields: [interestPortals.interestId], references: [interests.id] }),
    portal: one(portals, { fields: [interestPortals.portalId], references: [portals.id] }),
}));
export const interestUfsRelations = relations(interestUfs, ({ one }) => ({
    interest: one(interests, { fields: [interestUfs.interestId], references: [interests.id] }),
    uf: one(ufs, { fields: [interestUfs.ufCode], references: [ufs.code] }),
}));
//# sourceMappingURL=interests.js.map