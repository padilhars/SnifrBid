'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OportunidadeCard } from '@/components/oportunidades/OportunidadeCard';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Match } from '@/types';

type FilterType = 'todas' | 'com_mudancas' | 'prazo_proximo';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'com_mudancas', label: 'Com mudanças recentes' },
  { id: 'prazo_proximo', label: 'Prazo próximo' },
];

interface MatchesPage {
  data: Array<Match & { lastChange?: { type: string; detectedAt: string } }>;
  total: number;
  newChanges: number;
  nextCursor?: string;
}

const CHANGE_LABELS: Record<string, { label: string; className: string }> = {
  status: { label: 'Status alterado', className: 'bg-info/10 text-info border-info/30' },
  prazo: { label: 'Prazo alterado', className: 'bg-warning/10 text-warning border-warning/30' },
  documento: { label: 'Novo documento', className: 'bg-success/10 text-success border-success/30' },
  valor: { label: 'Valor alterado', className: 'bg-primary/10 text-primary border-primary/20' },
};

export default function AcompanhamentoPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('todas');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery<MatchesPage>({
    queryKey: ['acompanhamento', filter],
    queryFn: async ({ pageParam }) => {
      const res = await api.get<MatchesPage>('/licitacoes/acompanhamento', {
        params: { filter, cursor: pageParam || undefined, limit: 20 },
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  });

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const favoriteMutation = useMutation({
    mutationFn: (matchId: string) => api.post('/licitacoes/favorites', { matchId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acompanhamento'] }),
    onError: () => toast.error('Erro ao atualizar favorito'),
  });

  const participandoMutation = useMutation({
    mutationFn: (matchId: string) => api.patch(`/licitacoes/matches/${matchId}/status`, { status: 'participando' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acompanhamento'] }),
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const dismissMutation = useMutation({
    mutationFn: (matchId: string) => api.patch(`/licitacoes/matches/${matchId}/status`, { status: 'dismissed' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['acompanhamento'] });
      toast.success('Licitação removida do acompanhamento');
    },
    onError: () => toast.error('Erro ao dispensar'),
  });

  const matches = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;
  const newChanges = data?.pages[0]?.newChanges ?? 0;

  return (
    <AppShell title="Acompanhamento">
      <div className="space-y-4">
        {/* Banner de novas mudanças */}
        {newChanges > 0 && (
          <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning/30 rounded-xl text-warning text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              <strong>{newChanges}</strong> licitaç{newChanges === 1 ? 'ão' : 'ões'} com novas atualizações detectadas
            </span>
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['acompanhamento'] })}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Atualizar
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-foreground-muted">
            <span className="font-semibold text-foreground">{total}</span> em acompanhamento
          </div>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['acompanhamento'] })}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
          >
            <RefreshCw size={13} />
            Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filter === f.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-foreground-muted hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : matches.length === 0 ? (
          <EmptyState
            title="Nenhuma licitação em acompanhamento"
            description="Marque uma licitação como 'Participando' para acompanhar mudanças de status, prazo e documentos."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => {
                const lastChange = (match as Match & { lastChange?: { type: string; detectedAt: string } }).lastChange;
                const changeCfg = lastChange ? (CHANGE_LABELS[lastChange.type] ?? { label: lastChange.type, className: 'border-border text-foreground-muted' }) : null;
                return (
                  <div key={match.id} className="relative">
                    {changeCfg && (
                      <div className={`mb-1 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${changeCfg.className}`}>
                        <RefreshCw size={10} />
                        {changeCfg.label}
                      </div>
                    )}
                    <OportunidadeCard
                      match={match}
                      onFavorite={(id) => favoriteMutation.mutate(id)}
                      onParticipando={(id) => participandoMutation.mutate(id)}
                      onDismiss={(id) => dismissMutation.mutate(id)}
                    />
                  </div>
                );
              })}
            </div>
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage && <Loader2 size={20} className="animate-spin text-foreground-muted" />}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
