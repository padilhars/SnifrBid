'use client';

import { useRef, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { OportunidadeCard } from '@/components/oportunidades/OportunidadeCard';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Match } from '@/types';

interface MatchesPage {
  data: Match[];
  total: number;
  nextCursor?: string;
}

export default function ParticipandoPage() {
  const qc = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery<MatchesPage>({
    queryKey: ['participando'],
    queryFn: async ({ pageParam }) => {
      const res = await api.get<MatchesPage>('/licitacoes/matches', {
        params: { tab: 'participando', limit: 24, cursor: pageParam || undefined },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['participando'] }); toast.success('Favorito atualizado'); },
    onError: () => toast.error('Erro ao atualizar favorito'),
  });

  const dismissMutation = useMutation({
    mutationFn: (matchId: string) => api.patch(`/licitacoes/matches/${matchId}/status`, { status: 'dismissed' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['participando'] }); toast.success('Removido de participando'); },
    onError: () => toast.error('Erro ao remover'),
  });

  const matches = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <AppShell title="Participando">
      <div className="space-y-4">
        {total > 0 && (
          <p className="text-sm text-foreground-muted">
            <span className="font-semibold text-foreground">{total}</span> licitação{total !== 1 ? 'ões' : ''} em participação
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : matches.length === 0 ? (
          <EmptyState
            title="Nenhuma licitação em participação"
            description="Quando seu time decidir participar de uma licitação, ela aparecerá aqui para todos os usuários da empresa."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((match) => (
                <OportunidadeCard
                  key={match.id}
                  match={match}
                  isFavorited={false}
                  onFavorite={(id) => favoriteMutation.mutate(id)}
                  onParticipando={() => {}}
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
    </AppShell>
  );
}
