import { BaseAdapter } from '@snifrbid/portal-core';
import type { LicitacaoColetada, FetchLicitacoesOptions } from '@snifrbid/portal-core';

// FILTRO_LOCAL: BNC não expõe API pública — scraping será implementado na Fase 10
export class BNCAdapter extends BaseAdapter {
  readonly portalSlug = 'bnc';
  readonly portalName = 'BNC';

  constructor() {
    super('https://bnc.org.br');
  }

  async *fetchLicitacoes(
    _since: Date,
    _options: FetchLicitacoesOptions,
  ): AsyncGenerator<LicitacaoColetada> {
    this.log('info', 'BNC adapter — implementação completa na Fase 10');
    return;
    // eslint-disable-next-line no-unreachable
    yield {} as LicitacaoColetada;
  }

  async fetchDetalhes(_externalId: string): Promise<LicitacaoColetada> {
    throw new Error('BNC: fetchDetalhes será implementado na Fase 10');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(this.baseUrl, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}
