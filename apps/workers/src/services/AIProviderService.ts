import { getDb, schema } from '@snifrbid/db';
import { getRedis } from '@snifrbid/shared';
import { eq, and, sql } from 'drizzle-orm';

export interface AIAnalysisResult {
  scoreAderencia: number;
  nivelRisco: 'baixo' | 'medio' | 'alto' | 'critico';
  complexidadeTecnica: 'baixa' | 'media' | 'alta';
  estimativaChances: 'baixa' | 'media' | 'alta';
  criterioJulgamento: string;
  documentacaoExigida: string[];
  requisitosTecnicos: string[];
  pontosAtencao: string[];
  dataEntregaProposta: string | null;
  dataAberturaProposta: string | null;
  resumo: string;
  analiseCompleta: string;
}

interface CallResult {
  result: AIAnalysisResult;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  usedTenantAI: boolean;
}

// Mapeamento de modelos pesados → leves por provedor (para classificação binária)
const LIGHT_MODEL_MAP: Record<string, string> = {
  'gemini-1.5-pro': 'gemini-1.5-flash',
  'gemini-2.0-flash': 'gemini-1.5-flash',
  'gpt-4o': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4o-mini',
  'claude-opus-4-5': 'claude-haiku-4-5',
  'claude-sonnet-4-5': 'claude-haiku-4-5',
};

export class AIProviderService {
  /** Carrega provedor ativo do banco (cache 5 min no Redis) */
  async getActiveProvider(): Promise<
    typeof schema.aiProviders.$inferSelect & { credential: typeof schema.aiProviderCredentials.$inferSelect }
  > {
    const cached = await getRedis().get('ai:active_provider');
    if (cached) return JSON.parse(cached) as ReturnType<typeof this.getActiveProvider> extends Promise<infer R> ? R : never;

    const provider = await getDb().query.aiProviders.findFirst({
      where: and(
        eq(schema.aiProviders.isActive, true),
        eq(schema.aiProviders.isDefault, true),
      ),
      with: { credentials: { where: eq(schema.aiProviderCredentials.isActive, true), limit: 1 } },
    });

    if (!provider || !provider.credentials[0]) {
      throw new Error('Nenhum provedor de IA ativo configurado');
    }

    const result = { ...provider, credential: provider.credentials[0] };
    await getRedis().setex('ai:active_provider', 300, JSON.stringify(result));
    return result;
  }

  /** Descriptografa chave via pgcrypto */
  async decryptApiKey(encryptedKey: string): Promise<string> {
    const [row] = await getDb().execute<{ key: string }>(
      sql`SELECT pgp_sym_decrypt(decode(${encryptedKey}, 'base64'), ${process.env.AI_ENCRYPTION_KEY!}) as key`,
    );
    return row.key;
  }

  /** Ponto de entrada para análise completa */
  async analyze(prompt: string, tenantId?: string): Promise<CallResult> {
    // 1. Verificar se o tenant tem IA própria configurada
    if (tenantId) {
      const tenant = await getDb().query.tenants.findFirst({
        where: eq(schema.tenants.id, tenantId),
        columns: { aiConfig: true },
      });

      const cfg = tenant?.aiConfig as {
        provider: string; model: string;
        apiKeyEncrypted: string; active: boolean;
      } | null;

      if (cfg?.active && cfg.apiKeyEncrypted) {
        const apiKey = await this.decryptApiKey(cfg.apiKeyEncrypted);
        const result = await this.callProvider(prompt, cfg.provider, apiKey, cfg.model);
        return { ...result, usedTenantAI: true };
      }
    }

    // 2. Fallback para IA do sistema
    const provider = await this.getActiveProvider();
    const apiKey = await this.decryptApiKey(provider.credential.apiKeyEncrypted);
    const result = await this.callProvider(prompt, provider.slug, apiKey, provider.modelDefault);
    return { ...result, usedTenantAI: false };
  }

  /** Classificação binária (sim/não) com modelo leve */
  async classifyContext(prompt: string, tenantId?: string): Promise<string> {
    if (tenantId) {
      const tenant = await getDb().query.tenants.findFirst({
        where: eq(schema.tenants.id, tenantId),
        columns: { aiConfig: true },
      });

      const cfg = tenant?.aiConfig as {
        provider: string; model: string;
        apiKeyEncrypted: string; active: boolean;
      } | null;

      if (cfg?.active && cfg.apiKeyEncrypted) {
        const apiKey = await this.decryptApiKey(cfg.apiKeyEncrypted);
        const lightModel = LIGHT_MODEL_MAP[cfg.model] ?? cfg.model;
        return this.callProviderRaw(prompt, cfg.provider, apiKey, lightModel);
      }
    }

    const provider = await this.getActiveProvider();
    const apiKey = await this.decryptApiKey(provider.credential.apiKeyEncrypted);
    const lightModel = LIGHT_MODEL_MAP[provider.modelDefault] ?? provider.modelDefault;
    return this.callProviderRaw(prompt, provider.slug, apiKey, lightModel);
  }

