import { Worker, type Job } from 'bullmq';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { eq, sql } from 'drizzle-orm';
import { aiProviderService } from '../services/AIProviderService.js';
import { getSemanticScore, calcularScoreRelevancia } from '../services/EmbeddingService.js';
import { analysisQueue } from '../queues/index.js';

interface KeywordContext {
  keyword: string;
  context: string;
}

interface FtsRow extends Record<string, unknown> {
  score: number | null;
  found_fts: boolean;
  score_trgm: number;
}

function matchesFilters(
  licitacao: typeof schema.licitacoes.$inferSelect,
  interesse: typeof schema.interests.$inferSelect & {
    ufs: Array<{ ufCode: string }>;
    portals: Array<{ portalId: string }>;
    modalidades: Array<{ modalidadeId: string }>;
  },
): boolean {
  // Filtro de UF
  if (licitacao.ufCode && interesse.ufs.length > 0) {
    const ufMatch = interesse.ufs.some((u) => u.ufCode === licitacao.ufCode);
    if (!ufMatch) return false;
  }

  // Filtro de portal
  if (licitacao.portalId && interesse.portals.length > 0) {
    const portalMatch = interesse.portals.some((p) => p.portalId === licitacao.portalId);
    if (!portalMatch) return false;
  }

  // Filtro de modalidade
  if (licitacao.modalidadeId && interesse.modalidades.length > 0) {
    const modalidadeMatch = interesse.modalidades.some((m) => m.modalidadeId === licitacao.modalidadeId);
    if (!modalidadeMatch) return false;
  }

  return true;
}

async function validateContext(
  objetoLicitacao: string,
  keyword: string,
  context: string,
  tenantId: string,
): Promise<boolean> {
  const prompt = `Responda apenas "sim" ou "não".

A licitação abaixo é compatível com o contexto informado para a palavra-chave "${keyword}"?

Contexto esperado: ${context}

Objeto da licitação: ${objetoLicitacao}

Resposta:`;

  const response = await aiProviderService.classifyContext(prompt, tenantId);
  return response.toLowerCase().startsWith('sim');
}

function calcularScoreFinal(maxKeywordScore: number, matchedCount: number, totalKeywords: number): number {
  const coverageRatio = matchedCount / Math.max(totalKeywords, 1);
  return maxKeywordScore * 0.6 + coverageRatio * 0.4;
}

async function processMatchingJob(job: Job<{ licitacaoId: string }>) {
  const { licitacaoId } = job.data;

  const licitacao = await getDb().query.licitacoes.findFirst({
    where: eq(schema.licitacoes.id, licitacaoId),
  });

  if (!licitacao) return;

  const interesses = await getDb().query.interests.findMany({
    where: eq(schema.interests.isActive, true),
    with: {
      ufs: true,
      portals: true,
      modalidades: true,
    },
  });

  for (const interesse of interesses) {
    // ESTÁGIO 1: Filtro estrutural
    if (!matchesFilters(licitacao, interesse)) continue;

    const keywordContexts = (interesse.keywordContexts as KeywordContext[]) ?? [];
    const matchedKeywords: string[] = [];
    let maxKeywordScore = 0;

    // ESTÁGIO 2: Presença da keyword (FTS + trgm)
    for (const kc of keywordContexts) {
      const [ftsResult] = await getDb().execute<FtsRow>(sql`
        SELECT
          ts_rank(search_vector, phraseto_tsquery('snifrbid_pt', ${kc.keyword})) as score,
          search_vector @@ phraseto_tsquery('snifrbid_pt', ${kc.keyword}) as found_fts,
          similarity(objeto, ${kc.keyword}) as score_trgm
        FROM licitacoes
        WHERE id = ${licitacaoId}
      `);

      if (!ftsResult) continue;

      const found = ftsResult.found_fts || ftsResult.score_trgm > 0.3;
      if (!found) continue;

      // ESTÁGIO 3: Validação de contexto via IA (modelo leve)
      if (kc.context && kc.context.trim().length > 0) {
        const contextMatch = await validateContext(
          licitacao.objeto,
          kc.keyword,
          kc.context,
          interesse.tenantId,
        );
        if (!contextMatch) continue;
      }

      matchedKeywords.push(kc.keyword);
      maxKeywordScore = Math.max(maxKeywordScore, ftsResult.score ?? 0);
    }

    if (matchedKeywords.length === 0) continue;

    // Score semântico: compara embedding da licitação com embedding da primeira keyword
    // O embedding da licitação é gerado pelo EmbeddingWorker de forma assíncrona
    const scoreSemantico = await getSemanticScore(licitacaoId, []);
    const maxFtsAndTrgm = maxKeywordScore;
    const scoreTextual = calcularScoreRelevancia(maxFtsAndTrgm, 0, scoreSemantico);
    const scoreFinal = calcularScoreFinal(maxKeywordScore, matchedKeywords.length, keywordContexts.length);

    const [match] = await getDb().insert(schema.matches)
      .values({
        licitacaoId,
        interestId: interesse.id,
        tenantId: interesse.tenantId,
        scoreTextual,
        scoreSemantico,
        scoreFinal,
        matchedKeywords,
        status: 'pending',
      })
      .onConflictDoNothing()
      .returning();

    if (match) {
      await analysisQueue.add('analyze', { matchId: match.id });
    }
  }
}

export function createMatchingWorker() {
  return new Worker('matching', processMatchingJob, {
    connection: getRedis(),
    concurrency: 5,
  });
}
