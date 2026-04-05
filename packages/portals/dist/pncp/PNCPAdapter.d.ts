import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';
export declare class PNCPAdapter extends BaseAdapter {
    readonly portalSlug = "pncp";
    readonly portalName = "PNCP";
    constructor();
    fetchLicitacoes(since: Date, options: FetchLicitacoesOptions): AsyncGenerator<LicitacaoColetada>;
    fetchDetalhes(externalId: string): Promise<LicitacaoColetada>;
    healthCheck(): Promise<boolean>;
    private mapToLicitacao;
}
//# sourceMappingURL=PNCPAdapter.d.ts.map