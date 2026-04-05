'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Loader2, X, Users, Bookmark, Globe, BarChart2 } from 'lucide-react';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AdminTenant {
  id: string;
  name: string;
  cnpj?: string;
  slug: string;
  planId: string;
  planName: string;
  usersCount: number;
  interestsCount: number;
  portalsCount: number;
  analysesUsed: number;
  maxAnalyses: number;
  aiSource: 'platform' | 'own';
  currentPriceBrl: string;
  isActive: boolean;
  createdAt: string;
}

interface TenantsPage {
  data: AdminTenant[];
  total: number;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
}

interface CreateForm {
  name: string;
  cnpj: string;
  planId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

function CreateTenantModal({ plans, onClose }: { plans: Plan[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateForm>({
    name: '', cnpj: '', planId: plans[0]?.id ?? '',
    ownerName: '', ownerEmail: '', ownerPassword: '',
  });

  const set = (key: keyof CreateForm, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: () => api.post('/admin/tenants', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      toast.success('Empresa criada');
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? 'Erro ao criar empresa');
    },
  });

  const valid = form.name && form.planId && form.ownerName && form.ownerEmail && form.ownerPassword;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="w-full max-w-md h-full bg-background-secondary overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Nova empresa</h2>
          <button onClick={onClose} className="p-1 text-foreground-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 flex-1">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Dados da empresa</p>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Nome da empresa</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">CNPJ (opcional)</label>
            <input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Plano</label>
            <select value={form.planId} onChange={(e) => set('planId', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none">
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide pt-2">Usuário responsável</p>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Nome</label>
            <input value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Email</label>
            <input type="email" value={form.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Senha inicial</label>
            <input type="password" value={form.ownerPassword} onChange={(e) => set('ownerPassword', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
        <div className="p-6 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground-muted hover:text-foreground">Cancelar</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !valid}
            className="flex-1 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Criar empresa
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTenantModal({ tenant, plans, onClose }: { tenant: AdminTenant; plans: Plan[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: tenant.name, cnpj: tenant.cnpj ?? '', planId: tenant.planId });
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: () => api.patch(`/admin/tenants/${tenant.id}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      toast.success('Empresa atualizada');
      onClose();
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="w-full max-w-md h-full bg-background-secondary overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Editar empresa</h2>
          <button onClick={onClose} className="p-1 text-foreground-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 flex-1">
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Nome</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">CNPJ</label>
            <input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Plano</label>
            <select value={form.planId} onChange={(e) => set('planId', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none">
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="p-6 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground-muted hover:text-foreground">Cancelar</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name}
            className="flex-1 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTenantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<AdminTenant | null>(null);

  const { data, isLoading } = useQuery<TenantsPage>({
    queryKey: ['admin-tenants', search, page],
    queryFn: async () => (await api.get('/admin/tenants', { params: { search, page, limit: 20 } })).data,
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: async () => (await api.get('/admin/plans')).data,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/tenants/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tenants'] }); toast.success('Tenant atualizado'); },
    onError: () => toast.error('Erro ao atualizar'),
  });

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-foreground">Empresas</h1>
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} />
            Nova empresa
          </button>
        </div>
      </div>

      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-foreground-muted text-sm">Nenhuma empresa encontrada</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-foreground-muted font-medium">Empresa</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Plano</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Estatísticas</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">IA</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Preço</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Status</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Criado</th>
                  <th className="p-3 text-foreground-muted font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-background-tertiary/30">
                    <td className="p-3">
                      <p className="font-medium text-foreground">{t.name}</p>
                      {t.cnpj && <p className="text-xs text-foreground-muted font-mono">{t.cnpj}</p>}
                    </td>
                    <td className="p-3 text-foreground-muted">{t.planName}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3 text-xs text-foreground-muted">
                        <span className="flex items-center gap-1" title="Usuários"><Users size={11} />{t.usersCount}</span>
                        <span className="flex items-center gap-1" title="Interesses"><Bookmark size={11} />{t.interestsCount}</span>
                        <span className="flex items-center gap-1" title="Portais ativos"><Globe size={11} />{t.portalsCount}</span>
                        <span className="flex items-center gap-1" title="Análises este mês"><BarChart2 size={11} />{t.analysesUsed}/{t.maxAnalyses === -1 ? '∞' : t.maxAnalyses}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${t.aiSource === 'own' ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-foreground-muted'}`}>
                        {t.aiSource === 'own' ? 'Própria' : 'Sistema'}
                      </span>
                    </td>
                    <td className="p-3 text-foreground">{formatCurrency(t.currentPriceBrl)}</td>
                    <td className="p-3">
                      <span className={`text-xs font-medium ${t.isActive ? 'text-success' : 'text-danger'}`}>
                        {t.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3 text-foreground-muted text-xs">{formatDate(t.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditing(t)}
                          className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate({ id: t.id, isActive: !t.isActive })}
                          disabled={toggleMutation.isPending}
                          className="text-xs px-2 py-1 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                        >
                          {t.isActive ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data.total ?? 0) > 20 && (
              <div className="flex items-center justify-between p-3 border-t border-border">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40">
                  Anterior
                </button>
                <span className="text-xs text-foreground-muted">Página {page} · {data.total} empresas</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= (data.total ?? 0)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40">
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && <CreateTenantModal plans={plans} onClose={() => setShowCreate(false)} />}
      {editing && <EditTenantModal tenant={editing} plans={plans} onClose={() => setEditing(null)} />}
    </div>
  );
}
