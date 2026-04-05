import type { FastifyInstance } from 'fastify';
import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { logAudit } from '../../services/audit.js';

export default async function adminRoutes(app: FastifyInstance) {

  // Todas as rotas admin requerem system_admin
  app.addHook('onRequest', app.authenticate);
  app.addHook('onRequest', app.requireSystemAdmin);

  // GET /admin/tenants
  app.get('/tenants', async () => {
    return getDb().query.tenants.findMany({
      with: { plan: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  });

  // PUT /admin/tenants/:id
  app.put('/tenants/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as {
      planId?: string;
      isActive?: boolean;
    };
    const db = getDb();

    const tenant = await db.query.tenants.findFirst({ where: eq(schema.tenants.id, id), with: { plan: true } });
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    // Se mudou o plano, recalcular preço
    let newPrice = tenant.currentPriceBrl;
    if (body.planId && body.planId !== tenant.planId) {
      const newPlan = await db.query.plans.findFirst({ where: eq(schema.plans.id, body.planId) });
      if (!newPlan) return reply.code(400).send({ error: 'Plano inválido' });
      newPrice = tenant.aiSource === 'own'
        ? newPlan.priceWithOwnAiBrl
        : newPlan.priceWithPlatformAiBrl;
    }

    const [updated] = await db.update(schema.tenants)
      .set({
        ...(body.planId && { planId: body.planId, currentPriceBrl: newPrice }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(schema.tenants.id, id))
      .returning();

    await logAudit({ userId: (req.user as unknown as { id: string }).id, action: 'admin_tenant_updated', resourceType: 'tenant', resourceId: id });
    return updated;
  });

  // GET /admin/portals
  app.get('/portals', async () => {
    return getDb().query.portals.findMany({
      with: { modalidades: true },
      orderBy: (p, { asc }) => [asc(p.name)],
    });
  });

  // POST /admin/portals
  app.post('/portals', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'slug', 'adapterKey', 'baseUrl'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          adapterKey: { type: 'string' },
          baseUrl: { type: 'string' },
          config: { type: 'object' },
        },
      },
    },
  }, async (req, reply) => {
    const body = req.body as typeof schema.portals.$inferInsert;
    const [portal] = await getDb().insert(schema.portals).values(body).returning();
    return reply.code(201).send(portal);
  });

  // PUT /admin/portals/:id
  app.put('/portals/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<typeof schema.portals.$inferInsert>;
    const [updated] = await getDb().update(schema.portals)
      .set(body)
      .where(eq(schema.portals.id, id))
      .returning();
    if (!updated) return reply.code(404).send({ error: 'Portal não encontrado' });
    return updated;
  });

  // GET /admin/stats
  app.get('/stats', async () => {
    const db = getDb();
    const [tenants, portals, providers] = await Promise.all([
      db.query.tenants.findMany({ where: eq(schema.tenants.isActive, true) }),
      db.query.portals.findMany(),
      db.query.aiProviders.findMany(),
    ]);

    return {
      tenants: tenants.length,
      portals: portals.length,
      aiProviders: providers.filter(p => p.isActive).length,
    };
  });

  // GET /admin/ai — listar provedores de IA
  app.get('/ai', async () => {
    return getDb().query.aiProviders.findMany({
      with: { credentials: true },
      orderBy: (p, { asc }) => [asc(p.name)],
    });
  });

  // PUT /admin/ai/:id — configurar provedor de IA
  app.put('/ai/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      body: {
        type: 'object',
        properties: {
          isActive: { type: 'boolean' },
          isDefault: { type: 'boolean' },
          modelDefault: { type: 'string' },
          apiKey: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { isActive?: boolean; isDefault?: boolean; modelDefault?: string; apiKey?: string };
    const db = getDb();

    const provider = await db.query.aiProviders.findFirst({ where: eq(schema.aiProviders.id, id) });
    if (!provider) return reply.code(404).send({ error: 'Provedor não encontrado' });

    // Ao definir como default, remover default dos outros
    if (body.isDefault) {
      await db.update(schema.aiProviders).set({ isDefault: false });
    }

    const [updated] = await db.update(schema.aiProviders)
      .set({
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.modelDefault && { modelDefault: body.modelDefault }),
        updatedAt: new Date(),
      })
      .where(eq(schema.aiProviders.id, id))
      .returning();

    // Salvar API key criptografada se fornecida
    if (body.apiKey) {
      // SEGURANÇA: pgp_sym_encrypt garante que a chave nunca é armazenada em plaintext
      const [encrypted] = await db.execute<{ key: string }>(
        sql`SELECT encode(pgp_sym_encrypt(${body.apiKey}, ${process.env.AI_ENCRYPTION_KEY!}), 'base64') as key`,
      );

      await db.insert(schema.aiProviderCredentials)
        .values({ providerId: id, apiKeyEncrypted: encrypted.key })
        .onConflictDoUpdate({
          target: [schema.aiProviderCredentials.providerId],
          set: { apiKeyEncrypted: encrypted.key, updatedAt: new Date() },
        });
    }

    // Invalidar cache do provedor ativo
    await getRedis().del('ai:active_provider');

    await logAudit({ userId: (req.user as unknown as { id: string }).id, action: 'admin_ai_updated', resourceType: 'ai_provider', resourceId: id });
    return updated;
  });
}
