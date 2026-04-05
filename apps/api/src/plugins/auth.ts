import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getRedis } from '@snifrbid/shared';
import { getDb, schema } from '@snifrbid/db';
import { eq } from 'drizzle-orm';

export interface JWTPayload {
  sub: string;      // userId
  tenantId: string;
  role: string;
  jti: string;
  iat?: number;
  exp?: number;
}

// Augmentação correta para @fastify/jwt — evita conflito com o tipo nativo
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

// req.currentUser para dados enriquecidos (sem conflito com req.user do jwt)
declare module 'fastify' {
  interface FastifyRequest {
    currentUser: {
      id: string;
      name: string;
      email: string;
      sub: string;
      tenantId: string;
      role: string;
      jti: string;
      exp: number;
    };
    currentTenant: typeof schema.tenants.$inferSelect;
  }
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireSystemAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
      const payload = req.user as JWTPayload;

      // Verificar blacklist (logout)
      const blacklisted = await getRedis().get(`blacklist:${payload.jti}`);
      if (blacklisted) {
        return reply.code(401).send({ error: 'Token revogado' });
      }

      // Carregar usuário do banco
      const dbUser = await getDb().query.users.findFirst({
        where: eq(schema.users.id, payload.sub),
      });
      if (!dbUser || !dbUser.isActive) {
        return reply.code(401).send({ error: 'Usuário inativo ou não encontrado' });
      }

      // Carregar tenant (exceto system_admin)
      if (payload.role !== 'system_admin') {
        const tenant = await getDb().query.tenants.findFirst({
          where: eq(schema.tenants.id, payload.tenantId),
        });
        if (!tenant || !tenant.isActive) {
          return reply.code(401).send({ error: 'Tenant inativo' });
        }
        req.currentTenant = tenant;
      }

      req.currentUser = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        sub: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role,
        jti: payload.jti,
        exp: payload.exp ?? 0,
      };
    } catch (_err) {
      reply.code(401).send({ error: 'Token inválido ou expirado' });
    }
  });

  app.decorate('requireSystemAdmin', async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.currentUser?.role !== 'system_admin') {
      return reply.code(403).send({ error: 'Acesso restrito ao administrador do sistema' });
    }
  });
});
