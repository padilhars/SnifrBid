import { Worker, type Job } from 'bullmq';
import { createHash } from 'crypto';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { eq, and, sql } from 'drizzle-orm';
import { getAdapter } from '@snifrbid/portals';
import { buildCollectionFilters } from '../services/CollectionFilterService.js';
import { matchingQueue, monitoringQueue, embeddingQueue } from '../queues/index.js';

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

async function processCollectionJob(job: Job) {
  const filters = await buildCollectionFilters();

  if (filters.length === 0) {
    await job.log('Nenhum interesse ativo — coleta ignorada');
    return;
  }

  const since = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const now = new Date();

  for (const filter of filters) {
    const portal = await getDb().query.portals.findFirst({
      where: and(
        eq(schema.portals.id, filter.portalId),
        eq(schema.portals.isActive, true),
      ),
    });
    if (!portal) continue;

    const adapter = getAdapter(filter.portalSlug);

    await job.log(`Coletando ${portal.name} | modalidades: ${filter.modalidadeCodes.join(',')} | UFs: ${filter.ufCodes.join(',')}`);

    for await (const licitacao of adapter.fetchLicitacoes(since, {
      modalidadeCodes: filter.modalidadeCodes,
      ufCodes: filter.ufCodes,
    })) {
      if (
        licitacao.dataEncerramento &&
        new Date(licitacao.dataEncerramento) < now
      ) {
        await job.log(`Ignorada (encerrada): ${licitacao.externalId}`);
        continue;
      }

      const contentHash = sha256(JSON.stringify(licitacao.rawData));

      const [saved] = await getDb().insert(schema.licitacoes)
        .values({
          portalId: portal.id,
          externalId: licitacao.externalId,
          objeto: licitacao.objeto,
          orgaoNome: licitacao.orgaoNome,
          orgaoCnpj: licitacao.orgaoCnpj ?? null,
          ufCode: licitacao.ufCode ?? null,
          valorEstimado: licitacao.valorEstimado?.toString() ?? null,
          status: licitacao.status ?? null,
          dataPublicacao: licitacao.dataPublicacao ? new Date(licitacao.dataPublicacao) : null,
          dataAbertura: licitacao.dataAbertura ? new Date(licitacao.dataAbertura) : null,
          dataEncerramento: licitacao.dataEncerramento ? new Date(licitacao.dataEncerramento) : null,
          editalUrl: licitacao.editalUrl ?? null,
          portalUrl: licitacao.portalUrl ?? null,
          rawData: licitacao.rawData,
          contentHash,
        })
        .onConflictDoUpdate({
          target: [schema.licitacoes.portalId, schema.licitacoes.externalId],
          set: {
            status: sql`CASE WHEN licitacoes.content_hash != excluded.content_hash
                        THEN excluded.status
                        ELSE licitacoes.status END`,
            dataEncerramento: sql`CASE WHEN licitacoes.content_hash != excluded.content_hash
                                  THEN excluded.data_encerramento
                                  ELSE licitacoes.data_encerramento END`,
            rawData: sql`CASE WHEN licitacoes.content_hash != excluded.content_hash
                         THEN excluded.raw_data
                         ELSE licitacoes.raw_data END`,
            contentHash: sql`excluded.content_hash`,
            updatedAt: new Date(),
          },
        })
        .returning();

      // isNew: collectedAt == updatedAt (same millisecond means just inserted)
      const isNew = saved.collectedAt.getTime() === saved.updatedAt.getTime();
      if (isNew) {
        await matchingQueue.add('match', { licitacaoId: saved.id });
        // Embedding assíncrono — não bloqueia a coleta
        await embeddingQueue.add('embed', { licitacaoId: saved.id });
      } else {
        await monitoringQueue.add('diff', { licitacaoId: saved.id });
      }
    }
  }

  // Invalida cache de filtros para próximo ciclo
  await getRedis().del('collection:filters:cache');
}

export function createCollectionWorker() {
  return new Worker('collection', processCollectionJob, {
    connection: getRedis(),
    concurrency: 2,
  });
}
