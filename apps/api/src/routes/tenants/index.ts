import type { FastifyInstance } from 'fastify';
import { eq, and, count } from 'drizzle-orm';
import { getDb, schema } from '@snifrbid/db';
import { logAudit } from '../../services/audit.js';

export default async function tenantRoutes(app: FastifyInstance) {

  // GET /tenants/me — dados do tenant do usuário autenticado
  app.get('/me', { onRequest: [app.authenticate] }, async (req, reply) => {
    const tenant = await getDb().query.tenants.findFirst({
      where: eq(schema.tenants.id, req.currentUser.tenantId),
      with: { plan: true },
    });
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });
    return tenant;
  });

  // GET /tenants/users — lista usuários do tenant
  app.get('/users', { onRequest: [app.authenticate] }, async (req) => {
    return getDb().query.users.findMany({
      where: and(
        eq(schema.users.tenantId, req.currentUser.tenantId),
        eq(schema.users.isActive, true),
      ),
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
        required: ['email', 'name', 'role'],
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

    // Verificar permissão (apenas owner/admin pode convidar)
    if (!['owner', 'admin', 'system_admin'].includes(req.currentUser.role)) {
      return reply.code(403).send({ error: 'Sem permissão para convidar usuários' });
    }

    // Verificar limite de usuários do plano
    const tenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.id, req.currentUser.tenantId),
      with: { plan: true },
    });
    if (!tenant) return reply.code(404).send({ error: 'Tenant não encontrado' });

    const [{ count: userCount }] = await db.select({ count: count() })
      .from(schema.users)
      .where(and(
        eq(schema.users.tenantId, req.currentUser.tenantId),
        eq(schema.users.isActive, true),
      ));

    if (tenant.plan.maxUsers !== -1 && Number(userCount) >= tenant.plan.maxUsers) {
      return reply.code(403).send({
        error: `Seu plano permite no máximo ${tenant.plan.maxUsers} usuário(s). Faça upgrade para adicionar mais membros.`,
      });
    }

    const existing = await db.query.users.findFirst({
      where: eq(schema.users.email, body.email.toLowerCase()),
    });
    if (existing) return reply.code(409).send({ error: 'Email já cadastrado' });

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(body.password ?? Math.random().toString(36), 12);

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
