import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';
export declare class ComprasRSAdapter extends BaseAdapter {
    readonly portalSlug = "compras-rs";
    readonly portalName = "ComprasRS";
    constructor();
    fetchLicitacoes(since: Date, options: FetchLicitacoesOptions): AsyncGenerator<LicitacaoColetada>;
    fetchDetalhes(externalId: string): Promise<LicitacaoColetada>;
    healthCheck(): Promise<boolean>;
    private mapToLicitacao;
}
//# sourceMappingURL=ComprasRSAdapter.d.ts.map