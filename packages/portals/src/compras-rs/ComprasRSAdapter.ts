import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';

// FILTRO_LOCAL: ComprasRS não expõe filtros por modalidade/UF na API REST.
// Os dados são coletados paginados e filtrados localmente antes do yield.
// Rate limit conservador: o sistema de retry do BaseAdapter cobre erros 429/503.

interface ComprasRSItem {
  id: string | number;
  numeroEdital?: string;
  objeto: string;
  orgao?: string;
  cnpjOrgao?: string;
  modalidade?: string;
  valor?: number;
  situacao?: string;
  dataPublicacao?: string;
  dataAbertura?: string;
  dataEncerramento?: string;
  linkEdital?: string;
  url?: string;
  [key: string]: unknown;
}

interface ComprasRSListResponse {
  items?: ComprasRSItem[];
  data?: ComprasRSItem[];
  content?: ComprasRSItem[];
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
}

// Mapeamento de modalidades do ComprasRS para códigos padrão
const MODALIDADE_MAP: Record<string, string> = {
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

function mapModalidade(modalidade?: string): string | undefined {
  if (!modalidade) return undefined;
  const lower = modalidade.toLowerCase().trim();
  return MODALIDADE_MAP[lower] ?? undefined;
}

export class ComprasRSAdapter extends BaseAdapter {
  readonly portalSlug = 'compras-rs';
  readonly portalName = 'ComprasRS';

  constructor() {
    super('https://www.compras.rs.gov.br');
  }

  async *fetchLicitacoes(
    since: Date,
    options: FetchLicitacoesOptions,
  ): AsyncGenerator<LicitacaoColetada> {
    const { modalidadeCodes, ufCodes } = options;
    // ComprasRS é exclusivo do RS — apenas filtramos UF RS
    if (!ufCodes.includes('RS')) return;

    let page = 0;
    const pageSize = 100;

    while (true) {
      const response = await this.get<ComprasRSListResponse>('/portal/licitacoes', {
        page,
        size: pageSize,
        sort: 'dataPublicacao,desc',
      });

      const items = response.items ?? response.data ?? response.content ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        // FILTRO_LOCAL: verificar data de publicação
        if (item.dataPublicacao) {
          const pubDate = new Date(item.dataPublicacao);
          if (pubDate < since) {
            // Itens ordenados por data desc — se chegou antes do since, para
            if (page > 0) return;
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
      if (isLast) break;
      page++;
    }
  }

  async fetchDetalhes(externalId: string): Promise<LicitacaoColetada> {
    const item = await this.get<ComprasRSItem>(`/portal/licitacoes/${externalId}`);
    return this.mapToLicitacao(item);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.get<ComprasRSListResponse>('/portal/licitacoes', { page: 0, size: 1 });
      const items = res.items ?? res.data ?? res.content ?? [];
      return items.length >= 0; // aceita lista vazia
    } catch {
      return false;
    }
  }

  private mapToLicitacao(item: ComprasRSItem): LicitacaoColetada {
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
      rawData: item as Record<string, unknown>,
    };
  }
}
