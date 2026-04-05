import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';
export declare class BNCAdapter extends BaseAdapter {
    readonly portalSlug = "bnc";
    readonly portalName = "BNC";
    constructor();
    fetchLicitacoes(since: Date, options: FetchLicitacoesOptions): AsyncGenerator<LicitacaoColetada>;
    fetchDetalhes(externalId: string): Promise<LicitacaoColetada>;
    healthCheck(): Promise<boolean>;
    private mapToLicitacao;
}
//# sourceMappingURL=BNCAdapter.d.ts.map