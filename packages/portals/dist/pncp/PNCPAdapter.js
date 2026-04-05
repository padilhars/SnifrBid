import { BaseAdapter } from '@snifrbid/portal-core';
import { formatDateBrasilia } from '@snifrbid/shared';
const PNCP_BASE_URL = 'https://pncp.gov.br/api/pncp/v1';
const PAGE_SIZE = 500;
export class PNCPAdapter extends BaseAdapter {
    portalSlug = 'pncp';
    portalName = 'PNCP';
    constructor() {
        super(PNCP_BASE_URL);
    }
    async *fetchLicitacoes(since, options) {
        const { modalidadeCodes, ufCodes, until = new Date() } = options;
        const dataInicial = formatDateBrasilia(since, 'YYYYMMDD');
        const dataFinal = formatDateBrasilia(until, 'YYYYMMDD');
        for (const modalidadeCode of modalidadeCodes) {
            for (const ufCode of ufCodes) {
                let pagina = 1;
                while (true) {
                    const response = await this.get('/contratacoes/publicacao', {
                        dataInicial,
                        dataFinal,
                        codigoModalidadeContratacao: modalidadeCode,
                        uf: ufCode,
                        pagina,
                        tamanhoPagina: PAGE_SIZE,
                    });
                    if (!response.data?.length)
                        break;
                    for (const item of response.data) {
                        yield this.mapToLicitacao(item);
                    }
                    if (response.data.length < PAGE_SIZE)
                        break;
                    pagina++;
                }
            }
        }
    }
    async fetchDetalhes(externalId) {
        // externalId = "cnpj/ano/sequencial"
        const parts = externalId.split('/');
        if (parts.length !== 3)
            throw new Error(`externalId inválido para PNCP: ${externalId}`);
        const [cnpj, ano, sequencial] = parts;
        const item = await this.get(`/contratacoes/${cnpj}/${ano}/${sequencial}`);
        // Buscar documentos
        let documentos = [];
        try {
            const docsRes = await this.get(`/contratacoes/${cnpj}/${ano}/${sequencial}/documentos`);
            documentos = docsRes.data ?? [];
        }
        catch {
            // documentos opcionais — não bloquear se falhar
        }
        return this.mapToLicitacao(item, documentos);
    }
    async healthCheck() {
        try {
            const hoje = new Date();
            const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
            await this.get('/contratacoes/publicacao', {
                dataInicial: formatDateBrasilia(ontem, 'YYYYMMDD'),
                dataFinal: formatDateBrasilia(hoje, 'YYYYMMDD'),
                codigoModalidadeContratacao: '6',
                uf: 'SP',
                pagina: 1,
                tamanhoPagina: 1,
            });
            return true;
        }
        catch {
            return false;
        }
    }
    mapToLicitacao(item, documentos = []) {
        const cnpj = item.orgaoEntidade?.cnpj ?? '';
        const ano = item.anoCompra;
        const seq = item.sequencialCompra;
        const externalId = `${cnpj}/${ano}/${seq}`;
        return {
            externalId,
            objeto: item.objetoCompra ?? '',
            orgaoNome: item.unidadeOrgao?.nomeUnidade ?? item.orgaoEntidade?.razaoSocial,
            orgaoCnpj: cnpj,
            modalidadeCode: String(item.modalidadeId),
            ufCode: item.unidadeOrgao?.ufSigla,
            valorEstimado: item.valorTotalEstimado,
            status: item.situacaoCompraNome,
            dataPublicacao: item.dataPublicacaoPncp
                ? new Date(item.dataPublicacaoPncp)
                : undefined,
            dataAbertura: item.dataAberturaProposta
                ? new Date(item.dataAberturaProposta)
                : undefined,
            dataEncerramento: item.dataEncerramentoProposta
                ? new Date(item.dataEncerramentoProposta)
                : undefined,
            portalUrl: item.linkSistemaOrigem,
            documentos: documentos.map(d => ({
                tipo: d.tipoDocumentoNome ?? 'anexo',
                nome: d.titulo,
                url: d.url,
            })),
            rawData: item,
        };
    }
}
//# sourceMappingURL=PNCPAdapter.js.map