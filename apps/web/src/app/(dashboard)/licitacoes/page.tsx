'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Search, Loader2, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OportunidadeCard } from '@/components/oportunidades/OportunidadeCard';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Match, Portal, Modalidade, UF } from '@/types';

type TabType = 'encontradas' | 'favoritas';
type SortType = 'recentes' | 'relevancia' | 'prazo' | 'valor';

const TABS: { id: TabType; label: string }[] = [
  { id: 'encontradas', label: 'Encontradas' },
  { id: 'favoritas', label: 'Favoritas' },
];

interface MatchesPage {
  data: Match[];
  total: number;
  nextCursor?: string;
}

interface Filters {
  portalIds: string[];
  modalidadeIds: string[];
  ufCodes: string[];
  aderencia: string;
  prazo: string;
  status: string;
}

const EMPTY_FILTERS: Filters = {
  portalIds: [],
  modalidadeIds: [],
  ufCodes: [],
  aderencia: 'todas',
  prazo: 'todas',
  status: 'todas',
};

function Sidebar({
  filters,
  onChange,
  portals,
  modalidades,
  ufs,
  onClose,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  portals: Portal[];
  modalidades: Modalidade[];
  ufs: UF[];
  onClose?: () => void;
}) {
  const [sectionsOpen, setSectionsOpen] = useState({
    portals: true, modalidades: false, ufs: false, aderencia: true, prazo: true, status: true,
  });

  const toggleSection = (k: keyof typeof sectionsOpen) =>
    setSectionsOpen((s) => ({ ...s, [k]: !s[k] }));

  const togglePortal = (id: string) => {
    onChange({
      ...filters,
      portalIds: filters.portalIds.includes(id)
        ? filters.portalIds.filter((p) => p !== id)
        : [...filters.portalIds, id],
    });
  };

  const toggleModalidade = (id: string) => {
    onChange({
      ...filters,
      modalidadeIds: filters.modalidadeIds.includes(id)
        ? filters.modalidadeIds.filter((m) => m !== id)
        : [...filters.modalidadeIds, id],
    });
  };

  const toggleUf = (code: string) => {
    onChange({
      ...filters,
      ufCodes: filters.ufCodes.includes(code)
        ? filters.ufCodes.filter((u) => u !== code)
        : [...filters.ufCodes, code],
    });
  };

  const hasFilters = filters.portalIds.length > 0 || filters.modalidadeIds.length > 0 ||
    filters.ufCodes.length > 0 || filters.aderencia !== 'todas' || filters.prazo !== 'todas' || filters.status !== 'todas';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-foreground-muted" />
          <span className="text-sm font-semibold text-foreground">Filtros</span>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button onClick={() => onChange(EMPTY_FILTERS)} className="text-xs text-primary hover:underline">Limpar</button>
          )}
          {onClose && (
            <button onClick={onClose} className="text-foreground-muted hover:text-foreground"><X size={16} /></button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Portais */}
        {portals.length > 0 && (
          <div>
            <button onClick={() => toggleSection('portals')} className="flex items-center justify-between w-full text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2">
              Portais {filters.portalIds.length > 0 && <span className="text-primary normal-case font-normal">{filters.portalIds.length} sel.</span>}
              {sectionsOpen.portals ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {sectionsOpen.portals && portals.map((p) => (
              <label key={p.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={filters.portalIds.includes(p.id)} onChange={() => togglePortal(p.id)}
                  className="rounded" />
                <span className="text-sm text-foreground">{p.name}</span>
              </label>
            ))}
          </div>
        )}

        {/* Modalidades */}
        {modalidades.length > 0 && (
          <div>
            <button onClick={() => toggleSection('modalidades')} className="flex items-center justify-between w-full text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2">
              Modalidades {filters.modalidadeIds.length > 0 && <span className="text-primary normal-case font-normal">{filters.modalidadeIds.length} sel.</span>}
              {sectionsOpen.modalidades ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {sectionsOpen.modalidades && (
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {modalidades.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                    <input type="checkbox" checked={filters.modalidadeIds.includes(m.id)} onChange={() => toggleModalidade(m.id)}
                      className="rounded" />
                    <span className="text-xs text-foreground">{m.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* UFs */}
        {ufs.length > 0 && (
          <div>
            <button onClick={() => toggleSection('ufs')} className="flex items-center justify-between w-full text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2">
              Estados (UF) {filters.ufCodes.length > 0 && <span className="text-primary normal-case font-normal">{filters.ufCodes.length} sel.</span>}
              {sectionsOpen.ufs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {sectionsOpen.ufs && (
              <div className="grid grid-cols-3 gap-1">
                {ufs.map((uf) => (
                  <button
                    key={uf.code}
                    onClick={() => toggleUf(uf.code)}
                    className={`text-xs py-1 px-1.5 rounded-lg border font-mono transition-colors ${
                      filters.ufCodes.includes(uf.code)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-foreground-muted hover:border-primary/50'
                    }`}
                  >
                    {uf.code}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aderência */}
        <div>
          <button onClick={() => toggleSection('aderencia')} className="flex items-center justify-between w-full text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2">
            Aderência {filters.aderencia !== 'todas' && <span className="text-primary normal-case font-normal">•</span>}
            {sectionsOpen.aderencia ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {sectionsOpen.aderencia && (
            <div className="space-y-1">
              {[
                { value: 'todas', label: 'Todas' },
                { value: 'alta', label: 'Alta (≥80%)' },
                { value: 'media', label: 'Média (50–79%)' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <input type="radio" name="aderencia" value={opt.value} checked={filters.aderencia === opt.value}
                    onChange={() => onChange({ ...filters, aderencia: opt.value })} />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Prazo */}
        <div>
          <button onClick={() => toggleSection('prazo')} className="flex items-center justify-between w-full text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2">
            Prazo {filters.prazo !== 'todas' && <span className="text-primary normal-case font-normal">•</span>}
            {sectionsOpen.prazo ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {sectionsOpen.prazo && (
            <div className="space-y-1">
              {[
                { value: 'todas', label: 'Qualquer prazo' },
                { value: 'urgentes', label: 'Urgentes (≤3 dias)' },
                { value: '7dias', label: 'Até 7 dias' },
                { value: '30dias', label: 'Até 30 dias' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <input type="radio" name="prazo" value={opt.value} checked={filters.prazo === opt.value}
                    onChange={() => onChange({ ...filters, prazo: opt.value })} />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status de análise */}
        <div>
          <button onClick={() => toggleSection('status')} className="flex items-center justify-between w-full text-xs font-semibold text-foreground-muted uppercase tracking-wide mb-2">
            Análise {filters.status !== 'todas' && <span className="text-primary normal-case font-normal">•</span>}
            {sectionsOpen.status ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {sectionsOpen.status && (
            <div className="space-y-1">
              {[
                { value: 'todas', label: 'Todas' },
                { value: 'analisadas', label: 'Analisadas' },
                { value: 'pendentes', label: 'Pendentes' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <input type="radio" name="status" value={opt.value} checked={filters.status === opt.value}
                    onChange={() => onChange({ ...filters, status: opt.value })} />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LicitacoesPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('encontradas');
  const [sort, setSort] = useState<SortType>('recentes');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: portals = [] } = useQuery<Portal[]>({
    queryKey: ['portals-for-filter'],
    queryFn: async () => (await api.get('/tenants/portals')).data,
  });

  const { data: modalidades = [] } = useQuery<Modalidade[]>({
    queryKey: ['modalidades-for-filter'],
    queryFn: async () => (await api.get('/tenants/modalidades')).data,
  });

  const { data: ufs = [] } = useQuery<UF[]>({
    queryKey: ['ufs-for-filter'],
    queryFn: async () => (await api.get('/tenants/ufs')).data,
  });

  const queryParams = {
    tab: activeTab,
    sort,
    search: debouncedSearch || undefined,
    portalIds: filters.portalIds.join(',') || undefined,
    modalidadeIds: filters.modalidadeIds.join(',') || undefined,
    ufCodes: filters.ufCodes.join(',') || undefined,
    filter: filters.aderencia !== 'todas' ? filters.aderencia : filters.prazo !== 'todas' ? filters.prazo : filters.status !== 'todas' ? filters.status : undefined,
  };

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery<MatchesPage>({
    queryKey: ['licitacoes', activeTab, sort, debouncedSearch, filters],
    queryFn: async ({ pageParam }) => {
      const res = await api.get<MatchesPage>('/licitacoes/matches', {
        params: { ...queryParams, cursor: pageParam || undefined, limit: 24 },
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
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const favoriteMutation = useMutation({
    mutationFn: (matchId: string) => api.post('/licitacoes/favorites', { matchId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['licitacoes'] }); toast.success('Favorito atualizado'); },
    onError: () => toast.error('Erro ao atualizar favorito'),
  });

  const participandoMutation = useMutation({
    mutationFn: (matchId: string) => api.patch(`/licitacoes/matches/${matchId}/status`, { status: 'participando' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['licitacoes'] }); toast.success('Marcado como participando'); },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const dismissMutation = useMutation({
    mutationFn: (matchId: string) => api.patch(`/licitacoes/matches/${matchId}/status`, { status: 'dismissed' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['licitacoes'] }); toast.success('Licitação dispensada'); },
    onError: () => toast.error('Erro ao dispensar'),
  });

  const matches = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const hasFilters = filters.portalIds.length > 0 || filters.modalidadeIds.length > 0 ||
    filters.ufCodes.length > 0 || filters.aderencia !== 'todas' || filters.prazo !== 'todas' || filters.status !== 'todas';

  const EMPTY_MESSAGES: Record<TabType, { title: string; description: string }> = {
    encontradas: {
      title: 'Nenhuma licitação encontrada',
      description: hasFilters
        ? 'Tente remover alguns filtros para ver mais resultados.'
        : 'O próximo ciclo de coleta ocorre em até 4 horas. Configure um interesse para começar.',
    },
    favoritas: {
      title: 'Sem favoritos ainda',
      description: "Clique em 'Favoritar' em qualquer licitação para salvá-la aqui.",
    },
  };

  const sidebarContent = (
    <Sidebar
      filters={filters}
      onChange={setFilters}
      portals={portals}
      modalidades={modalidades}
      ufs={ufs}
      onClose={() => setMobileSidebarOpen(false)}
    />
  );

  return (
    <AppShell title="Licitações">
      <div className="flex gap-0 -mx-6 -mt-6 h-[calc(100vh-theme(spacing.16))]">
        {/* Sidebar desktop */}
        <div className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-background-secondary overflow-hidden">
          {sidebarContent}
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-background-secondary shadow-xl">
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-6 space-y-4">
            {/* Tabs */}
            <div className="flex items-center justify-between">
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
              {/* Mobile filter button */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
              >
                <SlidersHorizontal size={13} />
                Filtros
                {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground-muted shrink-0">
                <span className="font-semibold text-foreground">{total}</span> {activeTab === 'encontradas' ? 'encontradas' : 'favoritas'}
              </span>
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Buscar por objeto ou órgão..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="text-sm px-2 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none shrink-0"
              >
                <option value="recentes">Mais recentes</option>
                <option value="relevancia">Maior relevância</option>
                <option value="prazo">Prazo mais próximo</option>
                <option value="valor">Maior valor</option>
              </select>
              {hasFilters && (
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="hidden lg:flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                >
                  <X size={12} />
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : matches.length === 0 ? (
              <EmptyState
                title={EMPTY_MESSAGES[activeTab].title}
                description={EMPTY_MESSAGES[activeTab].description}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
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
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {isFetchingNextPage && <Loader2 size={20} className="animate-spin text-foreground-muted" />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