  private async callProvider(
    prompt: string, slug: string, apiKey: string, model: string,
  ): Promise<Omit<CallResult, 'usedTenantAI'>> {
    switch (slug) {
      case 'gemini': return this.analyzeWithGemini(prompt, apiKey, model);
      case 'openai': return this.analyzeWithOpenAI(prompt, apiKey, model);
      case 'claude': return this.analyzeWithClaude(prompt, apiKey, model);
      case 'custom': return this.analyzeWithCustom(prompt, apiKey, model);
      default: throw new Error(`Provedor desconhecido: ${slug}`);
    }
  }

  private async callProviderRaw(
    prompt: string, slug: string, apiKey: string, model: string,
  ): Promise<string> {
    switch (slug) {
      case 'gemini': return this.rawCallGemini(prompt, apiKey, model);
      case 'openai': return this.rawCallOpenAI(prompt, apiKey, model);
      case 'claude': return this.rawCallClaude(prompt, apiKey, model);
      case 'custom': return this.rawCallCustom(prompt, apiKey, model);
      default: throw new Error(`Provedor desconhecido: ${slug}`);
    }
  }

  // --- Implementações por provedor ---

  private async analyzeWithGemini(prompt: string, apiKey: string, model: string): Promise<Omit<CallResult, 'usedTenantAI'>> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    const data = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
    };
    const text = data.candidates[0]?.content.parts[0]?.text ?? '{}';
    return {
      result: this.parseAnalysisResult(text),
      modelUsed: model,
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }

  private async analyzeWithOpenAI(prompt: string, apiKey: string, model: string): Promise<Omit<CallResult, 'usedTenantAI'>> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number };
    };
    const text = data.choices[0]?.message.content ?? '{}';
    return {
      result: this.parseAnalysisResult(text),
      modelUsed: model,
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
    };
  }

  private async analyzeWithClaude(prompt: string, apiKey: string, model: string): Promise<Omit<CallResult, 'usedTenantAI'>> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
    const data = await res.json() as {
      content: Array<{ text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };
    const text = data.content[0]?.text ?? '{}';
    return {
      result: this.parseAnalysisResult(text),
      modelUsed: model,
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
    };
  }

  private async analyzeWithCustom(prompt: string, apiKey: string, model: string): Promise<Omit<CallResult, 'usedTenantAI'>> {
    // DECISÃO: provedor custom usa formato OpenAI-compatible
    return this.analyzeWithOpenAI(prompt, apiKey, model);
  }

  private async rawCallGemini(prompt: string, apiKey: string, model: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 10 } }),
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
    return data.candidates[0]?.content.parts[0]?.text?.trim() ?? '';
  }

  private async rawCallOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 10 }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message.content?.trim() ?? '';
  }

  private async rawCallClaude(prompt: string, apiKey: string, model: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 10, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json() as { content: Array<{ text: string }> };
    return data.content[0]?.text?.trim() ?? '';
  }

  private async rawCallCustom(prompt: string, apiKey: string, model: string): Promise<string> {
    return this.rawCallOpenAI(prompt, apiKey, model);
  }

  /** Parse do JSON retornado pelo provedor de IA */
  private parseAnalysisResult(text: string): AIAnalysisResult {
    // Remover bloco markdown se presente
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const parsed = JSON.parse(clean) as Partial<AIAnalysisResult>;
      return {
        scoreAderencia: parsed.scoreAderencia ?? 0,
        nivelRisco: parsed.nivelRisco ?? 'baixo',
        complexidadeTecnica: parsed.complexidadeTecnica ?? 'media',
        estimativaChances: parsed.estimativaChances ?? 'baixa',
        criterioJulgamento: parsed.criterioJulgamento ?? '',
        documentacaoExigida: parsed.documentacaoExigida ?? [],
        requisitosTecnicos: parsed.requisitosTecnicos ?? [],
        pontosAtencao: parsed.pontosAtencao ?? [],
        dataEntregaProposta: parsed.dataEntregaProposta ?? null,
        dataAberturaProposta: parsed.dataAberturaProposta ?? null,
        resumo: parsed.resumo ?? '',
        analiseCompleta: parsed.analiseCompleta ?? '',
      };
    } catch {
      throw new Error(`Falha ao parsear resposta da IA: ${clean.slice(0, 200)}`);
    }
  }
}

export const aiProviderService = new AIProviderService();
