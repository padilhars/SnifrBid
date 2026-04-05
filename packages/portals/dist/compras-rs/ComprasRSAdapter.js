import { BaseAdapter } from '@snifrbid/portal-core';
// FILTRO_LOCAL: A API do ComprasRS não suporta filtro por modalidade/UF nativamente.
// Os dados são coletados e filtrados localmente antes do yield.
// Isso aumenta o volume de requisições mas garante consistência com a interface.
export class ComprasRSAdapter extends BaseAdapter {
    portalSlug = 'compras-rs';
    portalName = 'ComprasRS';
    constructor() {
        super('https://www.compras.rs.gov.br');
    }
    async *fetchLicitacoes(_since, _options) {
        // DECISÃO: implementação placeholder — ComprasRS requer análise da API
        // antes de implementação completa (Fase 10)
        this.log('info', 'ComprasRS adapter — implementação completa na Fase 10');
        return;
        // eslint-disable-next-line no-unreachable
        yield {}; // satisfaz o tipo AsyncGenerator
    }
    async fetchDetalhes(_externalId) {
        throw new Error('ComprasRS: fetchDetalhes será implementado na Fase 10');
    }
    async healthCheck() {
        try {
            const res = await fetch(this.baseUrl, {
                signal: AbortSignal.timeout(5000),
            });
            return res.ok;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=ComprasRSAdapter.js.map