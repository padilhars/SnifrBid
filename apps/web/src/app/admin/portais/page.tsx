'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, Loader2, Plus, Pencil, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface Modalidade {
  id: string;
  name: string;
  code: string;
  portalId: string;
  isActive: boolean;
}

interface AdminPortal {
  id: string;
  name: string;
  slug: string;
  adapterKey: string;
  baseUrl: string;
  isActive: boolean;
  lastHealthCheck?: string;
  healthStatus?: 'online' | 'slow' | 'offline';
  totalCollected: number;
  modalidades: Modalidade[];
}

interface HealthTestResult {
  success: boolean;
  latencyMs?: number;
  error?: string;
}

function PortalForm({ initial, onClose }: { initial?: AdminPortal; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    adapterKey: initial?.adapterKey ?? '',
    baseUrl: initial?.baseUrl ?? '',
    isActive: initial?.isActive ?? true,
  });
  const set = (key: keyof typeof form, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: () => initial
      ? api.put(`/admin/portals/${initial.id}`, form)
      : api.post('/admin/portals', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-portals'] });
      toast.success(initial ? 'Portal atualizado' : 'Portal criado');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar portal'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="w-full max-w-md h-full bg-background-secondary overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{initial ? 'Editar portal' : 'Novo portal'}</h2>
          <button onClick={onClose} className="p-1 text-foreground-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4 flex-1">
          {(['name', 'slug', 'adapterKey', 'baseUrl'] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs font-medium text-foreground-muted mb-1">
                {key === 'name' ? 'Nome' : key === 'slug' ? 'Slug' : key === 'adapterKey' ? 'Adapter Key' : 'URL Base'}
              </label>
              <input value={form[key]} onChange={(e) => set(key, e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            <span className="text-sm text-foreground">Portal ativo</span>
          </label>
        </div>
        <div className="p-6 border-t border-border flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground-muted hover:text-foreground">Cancelar</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.slug || !form.adapterKey || !form.baseUrl}
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

function ModalidadeForm({ portalId, initial, onClose }: { portalId: string; initial?: Modalidade; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    code: initial?.code ?? '',
    portalId,
    isActive: initial?.isActive ?? true,
  });

  const mutation = useMutation({
    mutationFn: () => initial
      ? api.put(`/admin/modalidades/${initial.id}`, form)
      : api.post('/admin/modalidades', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-portals'] });
      toast.success(initial ? 'Modalidade atualizada' : 'Modalidade criada');
      onClose();
    },
    onError: () => toast.error('Erro ao salvar modalidade'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary border border-border rounded-xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{initial ? 'Editar modalidade' : 'Nova modalidade'}</h3>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground"><X size={16} /></button>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Nome</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Código</label>
          <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          <span className="text-sm text-foreground">Ativa</span>
        </label>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground-muted hover:text-foreground">Cancelar</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.code}
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

const STATUS_ICON: Record<string, React.ReactNode> = {
  online: <CheckCircle2 size={14} className="text-success" />,
  slow: <Clock size={14} className="text-warning" />,
  offline: <XCircle size={14} className="text-danger" />,
};
const STATUS_LABEL: Record<string, string> = { online: 'Online', slow: 'Lento', offline: 'Offline' };

export default function AdminPortaisPage() {
  const qc = useQueryClient();
  const [showPortalForm, setShowPortalForm] = useState(false);
  const [editingPortal, setEditingPortal] = useState<AdminPortal | null>(null);
  const [editingModalidade, setEditingModalidade] = useState<{ portalId: string; initial?: Modalidade } | null>(null);
  const [expandedPortals, setExpandedPortals] = useState<Set<string>>(new Set());

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

  const toggleModalidadeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/modalidades/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-portals'] }); toast.success('Modalidade atualizada'); },
    onError: () => toast.error('Erro ao atualizar modalidade'),
  });

  const toggleExpand = (id: string) => {
    setExpandedPortals((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Portais</h1>
        <button
          onClick={() => { setEditingPortal(null); setShowPortalForm(true); }}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Novo portal
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {portals?.map((portal) => (
            <div key={portal.id} className="bg-background-secondary border border-border rounded-xl overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{portal.name}</p>
                    <p className="text-xs text-foreground-muted">{portal.adapterKey} · <span className="font-mono">{portal.baseUrl}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditingPortal(portal); setShowPortalForm(true); }}
                      className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
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
                </div>

                <div className="flex items-center gap-3 text-xs text-foreground-muted">
                  {portal.healthStatus && (
                    <span className="flex items-center gap-1">
                      {STATUS_ICON[portal.healthStatus]}
                      {STATUS_LABEL[portal.healthStatus]}
                    </span>
                  )}
                  <span>{(portal.totalCollected ?? 0).toLocaleString('pt-BR')} coletadas</span>
                  {portal.lastHealthCheck && (
                    <span>último check: {formatDateTime(portal.lastHealthCheck)}</span>
                  )}
                  <span>{portal.modalidades?.length ?? 0} modalidade(s)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => testMutation.mutate(portal.id)}
                    disabled={testMutation.isPending}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                  >
                    {testMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Testar conexão
                  </button>
                  <button
                    onClick={() => toggleExpand(portal.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors ml-auto"
                  >
                    {expandedPortals.has(portal.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    Modalidades
                  </button>
                </div>
              </div>

              {expandedPortals.has(portal.id) && (
                <div className="border-t border-border p-4 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Modalidades</p>
                    <button
                      onClick={() => setEditingModalidade({ portalId: portal.id })}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                    >
                      <Plus size={11} />
                      Nova
                    </button>
                  </div>
                  {portal.modalidades?.length === 0 ? (
                    <p className="text-xs text-foreground-muted">Nenhuma modalidade cadastrada</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {portal.modalidades?.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                          <div>
                            <span className="text-sm text-foreground">{m.name}</span>
                            <span className="text-xs text-foreground-muted ml-2">#{m.code}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingModalidade({ portalId: portal.id, initial: m })}
                              className="p-1 text-foreground-muted hover:text-foreground transition-colors"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => toggleModalidadeMutation.mutate({ id: m.id, isActive: !m.isActive })}
                              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${m.isActive ? 'bg-success/10 text-success border-success/30' : 'border-border text-foreground-muted'}`}
                            >
                              {m.isActive ? 'Ativa' : 'Inativa'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showPortalForm && (
        <PortalForm
          initial={editingPortal ?? undefined}
          onClose={() => { setShowPortalForm(false); setEditingPortal(null); }}
        />
      )}
      {editingModalidade && (
        <ModalidadeForm
          portalId={editingModalidade.portalId}
          initial={editingModalidade.initial}
          onClose={() => setEditingModalidade(null)}
        />
      )}
    </div>
  );
}
