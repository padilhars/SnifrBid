import type { FastifyInstance } from 'fastify';
import { eq, and, count } from 'drizzle-orm';
import { getDb, schema } from '@snifrbid/db';
import { logAudit } from '../../services/audit.js';

export default async function tenantRoutes(app: FastifyInstance) {

  // GET /tenants/portals — lista portais ativos globais (para interesse form)
  app.get('/portals', { onRequest: [app.authenticate] }, async (req) => {
    const db = getDb();
    // System admin vê todos; tenant vê os que ativou (ou todos se não tiver nenhum ativado)
    if (req.currentUser.role === 'system_admin') {
      return db.query.portals.findMany({
        where: eq(schema.portals.isActive, true),
        orderBy: (p, { asc }) => [asc(p.name)],
      });
    }
    const activated = await db.query.tenantPortals.findMany({
      where: eq(schema.tenantPortals.tenantId, req.currentUser.tenantId),
      with: { portal: true },
    });
    if (activated.length > 0) {
      return activated.map((tp) => tp.portal).filter((p) => p.isActive);
    }
    // Fallback: mostra todos os portais ativos se tenant não ativou nenhum
    return db.query.portals.findMany({
      where: eq(schema.portals.isActive, true),
      orderBy: (p, { asc }) => [asc(p.name)],
    });
  });

  // GET /tenants/modalidades — lista modalidades (para qualquer usuário autenticado)
  app.get('/modalidades', { onRequest: [app.authenticate] }, async () => {
    return getDb().query.modalidades.findMany({
      orderBy: (m, { asc }) => [asc(m.name)],
    });
  });

  // GET /tenants/ufs — lista UFs (para qualquer usuário autenticado)
  app.get('/ufs', { onRequest: [app.authenticate] }, async () => {
    return getDb().query.ufs.findMany({
      orderBy: (u, { asc }) => [asc(u.code)],
    });
  });

  // GET /tenants/plans — lista planos disponíveis (para tenant admin visualizar)
  app.get('/plans', { onRequest: [app.authenticate] }, async () => {
    return getDb().query.plans.findMany({
      where: eq(schema.plans.isActive, true),
      orderBy: (p, { asc }) => [asc(p.priceWithPlatformAiBrl)],
    });
  });

  // GET /tenants/me — dados do tenant do usuário autenticado
  app.get('/me', { onRequest: [app.authenticate] }, async (req, reply) => {
    const tenant = await getDb().query.tenants.findFirst({
      where: eq(schema.tenants.id, req.currentUser.tenantId),
      with: { plan: true },
    });
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });
    return tenant;
  });

  // POST /tenants/change-plan — trocar plano
  app.post('/change-plan', {
    onRequest: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['planId'],
        properties: { planId: { type: 'string' } },
      },
    },
  }, async (req, reply) => {
    if (!['owner', 'system_admin'].includes(req.currentUser.role)) {
      return reply.code(403).send({ error: 'Apenas o proprietário pode trocar de plano' });
    }
    const { planId } = req.body as { planId: string };
    const db = getDb();

    const [tenant, plan] = await Promise.all([
      db.query.tenants.findFirst({ where: eq(schema.tenants.id, req.currentUser.tenantId) }),
      db.query.plans.findFirst({ where: eq(schema.plans.id, planId) }),
    ]);
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });
    if (!plan) return reply.code(400).send({ error: 'Plano inválido' });

    const newPrice = tenant.aiSource === 'own' ? plan.priceWithOwnAiBrl : plan.priceWithPlatformAiBrl;

    const [updated] = await db.update(schema.tenants)
      .set({ planId, currentPriceBrl: newPrice, updatedAt: new Date() })
      .where(eq(schema.tenants.id, req.currentUser.tenantId))
      .returning();

    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'plan_changed', resourceType: 'tenant', resourceId: req.currentUser.tenantId });
    return updated;
  });

  // ─── PORTAIS DO TENANT ───────────────────────────────────────────────────────

  // GET /tenants/activated-portals
  app.get('/activated-portals', { onRequest: [app.authenticate] }, async (req) => {
    return getDb().query.tenantPortals.findMany({
      where: eq(schema.tenantPortals.tenantId, req.currentUser.tenantId),
      with: { portal: { with: { modalidades: true } } },
    });
  });

  // GET /tenants/available-portals — todos os portais ativos globais (para página de ativação)
  app.get('/available-portals', { onRequest: [app.authenticate] }, async () => {
    return getDb().query.portals.findMany({
      where: eq(schema.portals.isActive, true),
      with: { modalidades: { where: eq(schema.modalidades.isActive, true) } },
      orderBy: (p, { asc }) => [asc(p.name)],
    });
  });

  // POST /tenants/portals/:id/toggle — ativar/desativar portal para o tenant
  app.post('/portals/:id/toggle', {
    onRequest: [app.authenticate],
    schema: {
      params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      body: { type: 'object', additionalProperties: true },
    },
  }, async (req, reply) => {
    if (!['owner', 'admin', 'system_admin'].includes(req.currentUser.role)) {
      return reply.code(403).send({ error: 'Sem permissão' });
    }
    const { id } = req.params as { id: string };
    const db = getDb();

    const portal = await db.query.portals.findFirst({ where: eq(schema.portals.id, id) });
    if (!portal) return reply.code(404).send({ error: 'Portal não encontrado' });

    const existing = await db.query.tenantPortals.findFirst({
      where: and(
        eq(schema.tenantPortals.tenantId, req.currentUser.tenantId),
        eq(schema.tenantPortals.portalId, id),
      ),
    });

    if (existing) {
      // Desativar
      await db.delete(schema.tenantPortals)
        .where(and(
          eq(schema.tenantPortals.tenantId, req.currentUser.tenantId),
          eq(schema.tenantPortals.portalId, id),
        ));
      return { active: false };
    }

    // Verificar limite do plano (não se for system_admin)
    if (req.currentUser.role !== 'system_admin') {
      const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.id, req.currentUser.tenantId),
        with: { plan: true },
      });
      if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

      const [{ cnt }] = await db.select({ cnt: count() })
        .from(schema.tenantPortals)
        .where(eq(schema.tenantPortals.tenantId, req.currentUser.tenantId));

      if (tenant.plan.maxPortals !== -1 && Number(cnt) >= tenant.plan.maxPortals) {
        return reply.code(403).send({
          error: `Seu plano permite no máximo ${tenant.plan.maxPortals} portal(is). Faça upgrade para ativar mais.`,
        });
      }
    }

    // Ativar
    await db.insert(schema.tenantPortals).values({
      tenantId: req.currentUser.tenantId,
      portalId: id,
    });
    return { active: true };
  });

  // ─── UFs DO TENANT ───────────────────────────────────────────────────────────

  // GET /tenants/activated-ufs
  app.get('/activated-ufs', { onRequest: [app.authenticate] }, async (req) => {
    return getDb().query.tenantUfs.findMany({
      where: eq(schema.tenantUfs.tenantId, req.currentUser.tenantId),
      with: { uf: true },
    });
  });

  // POST /tenants/ufs/:code/toggle
  app.post('/ufs/:code/toggle', {
    onRequest: [app.authenticate],
    schema: {
      params: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
      body: { type: 'object', additionalProperties: true },
    },
  }, async (req, reply) => {
    if (!['owner', 'admin', 'system_admin'].includes(req.currentUser.role)) {
      return reply.code(403).send({ error: 'Sem permissão' });
    }
    const { code } = req.params as { code: string };
    const db = getDb();

    const existing = await db.query.tenantUfs.findFirst({
      where: and(
        eq(schema.tenantUfs.tenantId, req.currentUser.tenantId),
        eq(schema.tenantUfs.ufCode, code),
      ),
    });

    if (existing) {
      await db.delete(schema.tenantUfs)
        .where(and(
          eq(schema.tenantUfs.tenantId, req.currentUser.tenantId),
          eq(schema.tenantUfs.ufCode, code),
        ));
      return { active: false };
    }

    await db.insert(schema.tenantUfs).values({
      tenantId: req.currentUser.tenantId,
      ufCode: code,
    });
    return { active: true };
  });

  // ─── USUÁRIOS DO TENANT ──────────────────────────────────────────────────────

  // GET /tenants/users — lista usuários do tenant
  app.get('/users', { onRequest: [app.authenticate] }, async (req) => {
    return getDb().query.users.findMany({
      where: eq(schema.users.tenantId, req.currentUser.tenantId),
      columns: { passwordHash: false },
      orderBy: (u, { asc }) => [asc(u.name)],
    });
  });

  // POST /tenants/users/invite — convidar usuário
  app.post('/users/invite', {
    onRequest: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['email', 'name', 'role', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2 },
          role: { type: 'string', enum: ['admin', 'member'] },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
  }, async (req, reply) => {
    const body = req.body as { email: string; name: string; role: string; password: string };
    const db = getDb();

    if (!['owner', 'admin', 'system_admin'].includes(req.currentUser.role)) {
      return reply.code(403).send({ error: 'Sem permissão para convidar usuários' });
    }

    // Verificar limite do plano (exceto system_admin)
    if (req.currentUser.role !== 'system_admin') {
      const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.id, req.currentUser.tenantId),
        with: { plan: true },
      });
      if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

      const [{ cnt }] = await db.select({ cnt: count() })
        .from(schema.users)
        .where(and(
          eq(schema.users.tenantId, req.currentUser.tenantId),
          eq(schema.users.isActive, true),
        ));

      if (tenant.plan.maxUsers !== -1 && Number(cnt) >= tenant.plan.maxUsers) {
        return reply.code(403).send({
          error: `Seu plano permite no máximo ${tenant.plan.maxUsers} usuário(s). Faça upgrade para adicionar mais membros.`,
        });
      }
    }

    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, body.email.toLowerCase()),
    });
    if (existing) return reply.code(409).send({ error: 'Email já cadastrado' });

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(body.password, 12);

    const [user] = await db.insert(schema.users).values({
      tenantId: req.currentUser.tenantId,
      email: body.email.toLowerCase(),
      passwordHash,
      name: body.name,
      role: body.role,
    }).returning({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role });

    await db.insert(schema.notificationPreferences).values({ userId: user.id });
    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'user_invited', resourceType: 'user', resourceId: user.id });

    return reply.code(201).send(user);
  });

  // PATCH /tenants/users/:id — atualizar usuário
  app.patch('/users/:id', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    if (!['owner', 'admin', 'system_admin'].includes(req.currentUser.role)) {
      return reply.code(403).send({ error: 'Sem permissão' });
    }
    const { id } = req.params as { id: string };
    const body = req.body as { name?: string; role?: string; isActive?: boolean };
    const db = getDb();

    const targetUser = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    if (!targetUser) return reply.code(404).send({ error: 'Usuário não encontrado' });

    // Garantir que o usuário pertence ao mesmo tenant (exceto system_admin)
    if (req.currentUser.role !== 'system_admin' && targetUser.tenantId !== req.currentUser.tenantId) {
      return reply.code(403).send({ error: 'Sem permissão' });
    }

    const [updated] = await db.update(schema.users)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.role && { role: body.role }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role, isActive: schema.users.isActive, updatedAt: schema.users.updatedAt });

    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'user_updated', resourceType: 'user', resourceId: id });
    return updated;
  });

  // DELETE /tenants/users/:id — desativar usuário
  app.delete('/users/:id', {
    onRequest: [app.authenticate],
    schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  }, async (req, reply) => {
    if (!['owner', 'admin', 'system_admin'].includes(req.currentUser.role)) {
      return reply.code(403).send({ error: 'Sem permissão' });
    }
    const { id } = req.params as { id: string };
    const db = getDb();

    const targetUser = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    if (!targetUser) return reply.code(404).send({ error: 'Usuário não encontrado' });

    if (req.currentUser.role !== 'system_admin' && targetUser.tenantId !== req.currentUser.tenantId) {
      return reply.code(403).send({ error: 'Sem permissão' });
    }

    if (targetUser.id === req.currentUser.id) {
      return reply.code(400).send({ error: 'Não é possível desativar sua própria conta' });
    }

    const [updated] = await db.update(schema.users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id });

    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'user_deactivated', resourceType: 'user', resourceId: id });
    return updated;
  });

  // PUT /tenants/me — atualizar dados do tenant
  app.put('/me', {
    onRequest: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2 },
          settings: { type: 'object' },
        },
      },
    },
  }, async (req, reply) => {
    if (!['owner', 'admin', 'system_admin'].includes(req.currentUser.role)) {
      return reply.code(403).send({ error: 'Sem permissão' });
    }

    const body = req.body as { name?: string; settings?: Record<string, unknown> };
    const db = getDb();

    const [updated] = await db.update(schema.tenants)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.settings && { settings: body.settings }),
        updatedAt: new Date(),
      })
      .where(eq(schema.tenants.id, req.currentUser.tenantId))
      .returning();

    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.id, action: 'tenant_updated', resourceType: 'tenant', resourceId: req.currentUser.tenantId });
    return updated;
  });
}
