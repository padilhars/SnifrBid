import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';
export declare class BNCAdapter extends BaseAdapter {
    readonly portalSlug = "bnc";
    readonly portalName = "BNC";
    constructor();
    fetchLicitacoes(_since: Date, _options: FetchLicitacoesOptions): AsyncGenerator<LicitacaoColetada>;
    fetchDetalhes(_externalId: string): Promise<LicitacaoColetada>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=BNCAdapter.d.ts.map