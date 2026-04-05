'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  slug: string;
  maxInterests: number;
  maxPortals: number;
  maxAnalysesPerMonth: number;
  maxUsers: number;
  priceWithPlatformAiBrl: string;
  priceWithOwnAiBrl: string;
  isActive: boolean;
}

type FormData = Omit<Plan, 'id'>;

const EMPTY_FORM: FormData = {
  name: '',
  slug: '',
  maxInterests: 3,
  maxPortals: 1,
  maxAnalysesPerMonth: 50,
  maxUsers: 1,
  priceWithPlatformAiBrl: '0',
  priceWithOwnAiBrl: '0',
  isActive: true,
};

function PlanForm({
  initial,
  onClose,
}: {
  initial?: Plan;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormData>(initial ? {
    name: initial.name,
    slug: initial.slug,
    maxInterests: initial.maxInterests,
    maxPortals: initial.maxPortals,
    maxAnalysesPerMonth: initial.maxAnalysesPerMonth,
    maxUsers: initial.maxUsers,
    priceWithPlatformAiBrl: initial.priceWithPlatformAiBrl,
    priceWithOwnAiBrl: initial.priceWithOwnAiBrl,
    isActive: initial.isActive,
  } : EMPTY_FORM);

  const saveMutation = useMutation({
    mutationFn: () => initial
      ? api.put(`/admin/plans/${initial.id}`, form)
      : api.post('/admin/plans', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success(initial ? 'Plano atualizado' : 'Plano criado');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar plano'),
  });

  const set = (key: keyof FormData, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const FIELDS: Array<{ key: keyof FormData; label: string; type: 'text' | 'number'; hint?: string }> = [
    { key: 'name', label: 'Nome', type: 'text' },
    { key: 'slug', label: 'Slug (identificador único)', type: 'text', hint: 'Apenas letras, números e hífens' },
    { key: 'maxInterests', label: 'Máx. interesses', type: 'number', hint: '-1 = ilimitado' },
    { key: 'maxPortals', label: 'Máx. portais', type: 'number', hint: '-1 = ilimitado' },
    { key: 'maxAnalysesPerMonth', label: 'Máx. análises/mês', type: 'number', hint: '-1 = ilimitado' },
    { key: 'maxUsers', label: 'Máx. usuários', type: 'number', hint: '-1 = ilimitado' },
    { key: 'priceWithPlatformAiBrl', label: 'Preço com IA do sistema (R$)', type: 'text' },
    { key: 'priceWithOwnAiBrl', label: 'Preço com IA própria (R$)', type: 'text' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="w-full max-w-md h-full bg-background-secondary overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{initial ? 'Editar plano' : 'Novo plano'}</h2>
          <button onClick={onClose} className="p-1 text-foreground-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 flex-1">
          {FIELDS.map(({ key, label, type, hint }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-foreground-muted mb-1">{label}</label>
              <input
                type={type}
                value={String(form[key])}
                onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {hint && <p className="mt-1 text-xs text-foreground-hint">{hint}</p>}
            </div>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
            />
            <span className="text-sm text-foreground">Plano ativo (visível para novos tenants)</span>
          </label>
        </div>
        <div className="p-6 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground-muted hover:text-foreground">Cancelar</button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name || !form.slug}
            className="flex-1 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPlanosPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: async () => (await api.get('/admin/plans')).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/plans/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-plans'] }); toast.success('Plano excluído'); },
    onError: () => toast.error('Erro ao excluir plano'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/admin/plans/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-plans'] }); toast.success('Plano atualizado'); },
    onError: () => toast.error('Erro ao atualizar plano'),
  });

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Planos</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Novo plano
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans?.map((plan) => (
            <div key={plan.id} className="bg-background-secondary border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  <p className="text-xs text-foreground-muted font-mono">{plan.slug}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${plan.isActive ? 'bg-success/10 text-success border-success/30' : 'border-border text-foreground-muted'}`}>
                  {plan.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-background rounded-lg p-2 border border-border">
                  <p className="text-foreground-muted">Com IA sistema</p>
                  <p className="font-semibold text-foreground">{formatCurrency(plan.priceWithPlatformAiBrl)}<span className="font-normal text-foreground-muted">/mês</span></p>
                </div>
                <div className="bg-background rounded-lg p-2 border border-border">
                  <p className="text-foreground-muted">Com IA própria</p>
                  <p className="font-semibold text-foreground">{formatCurrency(plan.priceWithOwnAiBrl)}<span className="font-normal text-foreground-muted">/mês</span></p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-foreground-muted">
                <span className="bg-background border border-border rounded px-2 py-0.5">{plan.maxInterests === -1 ? '∞' : plan.maxInterests} interesses</span>
                <span className="bg-background border border-border rounded px-2 py-0.5">{plan.maxPortals === -1 ? '∞' : plan.maxPortals} portais</span>
                <span className="bg-background border border-border rounded px-2 py-0.5">{plan.maxAnalysesPerMonth === -1 ? '∞' : plan.maxAnalysesPerMonth} análises/mês</span>
                <span className="bg-background border border-border rounded px-2 py-0.5">{plan.maxUsers === -1 ? '∞' : plan.maxUsers} usuários</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => { setEditing(plan); setShowForm(true); }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                >
                  <Pencil size={12} />
                  Editar
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: plan.id, isActive: !plan.isActive })}
                  disabled={toggleMutation.isPending}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                >
                  {plan.isActive ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Excluir o plano "${plan.name}"? Esta ação não pode ser desfeita.`)) {
                      deleteMutation.mutate(plan.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-danger transition-colors ml-auto"
                >
                  <Trash2 size={12} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PlanForm
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
