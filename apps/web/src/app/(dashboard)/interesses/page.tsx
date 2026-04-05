'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/shared/EmptyState';
import { CardSkeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import type { Interest, Portal, Modalidade, UF } from '@/types';

const interestSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  keywordContexts: z.array(z.object({
    keyword: z.string().min(1),
    context: z.string(),
  })).min(1, 'Adicione pelo menos 1 keyword'),
  portalIds: z.array(z.string()).min(1, 'Selecione pelo menos 1 portal'),
  modalidadeIds: z.array(z.string()),
  ufCodes: z.array(z.string()),
});

type FormData = z.infer<typeof interestSchema>;

function InteresseForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Interest;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState(1);
  const [newKeyword, setNewKeyword] = useState('');
  const [newContext, setNewContext] = useState('');
  const qc = useQueryClient();

  const { data: portais } = useQuery<Portal[]>({
    queryKey: ['portais'],
    queryFn: async () => (await api.get<Portal[]>('/tenants/portals')).data,
  });

  const { data: modalidades } = useQuery<Modalidade[]>({
    queryKey: ['modalidades'],
    queryFn: async () => (await api.get<Modalidade[]>('/tenants/modalidades')).data,
  });

  const { data: ufs } = useQuery<UF[]>({
    queryKey: ['ufs'],
    queryFn: async () => (await api.get<UF[]>('/tenants/ufs')).data,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      name: initial?.name ?? '',
      keywordContexts: initial?.keywordContexts ?? [],
      portalIds: initial?.portals?.map((p) => p.portal.id) ?? [],
      modalidadeIds: initial?.modalidades?.map((m) => m.modalidade.id) ?? [],
      ufCodes: initial?.ufs?.map((u) => u.ufCode) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'keywordContexts' });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (initial) {
        return api.put(`/interests/${initial.id}`, data);
      }
      return api.post('/interests', data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interests'] });
      toast.success(initial ? 'Interesse atualizado' : 'Interesse criado');
      onSaved();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? 'Erro ao salvar interesse');
    },
  });

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    append({ keyword: newKeyword.trim(), context: newContext.trim() });
    setNewKeyword('');
    setNewContext('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="w-full max-w-md h-full bg-background-secondary overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {initial ? 'Editar interesse' : 'Novo interesse'}
          </h2>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground p-1">✕</button>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 px-6 py-3 border-b border-border">
          {['Identificação', 'Palavras-chave', 'Portais e filtros'].map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i + 1)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${step === i + 1 ? 'bg-primary text-primary-foreground' : 'text-foreground-muted hover:text-foreground'}`}
            >
              {i + 1}. {s}
            </button>
          ))}
        </div>

        <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="flex-1 flex flex-col p-6 space-y-4">

          {/* Passo 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nome do interesse</label>
                <input
                  type="text"
                  placeholder="Ex: Equipamentos TI - Sul do Brasil"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-danger">{form.formState.errors.name.message}</p>
                )}
              </div>
              <button type="button" onClick={() => setStep(2)} className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90">
                Próximo
              </button>
            </div>
          )}

          {/* Passo 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Palavras-chave</label>
                <p className="text-xs text-foreground-muted mb-3">
                  Frases compostas são preservadas — &quot;óleo lubrificante&quot; busca a frase exata
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {fields.map((f, i) => (
                    <div key={f.id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full border border-primary/20">
                      <span title={f.context || undefined}>{f.keyword}</span>
                      <button type="button" onClick={() => remove(i)} className="hover:text-danger">✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Keyword (Enter para adicionar)"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none"
                  />
                  <button type="button" onClick={addKeyword} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm">+</button>
                </div>
                <input
                  type="text"
                  placeholder="Contexto (opcional) — ex: veículos automotores"
                  value={newContext}
                  onChange={(e) => setNewContext(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none"
                />
                {form.formState.errors.keywordContexts && (
                  <p className="mt-1 text-xs text-danger">{form.formState.errors.keywordContexts.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-2 rounded-lg border border-border text-foreground-muted hover:text-foreground">Voltar</button>
                <button type="button" onClick={() => setStep(3)} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90">Próximo</button>
              </div>
            </div>
          )}

          {/* Passo 3 */}
          {step === 3 && (
            <div className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Portais</label>
                <div className="space-y-1">
                  {portais?.filter((p) => p.isActive).map((portal) => (
                    <label key={portal.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-background-tertiary cursor-pointer">
                      <input
                        type="checkbox"
                        value={portal.id}
                        {...form.register('portalIds')}
                      />
                      <span className="text-sm text-foreground">{portal.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {modalidades && modalidades.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Modalidades (deixe em branco para todas)</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {modalidades.map((m) => (
                      <label key={m.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-background-tertiary cursor-pointer">
                        <input type="checkbox" value={m.id} {...form.register('modalidadeIds')} />
                        <span className="text-xs text-foreground">{m.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">UFs (deixe em branco para todas)</label>
                <div className="grid grid-cols-4 gap-1">
                  {ufs?.map((uf) => (
                    <label key={uf.code} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="checkbox" value={uf.code} {...form.register('ufCodes')} />
                      {uf.code}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-2 rounded-lg border border-border text-foreground-muted hover:text-foreground">Voltar</button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Salvar
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function InteressesPage() {
  const qc = useQueryClient();
  const { tenant } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingInteresse, setEditingInteresse] = useState<Interest | null>(null);

  const { data: interesses, isLoading } = useQuery<Interest[]>({
    queryKey: ['interests'],
    queryFn: async () => (await api.get<Interest[]>('/interests')).data,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/interests/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interests'] }),
    onError: () => toast.error('Erro ao alterar status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/interests/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interests'] });
      toast.success('Interesse excluído');
    },
    onError: () => toast.error('Erro ao excluir'),
  });

  const planLimit = tenant?.plan?.maxInterests ?? -1;
  const atLimit = planLimit !== -1 && (interesses?.length ?? 0) >= planLimit;

  return (
    <AppShell title="Meus interesses">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            {interesses?.length ?? 0}{planLimit !== -1 ? `/${planLimit}` : ''} interesse{(interesses?.length ?? 0) !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => { setEditingInteresse(null); setShowForm(true); }}
            disabled={atLimit}
            title={atLimit ? `Limite de ${planLimit} interesses atingido. Faça upgrade para adicionar mais.` : undefined}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={16} />
            Novo interesse
          </button>
        </div>

        {atLimit && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
            Você atingiu o limite de {planLimit} interesse{planLimit !== 1 ? 's' : ''} do seu plano. Faça upgrade para adicionar mais.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : interesses?.length === 0 ? (
          <EmptyState
            title="Nenhum interesse configurado"
            description="Crie seu primeiro interesse para começar a monitorar licitações automaticamente."
            action={
              <button
                onClick={() => { setEditingInteresse(null); setShowForm(true); }}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={16} />
                Criar interesse
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {interesses?.map((interesse) => (
              <div key={interesse.id} className="bg-background-secondary border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{interesse.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${interesse.isActive ? 'bg-success/10 text-success border-success/30' : 'bg-border text-foreground-muted border-border'}`}>
                        {interesse.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {/* Keywords */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(interesse.keywordContexts as Array<{ keyword: string; context: string }>).map((kc) => (
                        <span key={kc.keyword} title={kc.context || undefined} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {kc.keyword}
                        </span>
                      ))}
                    </div>

                    {/* Portais e UFs */}
                    <div className="flex flex-wrap gap-1.5 text-xs text-foreground-muted">
                      {interesse.portals?.map((p) => (
                        <span key={p.portal.id} className="bg-background-tertiary px-2 py-0.5 rounded border border-border">{p.portal.name}</span>
                      ))}
                      {interesse.ufs && interesse.ufs.length > 0 && (
                        <span className="bg-background-tertiary px-2 py-0.5 rounded border border-border">
                          {interesse.ufs.map((u) => u.ufCode).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => { setEditingInteresse(interesse); setShowForm(true); }}
                      className="p-2 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate(interesse.id)}
                      className="p-2 rounded-lg border border-border text-foreground-muted hover:text-primary transition-colors"
                      title={interesse.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {interesse.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Excluir este interesse? Esta ação não pode ser desfeita.')) {
                          deleteMutation.mutate(interesse.id);
                        }
                      }}
                      className="p-2 rounded-lg border border-border text-foreground-muted hover:text-danger transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <InteresseForm
          initial={editingInteresse ?? undefined}
          onClose={() => { setShowForm(false); setEditingInteresse(null); }}
          onSaved={() => { setShowForm(false); setEditingInteresse(null); }}
        />
      )}
    </AppShell>
  );
}
