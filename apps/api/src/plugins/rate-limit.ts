import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { getRedis } from '@snifrbid/shared';

export const rateLimitPlugin = fp(async (app: FastifyInstance) => {
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis: getRedis(),
    keyGenerator: (req) => {
      // Usa tenant_id como chave se autenticado, senão IP
      const tenantId = (req as unknown as { currentUser?: { tenantId?: string } }).currentUser?.tenantId;
      return tenantId ? `tenant:${tenantId}` : req.ip;
    },
  });
});
