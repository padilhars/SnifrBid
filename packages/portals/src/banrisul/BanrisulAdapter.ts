import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';

// FILTRO_LOCAL: Banrisul — portal do banco gaúcho, exclusivo do RS.
// API REST baseada em JSON — filtros por modalidade aplicados localmente.

interface BanrisulItem {
  id: string | number;
  numero?: string;
  objeto: string;
  modalidade?: string;
  valor?: number;
  valorEstimado?: number;
  situacao?: string;
  status?: string;
  dataPublicacao?: string;
  dataAbertura?: string;
  dataEncerramento?: string;
  edital?: string;
  linkEdital?: string;
  [key: string]: unknown;
}

interface BanrisulListResponse {
  data?: BanrisulItem[];
  licitacoes?: BanrisulItem[];
  total?: number;
  pagina?: number;
  totalPaginas?: number;
  hasMore?: boolean;
}

// Banrisul usa modalidades em texto livre
const MODALIDADE_MAP: Record<string, string> = {
  'pregão': '6',
  'pregao': '6',
  'pregão eletrônico': '6',
  'pregão presencial': '7',
  'dispensa': '8',
  'inexigibilidade': '9',
  'concorrência': '4',
  'tomada de preços': '5',
  'convite': '7',
};

function mapModalidade(modalidade?: string): string | undefined {
  if (!modalidade) return undefined;
  const lower = modalidade.toLowerCase().trim();
  return MODALIDADE_MAP[lower] ?? undefined;
}

export class BanrisulAdapter extends BaseAdapter {
  readonly portalSlug = 'banrisul';
  readonly portalName = 'Banrisul';

  constructor() {
    super('https://licitacoes.banrisul.com.br');
  }

  async *fetchLicitacoes(
    since: Date,
    options: FetchLicitacoesOptions,
  ): AsyncGenerator<LicitacaoColetada> {
    const { modalidadeCodes, ufCodes } = options;

    // Banrisul é exclusivo do RS
    if (!ufCodes.includes('RS')) return;

    let pagina = 1;
    const tamanhoPagina = 50;

    while (true) {
      const response = await this.get<BanrisulListResponse>('/api/v1/licitacoes', {
        pagina,
        tamanhoPagina,
        ordenacao: 'dataPublicacao',
        direcao: 'DESC',
      });

      const items = response.data ?? response.licitacoes ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        // FILTRO_LOCAL: data
        if (item.dataPublicacao) {
          const pubDate = new Date(item.dataPublicacao);
          if (pubDate < since) {
            if (pagina > 1) return;
            continue;
          }
        }

        // FILTRO_LOCAL: modalidade
        const itemModalidadeCode = mapModalidade(item.modalidade);
        if (modalidadeCodes.length > 0 && itemModalidadeCode && !modalidadeCodes.includes(itemModalidadeCode)) {
          continue;
        }

        yield this.mapToLicitacao(item);
      }

      const hasMore = response.hasMore ?? (response.totalPaginas !== undefined && pagina < response.totalPaginas);
      if (!hasMore || items.length < tamanhoPagina) break;
      pagina++;
    }
  }

  async fetchDetalhes(externalId: string): Promise<LicitacaoColetada> {
    const item = await this.get<BanrisulItem>(`/api/v1/licitacoes/${externalId}`);
    return this.mapToLicitacao(item);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.get<BanrisulListResponse>('/api/v1/licitacoes', {
        pagina: 1,
        tamanhoPagina: 1,
      });
      const items = res.data ?? res.licitacoes ?? [];
      return items.length >= 0;
    } catch {
      return false;
    }
  }

  private mapToLicitacao(item: BanrisulItem): LicitacaoColetada {
    const externalId = String(item.id ?? item.numero ?? '');
    return {
      externalId,
      objeto: item.objeto ?? '',
      orgaoNome: 'Banrisul',
      ufCode: 'RS',
      modalidadeCode: mapModalidade(item.modalidade),
      valorEstimado: item.valorEstimado ?? item.valor,
      status: item.situacao ?? item.status,
      dataPublicacao: item.dataPublicacao ? new Date(item.dataPublicacao) : undefined,
      dataAbertura: item.dataAbertura ? new Date(item.dataAbertura) : undefined,
      dataEncerramento: item.dataEncerramento ? new Date(item.dataEncerramento) : undefined,
      editalUrl: item.edital ?? item.linkEdital,
      portalUrl: `https://licitacoes.banrisul.com.br/licitacoes/${externalId}`,
      rawData: item as Record<string, unknown>,
    };
  }
}
