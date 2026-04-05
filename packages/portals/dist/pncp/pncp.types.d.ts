export interface PNCPContratacao {
    numeroControlePNCP: string;
    orgaoEntidade: {
        cnpj: string;
        razaoSocial: string;
    };
    unidadeOrgao: {
        codigoUnidade: string;
        nomeUnidade: string;
        ufNome: string;
        ufSigla: string;
    };
    modalidadeId: number;
    modalidadeNome: string;
    objetoCompra: string;
    valorTotalEstimado?: number;
    valorTotalHomologado?: number;
    situacaoCompraId: number;
    situacaoCompraNome: string;
    dataPublicacaoPncp: string;
    dataAberturaProposta?: string;
    dataEncerramentoProposta?: string;
    linkSistemaOrigem?: string;
    sequencialCompra: number;
    anoCompra: number;
}
export interface PNCPListResponse {
    data: PNCPContratacao[];
    totalRegistros: number;
    totalPaginas: number;
    numeroPagina: number;
    paginasRestantes: number;
}
export interface PNCPDocumento {
    sequencialDocumento: number;
    titulo: string;
    url: string;
    tipoDocumentoId: number;
    tipoDocumentoNome: string;
    dataPublicacao: string;
}
//# sourceMappingURL=pncp.types.d.ts.map