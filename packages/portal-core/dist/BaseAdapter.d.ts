import type { IPortalAdapter } from './IPortalAdapter.js';
import type { LicitacaoColetada, FetchLicitacoesOptions } from './types.js';
export declare abstract class BaseAdapter implements IPortalAdapter {
    abstract readonly portalSlug: string;
    abstract readonly portalName: string;
    protected readonly baseUrl: string;
    protected readonly timeoutMs: number;
    constructor(baseUrl: string, timeoutMs?: number);
    abstract fetchLicitacoes(since: Date, options: FetchLicitacoesOptions): AsyncGenerator<LicitacaoColetada>;
    abstract fetchDetalhes(externalId: string): Promise<LicitacaoColetada>;
    healthCheck(): Promise<boolean>;
    /**
     * GET com retry automático, backoff exponencial e timeout.
     */
    protected get<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T>;
    protected log(level: 'info' | 'warn' | 'error', msg: string): void;
    protected sleep(ms: number): Promise<void>;
}
//# sourceMappingURL=BaseAdapter.d.ts.map