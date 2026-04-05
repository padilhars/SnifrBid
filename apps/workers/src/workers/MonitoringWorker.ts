import { Worker, type Job } from 'bullmq';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { eq, notInArray, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import { getAdapter } from '@snifrbid/portals';
import { notificationQueue } from '../queues/index.js';

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

async function refreshLicitacao(licitacaoId: string): Promise<{
  hasChanges: boolean;
  changes: Record<string, unknown>;
}> {
  const licitacao = await getDb().query.licitacoes.findFirst({
    where: eq(schema.licitacoes.id, licitacaoId),
    with: { portal: true },
  });

  if (!licitacao?.portal) return { hasChanges: false, changes: {} };

  try {
    const adapter = getAdapter(licitacao.portal.adapterKey);
    const updated = await adapter.fetchDetalhes(licitacao.externalId).catch(() => null);
    if (!updated) return { hasChanges: false, changes: {} };

    const newHash = sha256(JSON.stringify(updated.rawData));
    if (newHash === licitacao.contentHash) return { hasChanges: false, changes: {} };

    // Detectar campos que mudaram
    const changes: Record<string, unknown> = {};
    const oldData = licitacao.rawData as Record<string, unknown>;
    const newData = updated.rawData as Record<string, unknown>;

    for (const key of new Set([...Object.keys(oldData), ...Object.keys(newData)])) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = { from: oldData[key], to: newData[key] };
      }
    }

    // Persistir snapshot de mudança
    await getDb().insert(schema.licitacaoSnapshots).values({
      licitacaoId,
      contentHash: newHash,
      snapshot: updated.rawData,
      changesDetected: changes,
    });

    // Atualizar licitação
    await getDb().update(schema.licitacoes)
      .set({
        status: updated.status ?? licitacao.status,
        dataEncerramento: updated.dataEncerramento ? new Date(updated.dataEncerramento) : licitacao.dataEncerramento,
        rawData: updated.rawData,
        contentHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(schema.licitacoes.id, licitacaoId));

    return { hasChanges: true, changes };
  } catch {
    return { hasChanges: false, changes: {} };
  }
}

async function processMonitoringJob(job: Job) {
  // Trata tanto o job de varredura geral quanto o de diff individual
  if (job.data?.licitacaoId) {
    // Job específico (enfileirado pelo CollectionWorker ao detectar hash diferente)
    const snapshot = await refreshLicitacao(job.data.licitacaoId);
    if (snapshot.hasChanges) {
      await notificationQueue.add('notify', {
        type: 'status_change',
        licitacaoId: job.data.licitacaoId,
        changes: snapshot.changes,
        tenantId: job.data.tenantId,
      });
    }
    return;
  }

  // Varredura geral — monitora todas as licitações com match ativo
  const licitacoesAtivas = await getDb()
    .selectDistinct({ id: schema.licitacoes.id })
    .from(schema.licitacoes)
    .innerJoin(schema.matches, eq(schema.matches.licitacaoId, schema.licitacoes.id))
    .where(notInArray(schema.matches.status, ['dismissed', 'quota_exceeded']));

  await job.log(`Monitorando ${licitacoesAtivas.length} licitações ativas`);

  for (const { id } of licitacoesAtivas) {
    const snapshot = await refreshLicitacao(id);

    if (snapshot.hasChanges) {
      // Identifica tenants afetados para notificar
      const affectedMatches = await getDb().query.matches.findMany({
        where: eq(schema.matches.licitacaoId, id),
        columns: { tenantId: true },
      });

      const tenantIds = [...new Set(affectedMatches.map((m) => m.tenantId))];

      for (const tenantId of tenantIds) {
        await notificationQueue.add('notify', {
          type: 'status_change',
          licitacaoId: id,
          changes: snapshot.changes,
          tenantId,
        });
      }
    }
  }
}

async function processMaintenanceJob(job: Job) {
  if (job.name === 'reset-analyses-counter') {
    // Reset mensal atômico — apenas se já passou 1 mês desde o último reset
    const result = await getDb().execute(sql`
      UPDATE tenants
      SET analyses_used_this_month = 0,
          analyses_reset_at = NOW()
      WHERE analyses_reset_at < NOW() - INTERVAL '1 month'
      RETURNING id
    `);
    await job.log(`Reset de análises: ${result.length} tenants atualizados`);
  }
}

export function createMonitoringWorker() {
  return new Worker('monitoring', processMonitoringJob, {
    connection: getRedis(),
    concurrency: 2,
  });
}

export function createMaintenanceWorker() {
  return new Worker('maintenance', processMaintenanceJob, {
    connection: getRedis(),
    concurrency: 1,
  });
}
