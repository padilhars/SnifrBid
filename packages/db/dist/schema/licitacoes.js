import { pgTable, uuid, varchar, jsonb, timestamp, numeric, text, char, index, customType, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { portals, modalidades, ufs } from './portals.js';
// Custom type para tsvector (FTS)
const tsvector = customType({
    dataType() { return 'tsvector'; },
});
// Custom type para vector(768) do pgvector
const vector768 = customType({
    dataType() { return 'vector(768)'; },
    toDriver(value) { return `[${value.join(',')}]`; },
    fromDriver(value) {
        if (typeof value === 'string') {
            return value.slice(1, -1).split(',').map(Number);
        }
        return value;
    },
});
export const licitacoes = pgTable('licitacoes', {
    id: uuid('id').primaryKey().defaultRandom(),
    portalId: uuid('portal_id').notNull().references(() => portals.id),
    externalId: varchar('external_id', { length: 255 }).notNull(),
    modalidadeId: uuid('modalidade_id').references(() => modalidades.id),
    ufCode: char('uf_code', { length: 2 }).references(() => ufs.code),
    orgaoNome: varchar('orgao_nome', { length: 500 }),
    orgaoCnpj: varchar('orgao_cnpj', { length: 18 }),
    objeto: text('objeto').notNull(),
    valorEstimado: numeric('valor_estimado', { precision: 18, scale: 2 }),
    status: varchar('status', { length: 100 }),
    dataPublicacao: timestamp('data_publicacao', { withTimezone: true }),
    dataAbertura: timestamp('data_abertura', { withTimezone: true }),
    dataEncerramento: timestamp('data_encerramento', { withTimezone: true }),
    editalUrl: text('edital_url'),
    portalUrl: text('portal_url'),
    rawData: jsonb('raw_data').notNull().default({}),
    contentHash: varchar('content_hash', { length: 64 }),
    searchVector: tsvector('search_vector'),
    embedding: vector768('embedding'),
    collectedAt: timestamp('collected_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
    uniqPortalExternal: index('uniq_portal_external').on(t.portalId, t.externalId),
    idxPortal: index('idx_licitacoes_portal').on(t.portalId),
    idxUf: index('idx_licitacoes_uf').on(t.ufCode),
    idxDataPublicacao: index('idx_licitacoes_data_publicacao').on(t.dataPublicacao),
}));
export const licitacaoDocumentos = pgTable('licitacao_documentos', {
    id: uuid('id').primaryKey().defaultRandom(),
    licitacaoId: uuid('licitacao_id').notNull().references(() => licitacoes.id, { onDelete: 'cascade' }),
    tipo: varchar('tipo', { length: 100 }),
    nome: varchar('nome', { length: 500 }),
    url: text('url').notNull(),
    tamanhoBytes: numeric('tamanho_bytes'),
    mimeType: varchar('mime_type', { length: 100 }),
    contentHash: varchar('content_hash', { length: 64 }),
    downloadedAt: timestamp('downloaded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
// Relations
export const licitacoesRelations = relations(licitacoes, ({ one, many }) => ({
    portal: one(portals, { fields: [licitacoes.portalId], references: [portals.id] }),
    modalidade: one(modalidades, { fields: [licitacoes.modalidadeId], references: [modalidades.id] }),
    uf: one(ufs, { fields: [licitacoes.ufCode], references: [ufs.code] }),
    documentos: many(licitacaoDocumentos),
}));
export const licitacaoDocumentosRelations = relations(licitacaoDocumentos, ({ one }) => ({
    licitacao: one(licitacoes, { fields: [licitacaoDocumentos.licitacaoId], references: [licitacoes.id] }),
}));
//# sourceMappingURL=licitacoes.js.map