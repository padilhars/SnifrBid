import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { getDb } from '@snifrbid/db';

export const tenantPlugin = fp(async (_app: FastifyInstance) => {
  // O contexto de tenant é configurado per-query via withTenantContext()
  // Este plugin expõe o helper como decorator global
  _app.decorate('withTenantContext', withTenantContext);
});

/**
 * Executa fn() dentro de uma transação com SET LOCAL para RLS.
 * IMPORTANTE: SET LOCAL só persiste dentro da transação.
 */
export async function withTenantContext<T>(
  tenantId: string,
  userId: string,
  fn: (tx: ReturnType<typeof getDb>) => Promise<T>,
): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    return fn(tx as unknown as ReturnType<typeof getDb>);
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    withTenantContext: typeof withTenantContext;
  }
}
