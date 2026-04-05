import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import { corsPlugin } from './plugins/cors.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { authPlugin } from './plugins/auth.js';
import { tenantPlugin } from './plugins/tenant.js';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
    },
    trustProxy: true, // necessário atrás do Nginx
  });

  // Plugins globais
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  });
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(authPlugin);
  await app.register(tenantPlugin);

  // Rotas
  await app.register(import('./routes/auth/index.js'), { prefix: '/auth' });
  await app.register(import('./routes/tenants/index.js'), { prefix: '/tenants' });
  await app.register(import('./routes/interests/index.js'), { prefix: '/interests' });
  // REGRA: /licitacoes/favorites registrada antes de /licitacoes/:id — ver routes/licitacoes/index.ts
  await app.register(import('./routes/licitacoes/index.js'), { prefix: '/licitacoes' });
  await app.register(import('./routes/notifications/index.js'), { prefix: '/notifications' });
  await app.register(import('./routes/admin/index.js'), { prefix: '/admin' });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  }));

  return app;
}
