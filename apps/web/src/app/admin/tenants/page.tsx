'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AdminTenant {
  id: string;
  name: string;
  cnpj?: string;
  planName: string;
  usersCount: number;
  analysesUsed: number;
  aiSource: 'platform' | 'own';
  currentPriceBrl: string;
  isActive: boolean;
  createdAt: string;
}

interface TenantsPage {
  data: AdminTenant[];
  total: number;
}

export default function AdminTenantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<TenantsPage>({
    queryKey: ['admin-tenants', search, page],
    queryFn: async () => (await api.get('/admin/tenants', { params: { search, page, limit: 20 } })).data,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/tenants/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tenants'] }); toast.success('Tenant atualizado'); },
    onError: () => toast.error('Erro ao atualizar'),
  });

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Tenants</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-foreground-muted text-sm">Nenhum tenant encontrado</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-foreground-muted font-medium">Empresa</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Plano</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Usuários</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Análises</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">IA</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Preço</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Status</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Criado em</th>
                  <th className="p-3 text-foreground-muted font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-foreground">{t.name}</td>
                    <td className="p-3 text-foreground-muted">{t.planName}</td>
                    <td className="p-3 text-foreground-muted">{t.usersCount}</td>
                    <td className="p-3 text-foreground-muted">{t.analysesUsed}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        t.aiSource === 'own' ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-foreground-muted'
                      }`}>
                        {t.aiSource === 'own' ? 'Própria' : 'Sistema'}
                      </span>
                    </td>
                    <td className="p-3 text-foreground">{formatCurrency(t.currentPriceBrl)}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium ${t.isActive ? 'text-success' : 'text-danger'}`}>
                        {t.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3 text-foreground-muted">{formatDate(t.createdAt)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleMutation.mutate({ id: t.id, isActive: !t.isActive })}
                        disabled={toggleMutation.isPending}
                        className="text-xs text-foreground-muted hover:text-foreground underline"
                      >
                        {t.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.total > 20 && (
              <div className="flex items-center justify-between p-3 border-t border-border">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-xs text-foreground-muted">Página {page} · {data.total} tenants</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= data.total}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
