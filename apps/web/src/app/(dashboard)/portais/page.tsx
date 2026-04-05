'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

interface Portal {
  id: string;
  name: string;
  slug: string;
  adapterKey: string;
  isActive: boolean;
  modalidades: Array<{ id: string; name: string; code: string; isActive: boolean }>;
}

interface TenantPortal {
  id: string;
  tenantId: string;
  portalId: string;
  portal: Portal;
}

export default function PortaisPage() {
  const qc = useQueryClient();
  const { tenant } = useAuthStore();

  const { data: allPortals, isLoading: loadingAll } = useQuery<Portal[]>({
    queryKey: ['all-portals'],
    queryFn: async () => (await api.get('/admin/portals')).data,
  });

  const { data: activated, isLoading: loadingActivated } = useQuery<TenantPortal[]>({
    queryKey: ['activated-portals'],
    queryFn: async () => (await api.get('/tenants/activated-portals')).data,
  });

  const toggleMutation = useMutation({
    mutationFn: (portalId: string) => api.post(`/tenants/portals/${portalId}/toggle`),
    onSuccess: (res, portalId) => {
      qc.invalidateQueries({ queryKey: ['activated-portals'] });
      const isNowActive = (res.data as { active: boolean }).active;
      toast.success(isNowActive ? 'Portal ativado' : 'Portal desativado');
      void portalId;
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? 'Erro ao alterar portal');
    },
  });

  const isLoading = loadingAll || loadingActivated;
  const activatedIds = new Set((activated ?? []).map((tp) => tp.portalId));
  const maxPortals = tenant?.plan?.maxPortals ?? 1;
  const activatedCount = activatedIds.size;
  const atLimit = maxPortals !== -1 && activatedCount >= maxPortals;

  const activeGlobalPortals = allPortals?.filter((p) => p.isActive) ?? [];

  return (
    <AppShell title="Portais">
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-foreground-muted">
              Ative os portais que deseja monitorar.{' '}
              {maxPortals !== -1 && (
                <span className={`font-semibold ${atLimit ? 'text-danger' : 'text-foreground'}`}>
                  {activatedCount}/{maxPortals} portal{maxPortals !== 1 ? 'is' : ''} ativado{maxPortals !== 1 ? 's' : ''}.
                </span>
              )}
            </p>
          </div>
        </div>

        {atLimit && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-xl text-warning text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Limite de {maxPortals} portal(is) atingido. Faça upgrade do plano para ativar mais portais.</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeGlobalPortals.map((portal) => {
              const isActive = activatedIds.has(portal.id);
              const isDisabled = toggleMutation.isPending || (!isActive && atLimit);

              return (
                <div
                  key={portal.id}
                  className={`bg-background-secondary border rounded-xl p-4 space-y-3 transition-colors ${isActive ? 'border-primary/30' : 'border-border'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/10' : 'bg-background-tertiary'}`}>
                        <Globe size={18} className={isActive ? 'text-primary' : 'text-foreground-muted'} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{portal.name}</p>
                        <p className="text-xs text-foreground-muted">{portal.adapterKey}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleMutation.mutate(portal.id)}
                      disabled={isDisabled}
                      role="switch"
                      aria-checked={isActive}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${isActive ? 'bg-primary' : 'bg-border'}`}
                    >
                      {toggleMutation.isPending ? (
                        <Loader2 size={12} className="absolute left-1/2 -translate-x-1/2 animate-spin text-white" />
                      ) : (
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      )}
                    </button>
                  </div>

                  {isActive && (
                    <div className="flex items-center gap-1.5 text-xs text-success">
                      <CheckCircle2 size={12} />
                      <span>Ativo — licitações deste portal aparecerão nas suas oportunidades</span>
                    </div>
                  )}

                  {portal.modalidades?.filter((m) => m.isActive).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {portal.modalidades.filter((m) => m.isActive).slice(0, 4).map((m) => (
                        <span key={m.id} className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-foreground-muted">
                          {m.name}
                        </span>
                      ))}
                      {portal.modalidades.filter((m) => m.isActive).length > 4 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-foreground-muted">
                          +{portal.modalidades.filter((m) => m.isActive).length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
