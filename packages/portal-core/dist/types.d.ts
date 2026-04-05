export interface LicitacaoColetada {
    externalId: string;
    objeto: string;
    orgaoNome?: string;
    orgaoCnpj?: string;
    modalidadeCode?: string;
    ufCode?: string;
    valorEstimado?: number;
    status?: string;
    dataPublicacao?: Date;
    dataAbertura?: Date;
    dataEncerramento?: Date;
    editalUrl?: string;
    portalUrl?: string;
    documentos?: Array<{
        tipo: string;
        nome: string;
        url: string;
    }>;
    rawData: Record<string, unknown>;
}
export interface FetchLicitacoesOptions {
    modalidadeCodes: string[];
    ufCodes: string[];
    until?: Date;
}
//# sourceMappingURL=types.d.ts.map