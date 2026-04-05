import type { FastifyInstance } from 'fastify';
import { eq, sql, count, gte, and, ilike } from 'drizzle-orm';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { logAudit } from '../../services/audit.js';

export default async function adminRoutes(app: FastifyInstance) {

  // Todas as rotas admin requerem system_admin
  app.addHook('onRequest', app.authenticate);
  app.addHook('onRequest', app.requireSystemAdmin);

  // GET /admin/metrics
  app.get('/metrics', async () => {
    const db = getDb();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [tenantsAtivos, analisesHoje, analisesSemana, analisesMes, licitacoesHoje] = await Promise.all([
      db.select({ count: count() }).from(schema.tenants).where(eq(schema.tenants.isActive, true)),
      db.select({ count: count() }).from(schema.analyses).where(gte(schema.analyses.createdAt, today)),
      db.select({ count: count() }).from(schema.analyses).where(gte(schema.analyses.createdAt, weekAgo)),
      db.select({ count: count() }).from(schema.analyses).where(gte(schema.analyses.createdAt, monthAgo)),
      db.select({ count: count() }).from(schema.licitacoes).where(gte(schema.licitacoes.collectedAt, today)),
    ]);

    return {
      tenantsAtivos: Number(tenantsAtivos[0].count),
      analisesHoje: Number(analisesHoje[0].count),
      analisesSemana: Number(analisesSemana[0].count),
      analisesMes: Number(analisesMes[0].count),
      licitacoesHoje: Number(licitacoesHoje[0].count),
      workers: [],
      alerts: [],
    };
  });

  // ─── PLANOS ──────────────────────────────────────────────────────────────────

  // GET /admin/plans
  app.get('/plans', async () => {
    return getDb().query.plans.findMany({ orderBy: (p, { asc }) => [asc(p.name)] });
  });

  // POST /admin/plans
  app.post('/plans', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          maxInterests: { type: 'number' },
          maxPortals: { type: 'number' },
          maxAnalysesPerMonth: { type: 'number' },
          maxUsers: { type: 'number' },
          priceWithPlatformAiBrl: { type: 'string' },
          priceWithOwnAiBrl: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, async (req, reply) => {
    const body = req.body as typeof schema.plans.$inferInsert;
    const [plan] = await getDb().insert(schema.plans).values(body).returning();
    return reply.code(201).send(plan);
  });

  // PUT /admin/plans/:id
  app.put('/plans/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<typeof schema.plans.$inferInsert>;
    const [updated] = await getDb().update(schema.plans)
      .set(body)
      .where(eq(schema.plans.id, id))
      .returning();
    if (!updated) return reply.code(404).send({ error: 'Plano não encontrado' });
    return updated;
  });

  // DELETE /admin/plans/:id
  app.delete('/plans/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const [deleted] = await getDb().delete(schema.plans).where(eq(schema.plans.id, id)).returning();
    if (!deleted) return reply.code(404).send({ error: 'Plano não encontrado' });
    return { ok: true };
  });

  // ─── TENANTS ─────────────────────────────────────────────────────────────────

  // GET /admin/tenants — com busca e paginação
  app.get('/tenants', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
        },
      },
    },
  }, async (req) => {
    const { search, page = 1, limit = 20 } = req.query as { search?: string; page?: number; limit?: number };
    const db = getDb();
    const offset = (page - 1) * limit;
    const where = search ? ilike(schema.tenants.name, `%${search}%`) : undefined;

    const [tenants, [{ total }]] = await Promise.all([
      db.query.tenants.findMany({
        where,
        with: { plan: true },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit,
        offset,
      }),
      db.select({ total: count() }).from(schema.tenants).where(where),
    ]);

    // Count users per tenant
    const tenantIds = tenants.map((t) => t.id);
    const userCounts = tenantIds.length > 0
      ? await db.select({ tenantId: schema.users.tenantId, cnt: count() })
          .from(schema.users)
          .where(and(eq(schema.users.isActive, true), sql`${schema.users.tenantId} = ANY(${sql.raw(`ARRAY[${tenantIds.map((id) => `'${id}'`).join(',')}]::uuid[]`)})` ))
          .groupBy(schema.users.tenantId)
      : [];
    const userCountMap = Object.fromEntries(userCounts.map((r) => [r.tenantId, Number(r.cnt)]));

    // Count interests per tenant
    const interestCounts = tenantIds.length > 0
      ? await db.select({ tenantId: schema.interests.tenantId, cnt: count() })
          .from(schema.interests)
          .where(sql`${schema.interests.tenantId} = ANY(${sql.raw(`ARRAY[${tenantIds.map((id) => `'${id}'`).join(',')}]::uuid[]`)})`)
          .groupBy(schema.interests.tenantId)
      : [];
    const interestCountMap = Object.fromEntries(interestCounts.map((r) => [r.tenantId, Number(r.cnt)]));

    // Count activated portals per tenant
    const portalCounts = tenantIds.length > 0
      ? await db.select({ tenantId: schema.tenantPortals.tenantId, cnt: count() })
          .from(schema.tenantPortals)
          .where(sql`${schema.tenantPortals.tenantId} = ANY(${sql.raw(`ARRAY[${tenantIds.map((id) => `'${id}'`).join(',')}]::uuid[]`)})`)
          .groupBy(schema.tenantPortals.tenantId)
      : [];
    const portalCountMap = Object.fromEntries(portalCounts.map((r) => [r.tenantId, Number(r.cnt)]));

    const data = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      cnpj: t.cnpj,
      slug: t.slug,
      planId: t.planId,
      planName: t.plan?.name ?? '—',
      usersCount: userCountMap[t.id] ?? 0,
      interestsCount: interestCountMap[t.id] ?? 0,
      portalsCount: portalCountMap[t.id] ?? 0,
      analysesUsed: t.analysesUsedThisMonth,
      maxAnalyses: t.plan?.maxAnalysesPerMonth ?? 0,
      aiSource: t.aiSource,
      currentPriceBrl: t.currentPriceBrl,
      isActive: t.isActive,
      createdAt: t.createdAt,
    }));

    return { data, total: Number(total) };
  });

  // POST /admin/tenants — criar novo tenant
  app.post('/tenants', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'planId', 'ownerName', 'ownerEmail', 'ownerPassword'],
        properties: {
          name: { type: 'string' },
          cnpj: { type: 'string' },
          planId: { type: 'string' },
          ownerName: { type: 'string' },
          ownerEmail: { type: 'string' },
          ownerPassword: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const body = req.body as {
      name: string; cnpj?: string; planId: string;
      ownerName: string; ownerEmail: string; ownerPassword: string;
    };
    const db = getDb();

    const plan = await db.query.plans.findFirst({ where: eq(schema.plans.id, body.planId) });
    if (!plan) return reply.code(400).send({ error: 'Plano inválido' });

    const slug = body.name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const price = body.planId ? plan.priceWithPlatformAiBrl : '0';

    const [tenant] = await db.insert(schema.tenants).values({
      name: body.name,
      cnpj: body.cnpj,
      slug: `${slug}-${Date.now()}`,
      planId: body.planId,
      currentPriceBrl: price,
    }).returning();

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(body.ownerPassword, 12);

    const [owner] = await db.insert(schema.users).values({
      tenantId: tenant.id,
      email: body.ownerEmail.toLowerCase(),
      passwordHash,
      name: body.ownerName,
      role: 'owner',
    }).returning({ id: schema.users.id, email: schema.users.email, name: schema.users.name });

    await db.insert(schema.notificationPreferences).values({ userId: owner.id });
    await logAudit({ userId: (req.user as unknown as { id: string }).id, action: 'admin_tenant_created', resourceType: 'tenant', resourceId: tenant.id });

    return reply.code(201).send({ tenant, owner });
  });

  // PATCH /admin/tenants/:id
  app.patch('/tenants/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { isActive?: boolean; planId?: string; name?: string; cnpj?: string };
    const db = getDb();

    const tenant = await db.query.tenants.findFirst({ where: eq(schema.tenants.id, id), with: { plan: true } });
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    let newPrice = tenant.currentPriceBrl;
    if (body.planId && body.planId !== tenant.planId) {
      const newPlan = await db.query.plans.findFirst({ where: eq(schema.plans.id, body.planId) });
      if (!newPlan) return reply.code(400).send({ error: 'Plano inválido' });
      newPrice = tenant.aiSource === 'own' ? newPlan.priceWithOwnAiBrl : newPlan.priceWithPlatformAiBrl;
    }

    const [updated] = await db.update(schema.tenants)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.cnpj !== undefined && { cnpj: body.cnpj }),
        ...(body.planId && { planId: body.planId, currentPriceBrl: newPrice }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(schema.tenants.id, id))
      .returning();

    await logAudit({ userId: (req.user as unknown as { id: string }).id, action: 'admin_tenant_updated', resourceType: 'tenant', resourceId: id });
    return updated;
  });

  // PUT /admin/tenants/:id
  app.put('/tenants/:id', {
    schema: {
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { planId?: string; isActive?: boolean; name?: string; cnpj?: string };
    const db = getDb();

    const tenant = await db.query.tenants.findFirst({ where: eq(schema.tenants.id, id), with: { plan: true } });
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    let newPrice = tenant.currentPriceBrl;
    if (body.planId && body.planId !== tenant.planId) {
      const newPlan = await db.query.plans.findFirst({ where: eq(schema.plans.id, body.planId) });
      if (!newPlan) return reply.code(400).send({ error: 'Plano inválido' });
      newPrice = tenant.aiSource === 'own' ? newPlan.priceWithOwnAiBrl : newPlan.priceWithPlatformAiBrl;
    }

    const [updated] = await db.update(schema.tenants)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.cnpj !== undefined && { cnpj: body.cnpj }),
        ...(body.planId && { planId: body.planId, currentPriceBrl: newPrice }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(schema.tenants.id, id))
      .returning();

    await logAudit({ userId: (req.user as unknown as { id: string }).id, action: 'admin_tenant_updated', resourceType: 'tenant', resourceId: id });
    return updated;
  });

  // ─── PORTAIS ─────────────────────────────────────────────────────────────────

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

  // PATCH /admin/portals/:id — atualização parcial (ex: toggle isActive)
  app.patch('/portals/:id', {
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

  // POST /admin/portals/:id/health — testa conectividade do portal
  app.post('/portals/:id/health', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const portal = await getDb().query.portals.findFirst({ where: eq(schema.portals.id, id) });
    if (!portal) return reply.code(404).send({ error: 'Portal não encontrado' });

    const start = Date.now();
    try {
      const res = await fetch(portal.baseUrl, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
      const latencyMs = Date.now() - start;
      const success = res.ok || res.status < 500;
      return { success, latencyMs };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // ─── MODALIDADES ─────────────────────────────────────────────────────────────

  // GET /admin/modalidades
  app.get('/modalidades', async () => {
    return getDb().query.modalidades.findMany({
      with: { portal: true },
      orderBy: (m, { asc }) => [asc(m.name)],
    });
  });

  // POST /admin/modalidades
  app.post('/modalidades', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'code', 'portalId'],
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          portalId: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, async (req, reply) => {
    const body = req.body as typeof schema.modalidades.$inferInsert;
    const [m] = await getDb().insert(schema.modalidades).values(body).returning();
    return reply.code(201).send(m);
  });

  // PUT /admin/modalidades/:id
  app.put('/modalidades/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<typeof schema.modalidades.$inferInsert>;
    const [updated] = await getDb().update(schema.modalidades)
      .set(body)
      .where(eq(schema.modalidades.id, id))
      .returning();
    if (!updated) return reply.code(404).send({ error: 'Modalidade não encontrada' });
    return updated;
  });

  // PATCH /admin/modalidades/:id
  app.patch('/modalidades/:id', {
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<typeof schema.modalidades.$inferInsert>;
    const [updated] = await getDb().update(schema.modalidades)
      .set(body)
      .where(eq(schema.modalidades.id, id))
      .returning();
    if (!updated) return reply.code(404).send({ error: 'Modalidade não encontrada' });
    return updated;
  });

  // ─── UFs ─────────────────────────────────────────────────────────────────────

  // GET /admin/ufs
  app.get('/ufs', async () => {
    return getDb().query.ufs.findMany({
      orderBy: (u, { asc }) => [asc(u.code)],
    });
  });

  // PUT /admin/ufs/:code
  app.put('/ufs/:code', {
    schema: { params: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] } },
  }, async (req, reply) => {
    const { code } = req.params as { code: string };
    const body = req.body as { name?: string };
    const [updated] = await getDb().update(schema.ufs)
      .set(body)
      .where(eq(schema.ufs.code, code))
      .returning();
    if (!updated) return reply.code(404).send({ error: 'UF não encontrada' });
    return updated;
  });

  // ─── STATS ───────────────────────────────────────────────────────────────────

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

  // ─── AI ──────────────────────────────────────────────────────────────────────

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

    if (body.apiKey) {
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

    await getRedis().del('ai:active_provider');
    await logAudit({ userId: (req.user as unknown as { id: string }).id, action: 'admin_ai_updated', resourceType: 'ai_provider', resourceId: id });
    return updated;
  });
}
