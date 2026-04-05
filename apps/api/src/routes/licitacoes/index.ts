import type { FastifyInstance } from 'fastify';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getDb, schema } from '@snifrbid/db';
import { withTenantContext } from '../../plugins/tenant.js';
import { logAudit } from '../../services/audit.js';

export default async function licitacoesRoutes(app: FastifyInstance) {

  // ⚠️ ATENÇÃO: /favorites DEVE ser registrada ANTES de /:id
  // GET /licitacoes/favorites — lista favoritos pessoais do usuário autenticado
  app.get('/favorites', { onRequest: [app.authenticate] }, async (req) => {
    return withTenantContext(req.currentUser.tenantId, req.currentUser.id, async () => {
      const watchlist = await getDb().query.matchUserWatchlist.findMany({
        where: eq(schema.matchUserWatchlist.userId, req.currentUser.id),
        with: {
          match: {
            with: {
              licitacao: { with: { portal: true, modalidade: true } },
              analyses: { limit: 1, orderBy: (a, { desc }) => [desc(a.createdAt)] },
            },
          },
        },
        orderBy: (w, { desc }) => [desc(w.addedAt)],
      });
      return watchlist.map(w => w.match);
    });
  });

  // GET /licitacoes — lista com filtros
  app.get('/', { onRequest: [app.authenticate] }, async (req) => {
    const query = req.query as {
      status?: string;
      portalId?: string;
      ufCode?: string;
      modalidadeId?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, parseInt(query.page ?? '1'));
    const limit = Math.min(100, parseInt(query.limit ?? '24'));
    const offset = (page - 1) * limit;

    return withTenantContext(req.currentUser.tenantId, req.currentUser.id, async () => {
      const db = getDb();

      const matches = await db.query.matches.findMany({
        where: and(
          eq(schema.matches.tenantId, req.currentUser.tenantId),
          ...(query.status ? [eq(schema.matches.status, query.status)] : []),
        ),
        with: {
          licitacao: {
            with: { portal: true, modalidade: true },
          },
          analyses: {
            limit: 1,
            orderBy: (a, { desc }) => [desc(a.createdAt)],
          },
        },
        orderBy: [desc(schema.matches.createdAt)],
        limit,
        offset,
      });

      return { data: matches, page, limit };
    });
  });

  // GET /licitacoes/:id — detalhes + documentos + análise
  app.get('/:id', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };

    return withTenantContext(req.currentUser.tenantId, req.currentUser.id, async () => {
      const match = await getDb().query.matches.findFirst({
        where: and(eq(schema.matches.id, id), eq(schema.matches.tenantId, req.currentUser.tenantId)),
        with: {
          licitacao: { with: { portal: true, modalidade: true, documentos: true } },
          analyses: { orderBy: (a, { desc }) => [desc(a.createdAt)] },
          interest: true,
        },
      });

      if (!match) return reply.code(404).send({ error: 'Licitação não encontrada' });

      // Verificar se o usuário favoritou
      const watchlistEntry = await getDb().query.matchUserWatchlist.findFirst({
        where: and(
          eq(schema.matchUserWatchlist.matchId, id),
          eq(schema.matchUserWatchlist.userId, req.currentUser.id),
        ),
      });

      return { ...match, isFavorited: !!watchlistEntry };
    });
  });

  // GET /licitacoes/:id/analysis
  app.get('/:id/analysis', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const match = await getDb().query.matches.findFirst({
      where: and(eq(schema.matches.id, id), eq(schema.matches.tenantId, req.currentUser.tenantId)),
      with: { analyses: { orderBy: (a, { desc }) => [desc(a.createdAt)], limit: 1 } },
    });

    if (!match) return reply.code(404).send({ error: 'Match não encontrado' });
    return match.analyses[0] ?? reply.code(404).send({ error: 'Análise ainda não disponível' });
  });

  // POST /licitacoes/:id/dismiss — dispensar (escopo tenant)
  app.post('/:id/dismiss', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await updateMatchStatus(id, req.currentUser.tenantId, 'dismissed', reply);
    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'match_dismissed', resourceType: 'match', resourceId: id, ipAddress: req.ip });
    return { ok: true };
  });

  // POST /licitacoes/:id/participar — marcar como participando (escopo tenant)
  app.post('/:id/participar', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await updateMatchStatus(id, req.currentUser.tenantId, 'participando', reply);
    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'match_participando', resourceType: 'match', resourceId: id, ipAddress: req.ip });
    return { ok: true };
  });

  // DELETE /licitacoes/:id/participar — desmarcar participação (escopo tenant)
  app.delete('/:id/participar', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await updateMatchStatus(id, req.currentUser.tenantId, 'analyzed', reply);
    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'match_participando_removed', resourceType: 'match', resourceId: id, ipAddress: req.ip });
    return { ok: true };
  });

  // POST /licitacoes/:id/favorite — adicionar favorito (escopo usuário)
  app.post('/:id/favorite', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = getDb();

    const match = await db.query.matches.findFirst({
      where: and(eq(schema.matches.id, id), eq(schema.matches.tenantId, req.currentUser.tenantId)),
    });
    if (!match) return reply.code(404).send({ error: 'Match não encontrado' });

    await db.insert(schema.matchUserWatchlist)
      .values({ userId: req.currentUser.id, matchId: id, tenantId: req.currentUser.tenantId })
      .onConflictDoNothing();

    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'favorited', resourceType: 'match', resourceId: id, ipAddress: req.ip });
    return { ok: true };
  });

  // DELETE /licitacoes/:id/favorite — remover favorito (escopo usuário)
  app.delete('/:id/favorite', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };

    await getDb().delete(schema.matchUserWatchlist)
      .where(and(
        eq(schema.matchUserWatchlist.matchId, id),
        eq(schema.matchUserWatchlist.userId, req.currentUser.id),
      ));

    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'unfavorited', resourceType: 'match', resourceId: id, ipAddress: req.ip });
    return { ok: true };
  });
}

async function updateMatchStatus(
  matchId: string,
  tenantId: string,
  status: string,
  reply: { code: (n: number) => { send: (b: unknown) => unknown } },
) {
  const db = getDb();
  const match = await db.query.matches.findFirst({
    where: and(eq(schema.matches.id, matchId), eq(schema.matches.tenantId, tenantId)),
  });
  if (!match) return reply.code(404).send({ error: 'Match não encontrado' });

  await db.update(schema.matches)
    .set({ status })
    .where(eq(schema.matches.id, matchId));
}
