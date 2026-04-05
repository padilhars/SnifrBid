import { Worker, type Job } from 'bullmq';
import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { eq, and, sql } from 'drizzle-orm';
import { aiProviderService } from '../services/AIProviderService.js';
import { notificationQueue } from '../queues/index.js';

interface KeywordContext {
  keyword: string;
  context: string;
}

interface DownloadedDoc {
  tipo: string | null;
  content: string;
}

async function downloadDocumentos(
  documentos: Array<typeof schema.licitacaoDocumentos.$inferSelect>,
): Promise<DownloadedDoc[]> {
  // Prioriza edital e TR, máximo 3 documentos
  const priority = ['edital', 'tr', 'termo de referência'];
  const sorted = [...documentos].sort((a, b) => {
    const aScore = priority.findIndex((p) => a.tipo?.toLowerCase().includes(p));
    const bScore = priority.findIndex((p) => b.tipo?.toLowerCase().includes(p));
    return (aScore === -1 ? 999 : aScore) - (bScore === -1 ? 999 : bScore);
  });

  const results: DownloadedDoc[] = [];

  for (const doc of sorted.slice(0, 3)) {
    try {
      const res = await fetch(doc.url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) continue;
      const text = await res.text();
      results.push({ tipo: doc.tipo, content: text.slice(0, 8000) }); // trunca para não explodir o prompt
    } catch {
      // ignora falha de download individual
    }
  }

  return results;
}

function buildAnalysisPrompt(
  licitacao: typeof schema.licitacoes.$inferSelect & {
    portal: typeof schema.portals.$inferSelect | null;
    modalidade: typeof schema.modalidades.$inferSelect | null;
  },
  interest: typeof schema.interests.$inferSelect,
  documentos: DownloadedDoc[],
): string {
  const keywordContexts = (interest.keywordContexts as KeywordContext[]) ?? [];

  return `Você é um especialista em licitações públicas brasileiras. Analise a oportunidade abaixo em relação ao interesse da empresa e retorne APENAS um JSON válido com a estrutura especificada.

## INTERESSE DA EMPRESA
Nome: ${interest.name}
Palavras-chave e contextos:
${keywordContexts.map((kc) => `- "${kc.keyword}" → contexto: ${kc.context || 'não especificado'}`).join('\n')}

## LICITAÇÃO
Portal: ${licitacao.portal?.name ?? 'Não informado'}
Objeto: ${licitacao.objeto}
Órgão: ${licitacao.orgaoNome ?? 'Não informado'}
UF: ${licitacao.ufCode ?? 'Não informada'}
Modalidade: ${licitacao.modalidade?.name ?? 'Não informada'}
Valor estimado: ${licitacao.valorEstimado ? `R$ ${licitacao.valorEstimado}` : 'Não informado'}
Data de abertura: ${licitacao.dataAbertura?.toISOString() ?? 'Não informada'}

## DOCUMENTOS
${documentos.map((d) => `### ${d.tipo?.toUpperCase() ?? 'DOCUMENTO'}\n${d.content}`).join('\n\n')}

## RESPOSTA ESPERADA (JSON estrito, sem markdown)
{
  "scoreAderencia": <0-100>,
  "nivelRisco": <"baixo"|"medio"|"alto"|"critico">,
  "complexidadeTecnica": <"baixa"|"media"|"alta">,
  "estimativaChances": <"baixa"|"media"|"alta">,
  "criterioJulgamento": "<string>",
  "documentacaoExigida": ["<item>"],
  "requisitosTecnicos": ["<item>"],
  "pontosAtencao": ["<ponto>"],
  "dataEntregaProposta": "<ISO 8601 ou null>",
  "dataAberturaProposta": "<ISO 8601 ou null>",
  "resumo": "<2-3 parágrafos analisando a oportunidade>",
  "analiseCompleta": "<análise detalhada>"
}`.trim();
}

async function processAnalysisJob(job: Job<{ matchId: string }>) {
  const match = await getDb().query.matches.findFirst({
    where: eq(schema.matches.id, job.data.matchId),
    with: {
      licitacao: {
        with: {
          documentos: true,
          portal: true,
          modalidade: true,
        },
      },
      interest: true,
      tenant: { with: { plan: true } },
    },
  });

  if (!match) return;

  const { tenant } = match;

  // Verificar limite do plano
  if (
    tenant.plan.maxAnalysesPerMonth !== -1 &&
    tenant.analysesUsedThisMonth >= tenant.plan.maxAnalysesPerMonth
  ) {
    await getDb().update(schema.matches)
      .set({ status: 'quota_exceeded' })
      .where(eq(schema.matches.id, match.id));
    return;
  }

  const docs = await downloadDocumentos(match.licitacao.documentos);
  const prompt = buildAnalysisPrompt(match.licitacao, match.interest, docs);

  let rawResponse = '';
  try {
    const response = await aiProviderService.analyze(prompt, match.tenantId);
    rawResponse = JSON.stringify(response.result);

    await getDb().insert(schema.analyses).values({
      matchId: match.id,
      tenantId: match.tenantId,
      modelUsed: response.modelUsed,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      scoreAderencia: response.result.scoreAderencia,
      nivelRisco: response.result.nivelRisco,
      complexidadeTecnica: response.result.complexidadeTecnica,
      estimativaChances: response.result.estimativaChances,
      criterioJulgamento: response.result.criterioJulgamento,
      documentacaoExigida: response.result.documentacaoExigida,
      requisitosTecnicos: response.result.requisitosTecnicos,
      pontosAtencao: response.result.pontosAtencao,
      dataEntregaProposta: response.result.dataEntregaProposta ? new Date(response.result.dataEntregaProposta) : null,
      dataAberturaProposta: response.result.dataAberturaProposta ? new Date(response.result.dataAberturaProposta) : null,
      resumo: response.result.resumo,
      analiseCompleta: response.result.analiseCompleta,
      rawResponse,
    });

    // Incremento atômico — só incrementa se ainda dentro do limite
    const updated = await getDb().update(schema.tenants)
      .set({ analysesUsedThisMonth: sql`analyses_used_this_month + 1` })
      .where(and(
        eq(schema.tenants.id, match.tenantId),
        sql`(${schema.plans.maxAnalysesPerMonth} = -1 OR ${schema.tenants.analysesUsedThisMonth} < (
          SELECT max_analyses_per_month FROM plans WHERE id = ${schema.tenants.planId}
        ))`,
      ))
      .returning({ id: schema.tenants.id });

    if (updated.length === 0) {
      await getDb().update(schema.matches)
        .set({ status: 'quota_exceeded' })
        .where(eq(schema.matches.id, match.id));
      return;
    }

    await getDb().update(schema.matches)
      .set({ status: 'analyzed' })
      .where(eq(schema.matches.id, match.id));

    await notificationQueue.add('notify', {
      type: 'analysis_complete',
      matchId: match.id,
      tenantId: match.tenantId,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await getDb().insert(schema.analyses).values({
      matchId: match.id,
      tenantId: match.tenantId,
      modelUsed: 'unknown',
      errorMessage,
      rawResponse,
    });
    throw err; // deixa BullMQ fazer retry
  }
}

export function createAnalysisWorker() {
  return new Worker('analysis', processAnalysisJob, {
    connection: getRedis(),
    concurrency: 3,
  });
}
