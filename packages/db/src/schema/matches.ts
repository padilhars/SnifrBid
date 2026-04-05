import {
  pgTable, uuid, varchar, real, text, timestamp, integer,
  index, unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { licitacoes } from './licitacoes.js';
import { interests } from './interests.js';
import { tenants, users } from './tenants.js';

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  licitacaoId: uuid('licitacao_id').notNull().references(() => licitacoes.id, { onDelete: 'cascade' }),
  interestId: uuid('interest_id').notNull().references(() => interests.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  scoreTextual: real('score_textual'),
  scoreSemantico: real('score_semantico'),
  scoreFinal: real('score_final'),
  matchedKeywords: text('matched_keywords').array(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqLicitacaoInterest: unique().on(t.licitacaoId, t.interestId),
  idxTenant: index('idx_matches_tenant').on(t.tenantId),
  idxStatus: index('idx_matches_status').on(t.status),
  idxCreated: index('idx_matches_created').on(t.createdAt),
}));

export const matchUserWatchlist = pgTable('match_user_watchlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqUserMatch: unique().on(t.userId, t.matchId),
  idxUser: index('idx_watchlist_user').on(t.userId),
  idxWatchlistTenant: index('idx_watchlist_tenant').on(t.tenantId),
}));

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  modelUsed: varchar('model_used', { length: 100 }).notNull(),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  scoreAderencia: integer('score_aderencia'),
  nivelRisco: varchar('nivel_risco', { length: 20 }),
  complexidadeTecnica: varchar('complexidade_tecnica', { length: 20 }),
  estimativaChances: varchar('estimativa_chances', { length: 20 }),
  criterioJulgamento: varchar('criterio_julgamento', { length: 100 }),
  documentacaoExigida: text('documentacao_exigida').array(),
  requisitosTecnicos: text('requisitos_tecnicos').array(),
  pontosAtencao: text('pontos_atencao').array(),
  dataVisitaTecnica: timestamp('data_visita_tecnica', { withTimezone: true }),
  dataEntregaProposta: timestamp('data_entrega_proposta', { withTimezone: true }),
  dataAberturaProposta: timestamp('data_abertura_propostas', { withTimezone: true }),
  resumo: text('resumo'),
  analiseCompleta: text('analise_completa'),
  rawResponse: text('raw_response'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const matchesRelations = relations(matches, ({ one, many }) => ({
  licitacao: one(licitacoes, { fields: [matches.licitacaoId], references: [licitacoes.id] }),
  interest: one(interests, { fields: [matches.interestId], references: [interests.id] }),
  tenant: one(tenants, { fields: [matches.tenantId], references: [tenants.id] }),
  analyses: many(analyses),
  watchlist: many(matchUserWatchlist),
}));

export const matchUserWatchlistRelations = relations(matchUserWatchlist, ({ one }) => ({
  user: one(users, { fields: [matchUserWatchlist.userId], references: [users.id] }),
  match: one(matches, { fields: [matchUserWatchlist.matchId], references: [matches.id] }),
  tenant: one(tenants, { fields: [matchUserWatchlist.tenantId], references: [tenants.id] }),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  match: one(matches, { fields: [analyses.matchId], references: [matches.id] }),
  tenant: one(tenants, { fields: [analyses.tenantId], references: [tenants.id] }),
}));
