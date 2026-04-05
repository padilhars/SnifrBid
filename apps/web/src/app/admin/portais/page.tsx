'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface AdminPortal {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  lastHealthCheck?: string;
  healthStatus?: 'online' | 'slow' | 'offline';
  totalCollected: number;
  adapterKey: string;
}

interface HealthTestResult {
  success: boolean;
  latencyMs?: number;
  error?: string;
}

export default function AdminPortaisPage() {
  const qc = useQueryClient();

  const { data: portals, isLoading } = useQuery<AdminPortal[]>({
    queryKey: ['admin-portals'],
    queryFn: async () => (await api.get('/admin/portals')).data,
    refetchInterval: 60000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/portals/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-portals'] }); toast.success('Portal atualizado'); },
    onError: () => toast.error('Erro ao atualizar portal'),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => api.post<HealthTestResult>(`/admin/portals/${id}/health`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-portals'] });
      if (res.data.success) {
        toast.success(`Conexão OK — latência: ${res.data.latencyMs}ms`);
      } else {
        toast.error(`Falha: ${res.data.error}`);
      }
    },
    onError: () => toast.error('Erro ao testar portal'),
  });

  const STATUS_ICON: Record<string, React.ReactNode> = {
    online: <CheckCircle2 size={14} className="text-success" />,
    slow: <Clock size={14} className="text-warning" />,
    offline: <XCircle size={14} className="text-danger" />,
  };

  const STATUS_LABEL: Record<string, string> = {
    online: 'Online',
    slow: 'Lento',
    offline: 'Offline',
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-xl font-bold text-foreground">Portais</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portals?.map((portal) => (
            <div key={portal.id} className="bg-background-secondary border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{portal.name}</p>
                  <p className="text-xs text-foreground-muted">{portal.adapterKey}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={portal.isActive}
                  onClick={() => toggleMutation.mutate({ id: portal.id, isActive: !portal.isActive })}
                  disabled={toggleMutation.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${portal.isActive ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${portal.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-foreground-muted">
                {portal.healthStatus && (
                  <span className="flex items-center gap-1">
                    {STATUS_ICON[portal.healthStatus]}
                    {STATUS_LABEL[portal.healthStatus]}
                  </span>
                )}
                <span>{portal.totalCollected.toLocaleString('pt-BR')} coletadas</span>
                {portal.lastHealthCheck && (
                  <span>último check: {formatDateTime(portal.lastHealthCheck)}</span>
                )}
              </div>

              <button
                onClick={() => testMutation.mutate(portal.id)}
                disabled={testMutation.isPending}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
              >
                {testMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Testar conexão
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
