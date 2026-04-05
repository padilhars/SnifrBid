import type { IPortalAdapter } from './IPortalAdapter.js';
import type { LicitacaoColetada, FetchLicitacoesOptions } from './types.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

export abstract class BaseAdapter implements IPortalAdapter {
  abstract readonly portalSlug: string;
  abstract readonly portalName: string;

  protected readonly baseUrl: string;
  protected readonly timeoutMs: number;

  constructor(baseUrl: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  abstract fetchLicitacoes(
    since: Date,
    options: FetchLicitacoesOptions
  ): AsyncGenerator<LicitacaoColetada>;

  abstract fetchDetalhes(externalId: string): Promise<LicitacaoColetada>;

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.get('/');
      return res !== null;
    } catch {
      return false;
    }
  }

  /**
   * GET com retry automático, backoff exponencial e timeout.
   */
  protected async get<T = unknown>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path}`);

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    let lastError: Error = new Error('Nenhuma tentativa realizada');

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: { 'Accept': 'application/json', 'User-Agent': 'SnifrBid/1.0' },
        });

        clearTimeout(timer);

        // Rate limiting ou sobrecarga — esperar e tentar novamente
        if (res.status === 429 || res.status === 503) {
          const retryAfter = parseInt(res.headers.get('Retry-After') ?? '0', 10) || attempt * 10;
          this.log(`warn`, `HTTP ${res.status} — aguardando ${retryAfter}s (tentativa ${attempt}/${MAX_RETRIES})`);
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText} — ${url.toString()}`);
        }

        return await res.json() as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < MAX_RETRIES) {
          const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          this.log('warn', `Tentativa ${attempt}/${MAX_RETRIES} falhou: ${lastError.message} — retry em ${delayMs / 1000}s`);
          await this.sleep(delayMs);
        }
      }
    }

    throw lastError;
  }

  protected log(level: 'info' | 'warn' | 'error', msg: string) {
    const prefix = `[${this.portalName}]`;
    if (level === 'error') console.error(prefix, msg);
    else if (level === 'warn') console.warn(prefix, msg);
    else console.log(prefix, msg);
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
