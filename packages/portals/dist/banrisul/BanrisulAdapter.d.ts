import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';
export declare class BanrisulAdapter extends BaseAdapter {
    readonly portalSlug = "banrisul";
    readonly portalName = "Banrisul";
    constructor();
    fetchLicitacoes(_since: Date, _options: FetchLicitacoesOptions): AsyncGenerator<LicitacaoColetada>;
    fetchDetalhes(_externalId: string): Promise<LicitacaoColetada>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=BanrisulAdapter.d.ts.map