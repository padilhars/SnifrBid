'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight, ExternalLink, FileText, ClipboardList, Paperclip, FileCheck,
  ShieldCheck, ShieldAlert, ShieldX, AlertOctagon, Download,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { ScoreBadge } from '@/components/shared/ScoreBadge';
import { api } from '@/lib/api';
import { formatDate, formatDateTime, formatCurrency, cn, riscoBadgeConfig } from '@/lib/utils';
import { toast } from 'sonner';
import type { Match, LicitacaoSnapshot } from '@/types';

type DetailsTab = 'analise' | 'relevancia' | 'historico' | 'documentos' | 'snapshots';

const DETAIL_TABS: { id: DetailsTab; label: string }[] = [
  { id: 'analise', label: 'Análise da IA' },
  { id: 'relevancia', label: 'Relevância' },
  { id: 'historico', label: 'Histórico' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'snapshots', label: 'Snapshots' },
];

function RiscoIcon({ nivel }: { nivel?: string }) {
  switch (nivel) {
    case 'baixo': return <ShieldCheck size={16} className="text-success" />;
    case 'medio': return <ShieldAlert size={16} className="text-warning" />;
    case 'alto': return <ShieldX size={16} className="text-danger" />;
    case 'critico': return <AlertOctagon size={16} className="text-red-600" />;
    default: return null;
  }
}

function DocIcon({ tipo }: { tipo?: string }) {
  const t = tipo?.toLowerCase() ?? '';
  if (t.includes('edital')) return <FileText size={16} className="text-primary" />;
  if (t.includes('tr') || t.includes('termo')) return <ClipboardList size={16} className="text-info" />;
  if (t.includes('ata')) return <FileCheck size={16} className="text-success" />;
  return <Paperclip size={16} className="text-foreground-muted" />;
}

