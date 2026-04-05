import { BaseAdapter } from '@snifrbid/portal-core';
// Mapeamento de siglas de estado para código UF (BNC usa nome por extenso em alguns casos)
const ESTADO_TO_UF = {
    'acre': 'AC', 'alagoas': 'AL', 'amapa': 'AP', 'amazonas': 'AM',
    'bahia': 'BA', 'ceara': 'CE', 'distritofederal': 'DF', 'espiritosanto': 'ES',
    'goias': 'GO', 'maranhao': 'MA', 'matogrosso': 'MT', 'matogrossodosul': 'MS',
    'minasgerais': 'MG', 'para': 'PA', 'paraiba': 'PB', 'parana': 'PR',
    'pernambuco': 'PE', 'piaui': 'PI', 'riodejaneiro': 'RJ', 'riograndedonorte': 'RN',
    'riograndedosul': 'RS', 'rondonia': 'RO', 'roraima': 'RR', 'santacatarina': 'SC',
    'saopaulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO',
};
function normalizeUf(uf, estado) {
    if (!uf && !estado)
        return undefined;
    const raw = (uf ?? estado ?? '').toUpperCase().trim();
    if (raw.length === 2)
        return raw;
    // Tenta mapear nome por extenso
    const key = raw.toLowerCase().replace(/[^a-z]/g, '');
    return ESTADO_TO_UF[key];
}
export class BNCAdapter extends BaseAdapter {
    portalSlug = 'bnc';
    portalName = 'BNC';
    constructor() {
        super('https://bnc.org.br');
    }
    async *fetchLicitacoes(since, options) {
        const { modalidadeCodes, ufCodes } = options;
        let page = 1;
        const pageSize = 50;
        while (true) {
            const response = await this.get('/api/licitacoes', {
                page,
                per_page: pageSize,
                orderby: 'data_publicacao',
                order: 'desc',
            });
            const items = response.data ?? response.items ?? response.licitacoes ?? [];
            if (items.length === 0)
                break;
            for (const item of items) {
                // FILTRO_LOCAL: data de publicação
                if (item.dataPublicacao) {
                    const pubDate = new Date(item.dataPublicacao);
                    if (pubDate < since) {
                        if (page > 1)
                            return; // ordenação desc — pode parar
                        continue;
                    }
                }
                // FILTRO_LOCAL: UF
                const itemUf = normalizeUf(item.uf, item.estado);
                if (ufCodes.length > 0 && itemUf && !ufCodes.includes(itemUf))
                    continue;
                // FILTRO_LOCAL: modalidade (BNC usa texto livre)
                if (modalidadeCodes.length > 0 && item.modalidade) {
                    const lower = item.modalidade.toLowerCase();
                    const hasMatch = modalidadeCodes.some((code) => {
                        if (code === '6' && (lower.includes('pregão') || lower.includes('pregao')))
                            return true;
                        if (code === '8' && lower.includes('dispensa'))
                            return true;
                        if (code === '9' && lower.includes('inexigibilidade'))
                            return true;
                        if (code === '4' && lower.includes('concorrência'))
                            return true;
                        return false;
                    });
                    if (!hasMatch)
                        continue;
                }
                yield this.mapToLicitacao(item);
            }
            const lastPage = response.meta?.lastPage ?? response.lastPage;
            if (lastPage !== undefined && page >= lastPage)
                break;
            if (items.length < pageSize)
                break;
            page++;
        }
    }
    async fetchDetalhes(externalId) {
        const item = await this.get(`/api/licitacoes/${externalId}`);
        return this.mapToLicitacao(item);
    }
    async healthCheck() {
        try {
            const res = await this.get('/api/licitacoes', { page: 1, per_page: 1 });
            const items = res.data ?? res.items ?? res.licitacoes ?? [];
            return items.length >= 0;
        }
        catch {
            return false;
        }
    }
    mapToLicitacao(item) {
        return {
            externalId: String(item.id),
            objeto: item.objeto ?? item.titulo ?? item.descricao ?? '',
            orgaoNome: item.entidade,
            orgaoCnpj: item.cnpj,
            ufCode: normalizeUf(item.uf, item.estado),
            valorEstimado: item.valorEstimado ?? item.valor,
            status: item.status ?? item.situacao,
            dataPublicacao: item.dataPublicacao ? new Date(item.dataPublicacao) : undefined,
            dataAbertura: item.dataAbertura ? new Date(item.dataAbertura) : undefined,
            dataEncerramento: item.dataEncerramento ? new Date(item.dataEncerramento) : undefined,
            editalUrl: item.edital,
            portalUrl: item.link ?? `https://bnc.org.br/licitacoes/${item.id}`,
            rawData: item,
        };
    }
}
//# sourceMappingURL=BNCAdapter.js.map