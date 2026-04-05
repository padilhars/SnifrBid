import type { FastifyInstance } from 'fastify';
import { eq, and, count } from 'drizzle-orm';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { withTenantContext } from '../../plugins/tenant.js';
import { logAudit } from '../../services/audit.js';

export default async function interestRoutes(app: FastifyInstance) {
  // GET /interests
  app.get('/', { onRequest: [app.authenticate] }, async (req) => {
    return withTenantContext(req.currentUser.tenantId, req.currentUser.id, async () => {
      return getDb().query.interests.findMany({
        where: eq(schema.interests.tenantId, req.currentUser.tenantId),
        with: {
          modalidades: { with: { modalidade: true } },
          portals: { with: { portal: true } },
          ufs: true,
        },
        orderBy: (i, { desc }) => [desc(i.createdAt)],
      });
    });
  });

  // POST /interests
  app.post('/', {
    onRequest: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'keywordContexts'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 255 },
          keywordContexts: { type: 'array', minItems: 1 },
          modalidadeIds: { type: 'array', items: { type: 'string' } },
          portalIds: { type: 'array', items: { type: 'string' } },
          ufCodes: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  }, async (req, reply) => {
    const { name, keywordContexts, modalidadeIds = [], portalIds = [], ufCodes = [] } = req.body as {
      name: string;
      keywordContexts: Array<{ keyword: string; context: string }>;
      modalidadeIds?: string[];
      portalIds?: string[];
      ufCodes?: string[];
    };
    const db = getDb();

    // Verificar limite do plano
    const tenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.id, req.currentUser.tenantId),
      with: { plan: true },
    });
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    const [{ count: interestCount }] = await db.select({ count: count() })
      .from(schema.interests)
      .where(eq(schema.interests.tenantId, req.currentUser.tenantId));

    if (tenant.plan.maxInterests !== -1 && Number(interestCount) >= tenant.plan.maxInterests) {
      return reply.code(403).send({
        error: `Seu plano permite no máximo ${tenant.plan.maxInterests} interesse(s). Faça upgrade para adicionar mais.`,
      });
    }

    // Verificar limite de portais
    if (tenant.plan.maxPortals !== -1 && portalIds.length > tenant.plan.maxPortals) {
      return reply.code(403).send({
        error: `Seu plano permite no máximo ${tenant.plan.maxPortals} portal(is) por interesse.`,
      });
    }

    const [interest] = await db.insert(schema.interests).values({
      tenantId: req.currentUser.tenantId,
      name,
      keywordContexts,
    }).returning();

    if (modalidadeIds.length > 0) {
      await db.insert(schema.interestModalidades).values(
        modalidadeIds.map(id => ({ interestId: interest.id, modalidadeId: id })),
      );
    }
    if (portalIds.length > 0) {
      await db.insert(schema.interestPortals).values(
        portalIds.map(id => ({ interestId: interest.id, portalId: id })),
      );
    }
    if (ufCodes.length > 0) {
      await db.insert(schema.interestUfs).values(
        ufCodes.map(code => ({ interestId: interest.id, ufCode: code })),
      );
    }

    // Invalidar cache de filtros de coleta
    await getRedis().del('collection:filters:cache');

    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'interest_created', resourceType: 'interest', resourceId: interest.id });

    return reply.code(201).send(interest);
  });

  // PUT /interests/:id
  app.put('/:id', {
    onRequest: [app.authenticate],
    schema: {
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      name?: string;
      keywordContexts?: Array<{ keyword: string; context: string }>;
      modalidadeIds?: string[];
      portalIds?: string[];
      ufCodes?: string[];
    };
    const db = getDb();

    const interest = await db.query.interests.findFirst({
      where: and(eq(schema.interests.id, id), eq(schema.interests.tenantId, req.currentUser.tenantId)),
    });
    if (!interest) return reply.code(404).send({ error: 'Interesse não encontrado' });

    if (body.name !== undefined || body.keywordContexts !== undefined) {
      await db.update(schema.interests)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.keywordContexts !== undefined && { keywordContexts: body.keywordContexts }),
          updatedAt: new Date(),
        })
        .where(eq(schema.interests.id, id));
    }

    // Atualizar relações se fornecidas
    if (body.modalidadeIds !== undefined) {
      await db.delete(schema.interestModalidades).where(eq(schema.interestModalidades.interestId, id));
      if (body.modalidadeIds.length > 0) {
        await db.insert(schema.interestModalidades).values(
          body.modalidadeIds.map(mid => ({ interestId: id, modalidadeId: mid })),
        );
      }
    }
    if (body.portalIds !== undefined) {
      await db.delete(schema.interestPortals).where(eq(schema.interestPortals.interestId, id));
      if (body.portalIds.length > 0) {
        await db.insert(schema.interestPortals).values(
          body.portalIds.map(pid => ({ interestId: id, portalId: pid })),
        );
      }
    }
    if (body.ufCodes !== undefined) {
      await db.delete(schema.interestUfs).where(eq(schema.interestUfs.interestId, id));
      if (body.ufCodes.length > 0) {
        await db.insert(schema.interestUfs).values(
          body.ufCodes.map(code => ({ interestId: id, ufCode: code })),
        );
      }
    }

    await getRedis().del('collection:filters:cache');
    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'interest_updated', resourceType: 'interest', resourceId: id });

    return getDb().query.interests.findFirst({ where: eq(schema.interests.id, id) });
  });

  // DELETE /interests/:id
  app.delete('/:id', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = getDb();

    const interest = await db.query.interests.findFirst({
      where: and(eq(schema.interests.id, id), eq(schema.interests.tenantId, req.currentUser.tenantId)),
    });
    if (!interest) return reply.code(404).send({ error: 'Interesse não encontrado' });

    await db.delete(schema.interests).where(eq(schema.interests.id, id));
    await getRedis().del('collection:filters:cache');
    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'interest_deleted', resourceType: 'interest', resourceId: id });

    return reply.code(204).send();
  });

  // PATCH /interests/:id/toggle
  app.patch('/:id/toggle', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const db = getDb();

    const interest = await db.query.interests.findFirst({
      where: and(eq(schema.interests.id, id), eq(schema.interests.tenantId, req.currentUser.tenantId)),
    });
    if (!interest) return reply.code(404).send({ error: 'Interesse não encontrado' });

    const [updated] = await db.update(schema.interests)
      .set({ isActive: !interest.isActive, updatedAt: new Date() })
      .where(eq(schema.interests.id, id))
      .returning();

    await getRedis().del('collection:filters:cache');
    return updated;
  });
}
