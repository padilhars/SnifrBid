import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';

// FILTRO_LOCAL: A API do ComprasRS não suporta filtro por modalidade/UF nativamente.
// Os dados são coletados e filtrados localmente antes do yield.
// Isso aumenta o volume de requisições mas garante consistência com a interface.
export class ComprasRSAdapter extends BaseAdapter {
  readonly portalSlug = 'compras-rs';
  readonly portalName = 'ComprasRS';

  constructor() {
    super('https://www.compras.rs.gov.br');
  }

  async *fetchLicitacoes(
    _since: Date,
    _options: FetchLicitacoesOptions,
  ): AsyncGenerator<LicitacaoColetada> {
    // DECISÃO: implementação placeholder — ComprasRS requer análise da API
    // antes de implementação completa (Fase 10)
    this.log('info', 'ComprasRS adapter — implementação completa na Fase 10');
    return;
    // eslint-disable-next-line no-unreachable
    yield {} as LicitacaoColetada; // satisfaz o tipo AsyncGenerator
  }

  async fetchDetalhes(_externalId: string): Promise<LicitacaoColetada> {
    throw new Error('ComprasRS: fetchDetalhes será implementado na Fase 10');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(this.baseUrl, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
