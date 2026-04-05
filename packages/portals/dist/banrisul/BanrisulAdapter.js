import { BaseAdapter } from '@snifrbid/portal-core';
// FILTRO_LOCAL: Banrisul — portal específico do banco gaúcho, API a analisar na Fase 10
export class BanrisulAdapter extends BaseAdapter {
    portalSlug = 'banrisul';
    portalName = 'Banrisul';
    constructor() {
        super('https://licitacoes.banrisul.com.br');
    }
    async *fetchLicitacoes(_since, _options) {
        this.log('info', 'Banrisul adapter — implementação completa na Fase 10');
        return;
        // eslint-disable-next-line no-unreachable
        yield {};
    }
    async fetchDetalhes(_externalId) {
        throw new Error('Banrisul: fetchDetalhes será implementado na Fase 10');
    }
    async healthCheck() {
        try {
            const res = await fetch(this.baseUrl, { signal: AbortSignal.timeout(5000) });
            return res.ok;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=BanrisulAdapter.js.map