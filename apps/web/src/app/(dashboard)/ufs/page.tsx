'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

interface UF {
  code: string;
  name: string;
}

interface TenantUF {
  id: string;
  tenantId: string;
  ufCode: string;
  uf: UF;
}

export default function UFsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: allUfs, isLoading: loadingUfs } = useQuery<UF[]>({
    queryKey: ['all-ufs'],
    queryFn: async () => (await api.get('/tenants/ufs')).data,
  });

  const { data: activated, isLoading: loadingActivated } = useQuery<TenantUF[]>({
    queryKey: ['activated-ufs'],
    queryFn: async () => (await api.get('/tenants/activated-ufs')).data,
  });

  const toggleMutation = useMutation({
    mutationFn: (code: string) => api.post(`/tenants/ufs/${code}/toggle`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activated-ufs'] });
    },
    onError: () => toast.error('Erro ao alterar UF'),
  });

  const canManage = ['owner', 'admin', 'system_admin'].includes(user?.role ?? '');
  const activatedCodes = new Set((activated ?? []).map((tu) => tu.ufCode));
  const activatedCount = activatedCodes.size;

  const ufs = allUfs ?? [];

  const toggleAll = async (activate: boolean) => {
    if (activate) {
      for (const uf of ufs) {
        if (!activatedCodes.has(uf.code)) {
          await api.post(`/tenants/ufs/${uf.code}/toggle`, {});
        }
      }
    } else {
      for (const uf of ufs) {
        if (activatedCodes.has(uf.code)) {
          await api.post(`/tenants/ufs/${uf.code}/toggle`, {});
        }
      }
    }
    qc.invalidateQueries({ queryKey: ['activated-ufs'] });
    toast.success(activate ? 'Todas as UFs ativadas' : 'Todas as UFs desativadas');
  };

  const isLoading = loadingUfs || loadingActivated;

  return (
    <AppShell title="Unidades Federativas">
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            {activatedCount === 0
              ? 'Nenhuma UF selecionada — licitações de todos os estados serão monitoradas'
              : `${activatedCount} UF${activatedCount !== 1 ? 's' : ''} ativa${activatedCount !== 1 ? 's' : ''} — apenas licitações destas UFs serão monitoradas`}
          </p>
          {canManage && !isLoading && (
            <div className="flex gap-2">
              <button
                onClick={() => toggleAll(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
              >
                Selecionar todas
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
              >
                Desmarcar todas
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 animate-pulse">
            {Array.from({ length: 27 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-background-tertiary" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {ufs.map((uf) => {
              const isActive = activatedCodes.has(uf.code);
              return (
                <button
                  key={uf.code}
                  onClick={() => canManage && toggleMutation.mutate(uf.code)}
                  disabled={!canManage || toggleMutation.isPending}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-sm ${
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background-secondary text-foreground-muted hover:border-primary/50'
                  } ${!canManage ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="font-bold font-mono">{uf.code}</span>
                  <span className="text-xs truncate w-full text-center mt-0.5 opacity-70">{uf.name}</span>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-foreground-hint">
          {canManage
            ? 'Clique em uma UF para ativar ou desativar. UFs desativadas não aparecem nos filtros de licitações.'
            : 'Apenas administradores e proprietários podem alterar as UFs ativas.'}
        </p>
      </div>
    </AppShell>
  );
}
