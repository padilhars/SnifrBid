'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OportunidadeCard } from '@/components/oportunidades/OportunidadeCard';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Match } from '@/types';

type TabType = 'encontradas' | 'favoritas' | 'participando';
type FilterType = 'todas' | 'alta' | 'urgentes' | 'analisadas' | 'pendentes';
type SortType = 'recentes' | 'relevancia' | 'prazo' | 'valor';

const TABS: { id: TabType; label: string }[] = [
  { id: 'encontradas', label: 'Encontradas' },
  { id: 'favoritas', label: 'Favoritas' },
  { id: 'participando', label: 'Participando' },
];

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'alta', label: 'Alta aderência (≥80)' },
  { id: 'urgentes', label: 'Urgentes (≤3 dias)' },
  { id: 'analisadas', label: 'Analisadas' },
  { id: 'pendentes', label: 'Pendentes' },
];

interface MatchesPage {
  data: Match[];
  total: number;
  nextCursor?: string;
}

export default function OportunidadesPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('encontradas');
  const [filter, setFilter] = useState<FilterType>('todas');
  const [sort, setSort] = useState<SortType>('recentes');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery<MatchesPage>({
    queryKey: ['oportunidades', activeTab, filter, sort, debouncedSearch],
    queryFn: async ({ pageParam }) => {
      const res = await api.get<MatchesPage>('/licitacoes/matches', {
        params: {
          tab: activeTab,
          filter,
          sort,
          search: debouncedSearch || undefined,
          cursor: pageParam || undefined,
          limit: 24,
        },
      });
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  });

  // Infinite scroll
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
    mutationFn: (matchId: string) => api.post(`/licitacoes/favorites`, { matchId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oportunidades'] });
      toast.success('Favorito atualizado');
    },
    onError: () => toast.error('Erro ao atualizar favorito'),
  });

  const participandoMutation = useMutation({
    mutationFn: (matchId: string) => api.patch(`/licitacoes/matches/${matchId}/status`, { status: 'participando' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oportunidades'] });
      toast.success('Marcado como participando');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const dismissMutation = useMutation({
    mutationFn: (matchId: string) => api.patch(`/licitacoes/matches/${matchId}/status`, { status: 'dismissed' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['oportunidades'] });
      toast.success('Licitação dispensada');
    },
    onError: () => toast.error('Erro ao dispensar'),
  });

  const matches = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const EMPTY_MESSAGES = {
    encontradas: {
      title: 'Nenhuma licitação encontrada ainda',
      description: 'O próximo ciclo de coleta ocorre em até 4 horas. Configure um interesse para começar.',
    },
    favoritas: {
      title: 'Sem favoritos ainda',
      description: "Clique em 'Favoritar' em qualquer oportunidade para salvá-la aqui. Só você verá seus favoritos.",
    },
    participando: {
      title: 'Nenhuma licitação como participando',
      description: "Quando seu time decidir participar de uma licitação, ela aparecerá aqui para todos os usuários.",
    },
  };

  return (
    <AppShell title="Oportunidades">
      <div className="space-y-4">
        {/* Abas */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map((tab) => (
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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="text-sm text-foreground-muted">
            <span className="font-semibold text-foreground">{total}</span>{' '}
            {activeTab === 'encontradas' ? 'encontradas' : activeTab}
          </div>

          {/* Busca */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Buscar por objeto ou órgão..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Ordenação */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="text-sm px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none"
          >
            <option value="recentes">Mais recentes</option>
            <option value="relevancia">Maior relevância</option>
            <option value="prazo">Prazo mais próximo</option>
            <option value="valor">Maior valor</option>
          </select>
        </div>

        {/* Pills de filtro */}
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

        {/* Grid de cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : matches.length === 0 ? (
          <EmptyState
            title={EMPTY_MESSAGES[activeTab].title}
            description={EMPTY_MESSAGES[activeTab].description}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => (
                <OportunidadeCard
                  key={match.id}
                  match={match}
                  isFavorited={activeTab === 'favoritas'}
                  onFavorite={(id) => favoriteMutation.mutate(id)}
                  onParticipando={(id) => participandoMutation.mutate(id)}
                  onDismiss={(id) => dismissMutation.mutate(id)}
                />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage && (
                <Loader2 size={20} className="animate-spin text-foreground-muted" />
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
