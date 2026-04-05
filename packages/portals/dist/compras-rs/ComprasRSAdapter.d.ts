import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';
export declare class ComprasRSAdapter extends BaseAdapter {
    readonly portalSlug = "compras-rs";
    readonly portalName = "ComprasRS";
    constructor();
    fetchLicitacoes(_since: Date, _options: FetchLicitacoesOptions): AsyncGenerator<LicitacaoColetada>;
    fetchDetalhes(_externalId: string): Promise<LicitacaoColetada>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=ComprasRSAdapter.d.ts.map