import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';
export declare class BanrisulAdapter extends BaseAdapter {
    readonly portalSlug = "banrisul";
    readonly portalName = "Banrisul";
    constructor();
    fetchLicitacoes(since: Date, options: FetchLicitacoesOptions): AsyncGenerator<LicitacaoColetada>;
    fetchDetalhes(externalId: string): Promise<LicitacaoColetada>;
    healthCheck(): Promise<boolean>;
    private mapToLicitacao;
}
//# sourceMappingURL=BanrisulAdapter.d.ts.map