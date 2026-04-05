'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles, Clock, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/utils';

interface DashboardStats {
  encontradasHoje: number;
  aguardandoAnalise: number;
  scoreMediao: number;
  analisesRestantes: number;
  monitoradasAtivas: number;
  participando: number;
  encerramEm3Dias: number;
  totalPeriodo: number;
  urgentes: Array<{ id: string; objeto: string; dataEncerramento: string }>;
  matchesPorDia: Array<{ data: string; encontradas: number; analisadas: number }>;
  matchesPorPortal: Array<{ portal: string; count: number }>;
}

function MetricCard({
  label, value, icon: Icon, description,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-foreground-muted">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {description && <p className="text-xs text-foreground-hint mt-1">{description}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={20} className="text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { tenant } = useAuthStore();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get<DashboardStats>('/tenants/dashboard/stats');
      return res.data;
    },
    staleTime: 1000 * 60, // 1 min
  });

  const analisesRestantes = tenant
    ? (tenant.plan?.maxAnalysesPerMonth === -1
      ? '∞'
      : Math.max(0, (tenant.plan?.maxAnalysesPerMonth ?? 0) - tenant.analysesUsedThisMonth))
    : '—';

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">

        {/* Banner urgentes */}
        {stats?.urgentes && stats.urgentes.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30 text-warning">
            <AlertTriangle size={20} className="shrink-0" />
            <span className="text-sm font-medium">
              ⚠ {stats.urgentes.length} licitaç{stats.urgentes.length === 1 ? 'ão encerra' : 'ões encerram'} em menos de 3 dias —{' '}
              <a href="/oportunidades?filter=urgentes" className="underline hover:no-underline">Ver agora →</a>
            </span>
          </div>
        )}

        {/* Métricas principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Encontradas hoje" value={isLoading ? '…' : (stats?.encontradasHoje ?? 0)} icon={Sparkles} />
          <MetricCard label="Aguardando análise" value={isLoading ? '…' : (stats?.aguardandoAnalise ?? 0)} icon={Clock} />
          <MetricCard
            label="Score médio"
            value={isLoading ? '…' : (stats?.scoreMediao ? `${stats.scoreMediao}` : '—')}
            icon={TrendingUp}
            description="últimos 30 dias"
          />
          <MetricCard label="Análises restantes" value={isLoading ? '…' : analisesRestantes} icon={Zap} description="no mês" />
        </div>

        {/* Métricas secundárias */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Monitoradas ativas', value: stats?.monitoradasAtivas ?? 0 },
            { label: 'Participando', value: stats?.participando ?? 0 },
            { label: 'Encerram ≤ 3 dias', value: stats?.encerramEm3Dias ?? 0 },
            { label: 'Total no período', value: stats?.totalPeriodo ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background-secondary border border-border rounded-xl p-4">
              <p className="text-xs text-foreground-muted">{label}</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{isLoading ? '…' : value}</p>
            </div>
          ))}
        </div>

        {/* Gráfico principal — timeline 30 dias */}
        <div className="bg-background-secondary border border-border rounded-xl p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">Licitações encontradas — últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats?.matchesPorDia ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" tickFormatter={(v: string) => formatDate(v, 'dd/MM')} tick={{ fontSize: 11 }} stroke="hsl(var(--foreground-muted))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--foreground-muted))" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background-secondary))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                labelFormatter={(v: string) => formatDate(v)}
              />
              <Area type="monotone" dataKey="encontradas" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name="Encontradas" />
              <Area type="monotone" dataKey="analisadas" stackId="2" stroke="hsl(var(--success))" fill="hsl(var(--success)/0.15)" name="Analisadas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Grid gráficos secundários */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-background-secondary border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">Matches por portal (7 dias)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.matchesPorPortal ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--foreground-muted))" />
                <YAxis dataKey="portal" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--foreground-muted))" width={80} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background-secondary))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Matches" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-background-secondary border border-border rounded-xl p-5 flex items-center justify-center">
            <div className="text-center text-foreground-muted">
              <p className="text-sm">Distribuição por modalidade</p>
              <p className="text-xs mt-1">Em breve</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
