import { getDb, schema } from '@snifrbid/db';
import { eq } from 'drizzle-orm';

/**
 * Gera embedding de 768 dimensões usando Gemini text-embedding-004.
 * Modelo dedicado para embeddings — mais barato que os modelos de geração.
 */
export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const model = 'text-embedding-004';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text: text.slice(0, 2048) }] }, // trunca para não exceder limite
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini embedding error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as {
    embedding: { values: number[] };
  };

  return data.embedding.values;
}

/**
 * Calcula similaridade coseno entre embedding da licitação e de uma query.
 * Retorna valor entre 0..1 (mais alto = mais similar).
 */
export async function getSemanticScore(licitacaoId: string, queryEmbedding: number[]): Promise<number> {
  if (queryEmbedding.length === 0) return 0;

  const vectorStr = `[${queryEmbedding.join(',')}]`;
  const [row] = await getDb().execute<{ similarity: number }>(
    // Usa operador <=> do pgvector (distância coseno = 1 - similaridade)
    // Retorna 0 se embedding da licitação for NULL
    `SELECT COALESCE(1 - (embedding <=> '${vectorStr}'::vector), 0) as similarity
     FROM licitacoes WHERE id = '${licitacaoId}'`,
  );

  return row?.similarity ?? 0;
}

/**
 * Score combinado: FTS (0.5) + trgm (0.2) + semântico (0.3)
 */
export function calcularScoreRelevancia(
  scoreFTS: number,
  scoreTrgm: number,
  scoreSemantico: number,
): number {
  return (scoreFTS * 0.5) + (scoreTrgm * 0.2) + (scoreSemantico * 0.3);
}
