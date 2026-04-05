import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { eq, and } from 'drizzle-orm';
import { getDb, schema } from '@snifrbid/db';
import { getRedis, sha256, slugify } from '@snifrbid/shared';
import { logAudit } from '../../services/audit.js';

const BCRYPT_ROUNDS = 12;

export default async function authRoutes(app: FastifyInstance) {
  // POST /auth/register — cadastro de tenant + usuário owner
  app.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['tenantName', 'email', 'password', 'name', 'planSlug'],
        properties: {
          tenantName: { type: 'string', minLength: 2, maxLength: 255 },
          cnpj: { type: 'string', maxLength: 18 },
          planSlug: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 2 },
        },
      },
    },
  }, async (req, reply) => {
    const { tenantName, cnpj, planSlug, email, password, name } = req.body as {
      tenantName: string; cnpj?: string; planSlug: string;
      email: string; password: string; name: string;
    };

    const db = getDb();

    const plan = await db.query.plans.findFirst({
      where: and(eq(schema.plans.slug, planSlug), eq(schema.plans.isActive, true)),
    });
    if (!plan) return reply.code(400).send({ error: 'Plano inválido' });

    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, email.toLowerCase()),
    });
    if (existingUser) return reply.code(409).send({ error: 'Email já cadastrado' });

    const slug = slugify(tenantName);
    const existingTenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.slug, slug),
    });
    const finalSlug = existingTenant ? `${slug}-${randomUUID().slice(0, 8)}` : slug;

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [tenant] = await db.insert(schema.tenants).values({
      name: tenantName,
      cnpj,
      slug: finalSlug,
      planId: plan.id,
      currentPriceBrl: plan.priceWithPlatformAiBrl,
    }).returning();

    const [user] = await db.insert(schema.users).values({
      tenantId: tenant.id,
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'owner',
    }).returning();

    // Criar preferências de notificação padrão
    await db.insert(schema.notificationPreferences).values({ userId: user.id });

    const { accessToken, refreshToken } = await generateTokens(app, user, tenant.id);

    await logAudit({ tenantId: tenant.id, userId: user.id, action: 'register', ipAddress: req.ip });

    return reply.code(201).send({ accessToken, refreshToken, user: safeUser(user), tenant: safeTenant(tenant) });
  });

  // POST /auth/login
  app.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { email, password } = req.body as { email: string; password: string };
    const db = getDb();

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email.toLowerCase()),
      with: { tenant: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Email ou senha inválidos' });
    }
    if (!user.isActive) return reply.code(401).send({ error: 'Conta desativada' });

    const tenantId = user.role === 'system_admin' ? user.tenantId : user.tenantId;
    const { accessToken, refreshToken } = await generateTokens(app, user, tenantId);

    await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
    await logAudit({ tenantId: user.tenantId, userId: user.id, action: 'login', ipAddress: req.ip });

    return { accessToken, refreshToken, user: safeUser(user) };
  });

  // POST /auth/refresh
  app.post('/refresh', async (req, reply) => {
    // DECISÃO: refresh token via body (cookies HttpOnly exigem @fastify/cookie — integrar na Fase 8)
    const refreshToken = (req.body as { refreshToken?: string })?.refreshToken;

    if (!refreshToken) return reply.code(401).send({ error: 'Refresh token ausente' });

    const tokenHash = sha256(refreshToken);
    const db = getDb();

    const stored = await db.query.refreshTokens.findFirst({
      where: and(
        eq(schema.refreshTokens.tokenHash, tokenHash),
      ),
      with: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return reply.code(401).send({ error: 'Refresh token inválido ou expirado' });
    }

    // Revogar o token atual (rotação)
    await db.update(schema.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(schema.refreshTokens.id, stored.id));

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      app, stored.user, stored.user.tenantId,
    );

    return { accessToken, refreshToken: newRefreshToken };
  });

  // POST /auth/logout
  app.post('/logout', {
    onRequest: [app.authenticate],
  }, async (req, reply) => {
    const payload = req.user as unknown as { jti: string; exp: number };
    const redis = getRedis();

    // Adicionar à blacklist até expirar
    const ttl = Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    await redis.setex(`blacklist:${payload.jti}`, ttl, '1');

    await logAudit({ tenantId: req.currentUser.tenantId, userId: req.currentUser.sub, action: 'logout', ipAddress: req.ip });
    return reply.code(204).send();
  });

  // POST /auth/forgot-password
  app.post('/forgot-password', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } },
      },
    },
  }, async (req, _reply) => {
    const { email } = req.body as { email: string };
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email.toLowerCase()),
    });

    // Resposta sempre igual para não vazar se o email existe
    if (user) {
      const token = randomUUID();
      await getRedis().setex(`pw_reset:${token}`, 3600, user.id);
      // DECISÃO: envio de email será integrado na Fase 7 com o NotificationWorker
      app.log.info({ userId: user.id, token }, 'Password reset token gerado');
    }

    return { message: 'Se o email estiver cadastrado, você receberá as instruções em breve.' };
  });

  // POST /auth/reset-password
  app.post('/reset-password', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
  }, async (req, reply) => {
    const { token, password } = req.body as { token: string; password: string };
    const userId = await getRedis().get(`pw_reset:${token}`);
    if (!userId) return reply.code(400).send({ error: 'Token inválido ou expirado' });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await getDb().update(schema.users).set({ passwordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
    await getRedis().del(`pw_reset:${token}`);

    return { message: 'Senha alterada com sucesso' };
  });

  // GET /auth/me
  app.get('/me', { onRequest: [app.authenticate] }, async (req) => {
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, req.currentUser.sub),
      with: { tenant: { with: { plan: true } } },
    });
    return { user: safeUser(user!), tenant: user?.tenant };
  });
}

// --- Helpers ---

async function generateTokens(
  app: FastifyInstance,
  user: { id: string; tenantId: string; role: string },
  tenantId: string,
) {
  const jti = randomUUID();
  // iat e exp são adicionados automaticamente pelo jwt.sign
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = app.jwt.sign(
    { sub: user.id, tenantId, role: user.role, jti } as any,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m' },
  );

  const refreshRaw = randomUUID() + randomUUID();
  const tokenHash = sha256(refreshRaw);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d

  await getDb().insert(schema.refreshTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken: refreshRaw };
}

function safeUser(user: typeof schema.users.$inferSelect) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

function safeTenant(tenant: typeof schema.tenants.$inferSelect) {
  return tenant;
}
