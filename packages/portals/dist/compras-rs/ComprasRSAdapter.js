import { BaseAdapter } from '@snifrbid/portal-core';
// Mapeamento de modalidades do ComprasRS para códigos padrão
const MODALIDADE_MAP = {
    'pregao eletronico': '6',
    'pregão eletrônico': '6',
    'pregao presencial': '7',
    'pregão presencial': '7',
    'dispensa': '8',
    'dispensa de licitacao': '8',
    'inexigibilidade': '9',
    'concorrencia': '4',
    'concorrência': '4',
    'tomada de precos': '5',
    'tomada de preços': '5',
    'convite': '7',
    'leilao': '1',
    'leilão': '1',
};
function mapModalidade(modalidade) {
    if (!modalidade)
        return undefined;
    const lower = modalidade.toLowerCase().trim();
    return MODALIDADE_MAP[lower] ?? undefined;
}
export class ComprasRSAdapter extends BaseAdapter {
    portalSlug = 'compras-rs';
    portalName = 'ComprasRS';
    constructor() {
        super('https://www.compras.rs.gov.br');
    }
    async *fetchLicitacoes(since, options) {
        const { modalidadeCodes, ufCodes } = options;
        // ComprasRS é exclusivo do RS — apenas filtramos UF RS
        if (!ufCodes.includes('RS'))
            return;
        let page = 0;
        const pageSize = 100;
        while (true) {
            const response = await this.get('/portal/licitacoes', {
                page,
                size: pageSize,
                sort: 'dataPublicacao,desc',
            });
            const items = response.items ?? response.data ?? response.content ?? [];
            if (items.length === 0)
                break;
            for (const item of items) {
                // FILTRO_LOCAL: verificar data de publicação
                if (item.dataPublicacao) {
                    const pubDate = new Date(item.dataPublicacao);
                    if (pubDate < since) {
                        // Itens ordenados por data desc — se chegou antes do since, para
                        if (page > 0)
                            return;
                        continue;
                    }
                }
                // FILTRO_LOCAL: verificar modalidade
                const itemModalidadeCode = mapModalidade(item.modalidade);
                if (modalidadeCodes.length > 0 && itemModalidadeCode && !modalidadeCodes.includes(itemModalidadeCode)) {
                    continue;
                }
                yield this.mapToLicitacao(item);
            }
            const isLast = response.last === true || items.length < pageSize;
            if (isLast)
                break;
            page++;
        }
    }
    async fetchDetalhes(externalId) {
        const item = await this.get(`/portal/licitacoes/${externalId}`);
        return this.mapToLicitacao(item);
    }
    async healthCheck() {
        try {
            const res = await this.get('/portal/licitacoes', { page: 0, size: 1 });
            const items = res.items ?? res.data ?? res.content ?? [];
            return items.length >= 0; // aceita lista vazia
        }
        catch {
            return false;
        }
    }
    mapToLicitacao(item) {
        return {
            externalId: String(item.id ?? item.numeroEdital ?? ''),
            objeto: item.objeto ?? '',
            orgaoNome: item.orgao,
            orgaoCnpj: item.cnpjOrgao,
            modalidadeCode: mapModalidade(item.modalidade),
            ufCode: 'RS', // ComprasRS é exclusivo do RS
            valorEstimado: item.valor ?? undefined,
            status: item.situacao,
            dataPublicacao: item.dataPublicacao ? new Date(item.dataPublicacao) : undefined,
            dataAbertura: item.dataAbertura ? new Date(item.dataAbertura) : undefined,
            dataEncerramento: item.dataEncerramento ? new Date(item.dataEncerramento) : undefined,
            editalUrl: item.linkEdital,
            portalUrl: item.url ?? `https://www.compras.rs.gov.br/portal/licitacoes/${item.id}`,
            rawData: item,
        };
    }
}
//# sourceMappingURL=ComprasRSAdapter.js.map