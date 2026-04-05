import { BaseAdapter } from '@snifrbid/portal-core';
// FILTRO_LOCAL: BNC não expõe API pública — scraping será implementado na Fase 10
export class BNCAdapter extends BaseAdapter {
    portalSlug = 'bnc';
    portalName = 'BNC';
    constructor() {
        super('https://bnc.org.br');
    }
    async *fetchLicitacoes(_since, _options) {
        this.log('info', 'BNC adapter — implementação completa na Fase 10');
        return;
        // eslint-disable-next-line no-unreachable
        yield {};
    }
    async fetchDetalhes(_externalId) {
        throw new Error('BNC: fetchDetalhes será implementado na Fase 10');
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
//# sourceMappingURL=BNCAdapter.js.map