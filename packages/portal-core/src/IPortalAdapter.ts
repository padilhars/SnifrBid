import type { LicitacaoColetada, FetchLicitacoesOptions } from './types.js';

export interface IPortalAdapter {
  readonly portalSlug: string;
  readonly portalName: string;

  /**
   * Coleta licitações publicadas/atualizadas desde `since`.
   * Filtros obrigatórios — não há coleta sem escopo definido.
   * Deve ser idempotente.
   */
  fetchLicitacoes(
    since: Date,
    options: FetchLicitacoesOptions
  ): AsyncGenerator<LicitacaoColetada>;

  /**
   * Busca detalhes completos de uma licitação específica, incluindo documentos.
   */
  fetchDetalhes(externalId: string): Promise<LicitacaoColetada>;

  /**
   * Verifica se o portal está acessível.
   */
  healthCheck(): Promise<boolean>;
}