export default function OportunidadeDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<DetailsTab>('analise');

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ['match', id],
    queryFn: async () => {
      const res = await api.get<Match>(`/licitacoes/matches/${id}`);
      return res.data;
    },
  });

  const { data: snapshots } = useQuery<LicitacaoSnapshot[]>({
    queryKey: ['snapshots', match?.licitacaoId],
    queryFn: async () => {
      const res = await api.get<LicitacaoSnapshot[]>(`/licitacoes/${match!.licitacaoId}/snapshots`);
      return res.data;
    },
    enabled: !!match?.licitacaoId && activeTab === 'snapshots',
  });

  const analysisMutation = useMutation({
    mutationFn: () => api.post(`/licitacoes/matches/${id}/analyze`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match', id] });
      toast.success('Análise solicitada');
    },
    onError: () => toast.error('Erro ao solicitar análise'),
  });

  if (isLoading) {
    return (
      <AppShell title="Oportunidade">
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </AppShell>
    );
  }

  if (!match?.licitacao) {
    return (
      <AppShell title="Oportunidade">
        <p className="text-foreground-muted">Match não encontrado.</p>
      </AppShell>
    );
  }

  const lic = match.licitacao;
  const analysis = match.analyses?.[0];

  return (
    <AppShell title="Oportunidade">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-foreground-muted">
          <Link href="/oportunidades" className="hover:text-foreground">Oportunidades</Link>
          <ChevronRight size={14} />
          <span className="text-foreground truncate max-w-xs">{lic.objeto.slice(0, 60)}…</span>
        </nav>

        {/* Header */}
        <div className="bg-background-secondary border border-border rounded-xl p-6 space-y-4">
          <h1 className="text-xl font-bold text-foreground">{lic.objeto}</h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              { label: 'Portal', value: lic.portal?.name },
              { label: 'Modalidade', value: lic.modalidade?.name },
              { label: 'UF', value: lic.ufCode },
              { label: 'Órgão', value: lic.orgaoNome },
              { label: 'CNPJ', value: lic.orgaoCnpj },
              { label: 'Valor estimado', value: formatCurrency(lic.valorEstimado) },
              { label: 'Abertura', value: formatDateTime(lic.dataAbertura) },
              { label: 'Encerramento', value: formatDate(lic.dataEncerramento) },
            ].map(({ label, value }) => value ? (
              <div key={label}>
                <p className="text-xs text-foreground-muted">{label}</p>
                <p className="text-foreground font-medium truncate">{value}</p>
              </div>
            ) : null)}
          </div>

          {/* Ações */}
          <div className="flex flex-wrap gap-2">
            <ScoreBadge score={match.scoreFinal} />
            {lic.portalUrl && (
              <a
                href={lic.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
              >
                <ExternalLink size={14} />
                Acessar no portal
              </a>
            )}
          </div>
        </div>

        {/* Abas de detalhes */}
        <div className="flex gap-1 border-b border-border">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das abas */}
        <div>
          {/* Aba: Análise */}
          {activeTab === 'analise' && (
            <div className="space-y-4">
              {match.status === 'pending' && (
                <div className="text-center py-12 bg-background-secondary border border-border rounded-xl">
                  <p className="text-foreground-muted mb-4">Esta licitação ainda não foi analisada.</p>
                  <button
                    onClick={() => analysisMutation.mutate()}
                    disabled={analysisMutation.isPending}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 text-sm font-medium"
                  >
                    Solicitar análise
                  </button>
                </div>
              )}

              {match.status === 'analyzing' && (
                <div className="bg-background-secondary border border-border rounded-xl p-6">
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-background-tertiary rounded w-1/3" />
                    <div className="h-4 bg-background-tertiary rounded w-full" />
                    <div className="h-4 bg-background-tertiary rounded w-3/4" />
                  </div>
                  <p className="mt-4 text-sm text-foreground-muted text-center">Analisando documentos...</p>
                </div>
              )}

              {match.status === 'quota_exceeded' && (
                <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
                  Limite de análises do plano atingido. O contador será resetado no início do próximo mês.
                </div>
              )}

              {analysis && !analysis.errorMessage && (
                <div className="space-y-4">
                  {/* Resumo */}
                  <div className="bg-background-secondary border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground mb-3">Resumo executivo</h3>
                    <p className="text-sm text-foreground-muted whitespace-pre-line">{analysis.resumo}</p>
                  </div>

                  {/* Critério + Documentação */}
                  <div className="bg-background-secondary border border-border rounded-xl p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Critério de julgamento</h4>
                        <p className="text-sm text-foreground-muted">{analysis.criterioJulgamento || '—'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Documentação exigida</h4>
                        <ul className="space-y-1">
                          {analysis.documentacaoExigida?.map((doc, i) => (
                            <li key={i} className="text-sm text-foreground-muted flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>{doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Requisitos técnicos */}
                  {analysis.requisitosTecnicos && analysis.requisitosTecnicos.length > 0 && (
                    <div className="bg-background-secondary border border-border rounded-xl p-5">
                      <h3 className="font-semibold text-foreground mb-3">Requisitos técnicos</h3>
                      <ul className="space-y-1">
                        {analysis.requisitosTecnicos.map((req, i) => (
                          <li key={i} className="text-sm text-foreground-muted flex items-start gap-2">
                            <span className="text-info mt-0.5">•</span>{req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Pontos de atenção */}
                  {analysis.pontosAtencao && analysis.pontosAtencao.length > 0 && (
                    <div className="bg-background-secondary border border-border rounded-xl p-5">
                      <h3 className="font-semibold text-foreground mb-3">Pontos de atenção</h3>
                      <ul className="space-y-1">
                        {analysis.pontosAtencao.map((p, i) => (
                          <li key={i} className="text-sm text-warning flex items-start gap-2">
                            <span>⚠</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Datas extraídas */}
                  <div className="bg-background-secondary border border-border rounded-xl p-5">
                    <h3 className="font-semibold text-foreground mb-3">Datas extraídas</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-foreground-muted">Entrega proposta</p>
                        <p className="text-foreground">{formatDateTime(analysis.dataEntregaProposta) || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground-muted">Abertura propostas</p>
                        <p className="text-foreground">{formatDateTime(analysis.dataAberturaProposta) || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Análise completa — collapsible */}
                  {analysis.analiseCompleta && (
                    <details className="bg-background-secondary border border-border rounded-xl">
                      <summary className="p-5 cursor-pointer font-semibold text-foreground select-none hover:bg-background-tertiary rounded-xl">
                        Análise completa
                      </summary>
                      <div className="px-5 pb-5 pt-0 text-sm text-foreground-muted whitespace-pre-line">
                        {analysis.analiseCompleta}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Aba: Relevância */}
          {activeTab === 'relevancia' && (
            <div className="space-y-4">
              {analysis && (
                <>
                  {/* Score principal */}
                  <div className="bg-background-secondary border border-border rounded-xl p-6 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground">{analysis.scoreAderencia ?? '—'}</div>
                        <div className="text-xs text-foreground-muted">de 100</div>
                      </div>
                    </div>
                    <p className="mt-3 font-medium text-foreground">
                      {(analysis.scoreAderencia ?? 0) >= 80 ? 'Alta aderência' :
                        (analysis.scoreAderencia ?? 0) >= 60 ? 'Aderência média' :
                        (analysis.scoreAderencia ?? 0) >= 40 ? 'Aderência baixa' : 'Fora do perfil'}
                    </p>
                  </div>

                  {/* Dimensões */}
                  <div className="bg-background-secondary border border-border rounded-xl p-5 space-y-5">
                    {[
                      { label: 'Aderência ao interesse', value: (analysis.scoreAderencia ?? 0), max: 100, unit: '/100' },
                    ].map(({ label, value, max, unit }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <span className="text-sm text-foreground-muted">{value}{unit}</span>
                        </div>
                        <div className="h-2 rounded-full bg-background-tertiary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${(value / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Nível de risco</span>
                      <div className={cn('flex items-center gap-1.5 text-sm', riscoBadgeConfig(analysis.nivelRisco).className)}>
                        <RiscoIcon nivel={analysis.nivelRisco} />
                        {riscoBadgeConfig(analysis.nivelRisco).label}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Complexidade técnica</span>
                      <span className="text-sm text-foreground capitalize">{analysis.complexidadeTecnica ?? '—'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Estimativa de chances</span>
                      <span className="text-sm text-foreground capitalize">{analysis.estimativaChances ?? '—'}</span>
                    </div>
                  </div>

                  {/* Keywords */}
                  {match.matchedKeywords && match.matchedKeywords.length > 0 && (
                    <div className="bg-background-secondary border border-border rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Keywords que geraram o match</h3>
                      <div className="flex flex-wrap gap-2">
                        {match.matchedKeywords.map((kw) => (
                          <span key={kw} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Aba: Documentos */}
          {activeTab === 'documentos' && (
            <div className="bg-background-secondary border border-border rounded-xl divide-y divide-border">
              {lic.documentos && lic.documentos.length > 0 ? (
                lic.documentos.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-4">
                    <DocIcon tipo={doc.tipo} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.nome || doc.tipo || 'Documento'}</p>
                      <p className="text-xs text-foreground-muted">{doc.tipo} {doc.tamanhoBytes ? `· ${(parseInt(doc.tamanhoBytes) / 1024).toFixed(0)} KB` : ''}</p>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                    >
                      <Download size={14} />
                      Baixar
                    </a>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-foreground-muted text-sm">
                  Nenhum documento disponível
                </div>
              )}
            </div>
          )}

          {/* Aba: Histórico */}
          {activeTab === 'historico' && (
            <div className="text-center py-12 text-foreground-muted text-sm">
              Histórico de eventos será carregado aqui.
            </div>
          )}

          {/* Aba: Snapshots */}
          {activeTab === 'snapshots' && (
            <div className="space-y-3">
              {snapshots && snapshots.length > 0 ? (
                snapshots.map((snap) => (
                  <div key={snap.id} className="bg-background-secondary border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-foreground-muted">{formatDateTime(snap.createdAt)}</span>
                      {snap.changesDetected && Object.keys(snap.changesDetected).length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30">
                          {Object.keys(snap.changesDetected).length} alteraç{Object.keys(snap.changesDetected).length === 1 ? 'ão' : 'ões'}
                        </span>
                      )}
                    </div>
                    {snap.changesDetected && Object.keys(snap.changesDetected).length > 0 && (
                      <ul className="text-xs text-foreground-muted space-y-0.5">
                        {Object.entries(snap.changesDetected).map(([field]) => (
                          <li key={field}>• {field} alterado</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-foreground-muted text-sm">
                  Nenhum snapshot disponível
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
