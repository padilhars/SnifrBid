import { Worker, type Job } from 'bullmq';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { eq } from 'drizzle-orm';
import { generateEmbedding } from '../services/EmbeddingService.js';
import { aiProviderService } from '../services/AIProviderService.js';

async function processEmbeddingJob(job: Job<{ licitacaoId: string }>) {
  const { licitacaoId } = job.data;

  const licitacao = await getDb().query.licitacoes.findFirst({
    where: eq(schema.licitacoes.id, licitacaoId),
  });

  if (!licitacao || licitacao.embedding) return; // já tem embedding

  // Usa a API do Gemini do sistema para gerar embeddings
  const provider = await aiProviderService.getActiveProvider();
  const apiKey = await aiProviderService.decryptApiKey(provider.credential.apiKeyEncrypted);

  // Embeddings só disponíveis via Gemini por ora
  if (provider.slug !== 'gemini') {
    await job.log(`Embedding não suportado para provedor: ${provider.slug}`);
    return;
  }

  const text = `${licitacao.objeto} ${licitacao.orgaoNome ?? ''}`.trim();
  const embedding = await generateEmbedding(text, apiKey);

  await getDb().update(schema.licitacoes)
    .set({ embedding })
    .where(eq(schema.licitacoes.id, licitacaoId));
}

export function createEmbeddingWorker() {
  return new Worker('embedding', processEmbeddingJob, {
    connection: getRedis(),
    concurrency: 5,
  });
}
