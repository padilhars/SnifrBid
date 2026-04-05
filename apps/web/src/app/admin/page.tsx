'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, BarChart2, FileText, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';

interface AdminMetrics {
  tenantsAtivos: number;
  analisesHoje: number;
  analisesSemana: number;
  analisesMes: number;
  licitacoesHoje: number;
  workers: Array<{ name: string; lastHeartbeat: string; status: 'online' | 'degraded' | 'offline' }>;
  alerts: Array<{ type: string; message: string }>;
}

export default function AdminPage() {
  const { data, isLoading } = useQuery<AdminMetrics>({
    queryKey: ['admin-metrics'],
    queryFn: async () => (await api.get('/admin/metrics')).data,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-xl font-bold text-foreground">Painel Administrativo</h1>

      {/* Alertas */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tenants ativos', value: data?.tenantsAtivos, icon: Users },
          { label: 'Análises hoje', value: data?.analisesHoje, icon: BarChart2 },
          { label: 'Análises esta semana', value: data?.analisesSemana, icon: BarChart2 },
          { label: 'Licitações hoje', value: data?.licitacoesHoje, icon: FileText },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-background-secondary border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className="text-foreground-muted" />
              <p className="text-xs text-foreground-muted">{label}</p>
            </div>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <p className="text-2xl font-bold text-foreground">{value ?? '—'}</p>
            )}
          </div>
        ))}
      </div>

      {/* Workers */}
      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Status dos Workers</h2>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-foreground-muted font-medium">Worker</th>
                <th className="text-left p-3 text-foreground-muted font-medium">Status</th>
                <th className="text-left p-3 text-foreground-muted font-medium">Último heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {data?.workers?.map((w) => (
                <tr key={w.name} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium text-foreground">{w.name}</td>
                  <td className="p-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${
                      w.status === 'online' ? 'text-success' :
                      w.status === 'degraded' ? 'text-warning' : 'text-danger'
                    }`}>
                      {w.status === 'online' ? <CheckCircle2 size={12} /> :
                       w.status === 'degraded' ? <Clock size={12} /> : <XCircle size={12} />}
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3 text-foreground-muted">{w.lastHeartbeat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
