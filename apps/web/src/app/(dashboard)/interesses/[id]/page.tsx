'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { Interest, Portal, Modalidade } from '@/types';

const UF_OPTIONS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

export default function EditInteressePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState('');
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [selectedModalidades, setSelectedModalidades] = useState<string[]>([]);
  const [selectedUFs, setSelectedUFs] = useState<string[]>([]);

  const { data: interesse, isLoading } = useQuery<Interest>({
    queryKey: ['interesse', id],
    queryFn: async () => (await api.get<Interest>(`/interests/${id}`)).data,
  });

  const { data: portals } = useQuery<Portal[]>({
    queryKey: ['portals'],
    queryFn: async () => (await api.get<Portal[]>('/portals')).data,
  });

  const { data: modalidades } = useQuery<Modalidade[]>({
    queryKey: ['modalidades'],
    queryFn: async () => (await api.get<Modalidade[]>('/modalidades')).data,
  });

  useEffect(() => {
    if (!interesse) return;
    setName(interesse.name);
    setContext('');
    setKeywords(interesse.keywordContexts?.map((k) => k.keyword) ?? []);
    setSelectedPortals(interesse.portals?.map((p) => p.portal.id) ?? []);
    setSelectedModalidades(interesse.modalidades?.map((m) => m.modalidade.id) ?? []);
    setSelectedUFs(interesse.ufs?.map((u) => u.ufCode) ?? []);
  }, [interesse]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/interests/${id}`, {
        name,
        keywordContexts: keywords.map((k) => ({ keyword: k, context: '' })),
        portalIds: selectedPortals,
        modalidadeIds: selectedModalidades,
        ufCodes: selectedUFs,
      }),
    onSuccess: () => {
      toast.success('Interesse atualizado');
      router.push('/interesses');
    },
    onError: () => toast.error('Erro ao salvar interesse'),
  });

  function addKeyword() {
    const kw = kwInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords((prev) => [...prev, kw]);
    }
    setKwInput('');
  }

  function removeKeyword(kw: string) {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  }

  function togglePortal(id: string) {
    setSelectedPortals((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }

  function toggleUF(uf: string) {
    setSelectedUFs((prev) => prev.includes(uf) ? prev.filter((u) => u !== uf) : [...prev, uf]);
  }

  function toggleAllUFs() {
    setSelectedUFs((prev) => prev.length === UF_OPTIONS.length ? [] : [...UF_OPTIONS]);
  }

  const isValid = name.trim().length > 0 && keywords.length > 0 && selectedPortals.length > 0;

  if (isLoading) {
    return (
      <AppShell title="Editar interesse">
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Editar interesse">
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/interesses" className="p-1.5 rounded-lg hover:bg-background-tertiary text-foreground-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Editar interesse</h1>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => setStep(s)}
                className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                  step === s ? 'bg-primary text-primary-foreground' :
                  step > s ? 'bg-success text-white' :
                  'bg-background-tertiary text-foreground-muted'
                }`}
              >
                {s}
              </button>
              {s < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
          <span className="ml-2 text-xs text-foreground-muted">
            {step === 1 ? 'Identificação' : step === 2 ? 'Palavras-chave' : 'Portais e filtros'}
          </span>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-background-secondary border border-border rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">Nome do interesse *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Equipamentos TI - Sul do Brasil"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">
                Contexto para a IA
                <span className="ml-1 font-normal text-foreground-hint">(ajuda o Gemini a entender seu negócio)</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Descreva o tipo de licitação que você busca, o contexto do seu negócio, o que não te interessa..."
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              Próximo
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-background-secondary border border-border rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">Palavras-chave *</label>
              <div className="flex gap-2">
                <input
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="Ex: equipamento de informática, notebook"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={addKeyword}
                  disabled={!kwInput.trim()}
                  className="px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  Adicionar
                </button>
              </div>
              <p className="text-xs text-foreground-hint mt-1">
                Frases compostas são preservadas — "óleo lubrificante" busca a frase exata
              </p>
            </div>

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                  >
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-danger transition-colors">×</button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-background-tertiary transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={keywords.length === 0}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                Próximo
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Portais */}
            <div className="bg-background-secondary border border-border rounded-xl p-5">
              <p className="text-sm font-medium text-foreground mb-3">Portais *</p>
              <div className="flex flex-wrap gap-2">
                {portals?.filter((p) => p.isActive).map((portal) => (
                  <button
                    key={portal.id}
                    onClick={() => togglePortal(portal.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      selectedPortals.includes(portal.id)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-border text-foreground-muted hover:border-primary/30 hover:text-foreground'
                    }`}
                  >
                    {portal.name}
                  </button>
                ))}
              </div>
            </div>

            {/* UFs */}
            <div className="bg-background-secondary border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">Estados (UF)</p>
                <button
                  onClick={toggleAllUFs}
                  className="text-xs text-primary hover:underline"
                >
                  {selectedUFs.length === UF_OPTIONS.length ? 'Desmarcar todos' : 'Todos os estados'}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {UF_OPTIONS.map((uf) => (
                  <button
                    key={uf}
                    onClick={() => toggleUF(uf)}
                    className={`text-xs py-1 rounded border transition-colors ${
                      selectedUFs.includes(uf)
                        ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                        : 'border-border text-foreground-muted hover:border-primary/30'
                    }`}
                  >
                    {uf}
                  </button>
                ))}
              </div>
              <p className="text-xs text-foreground-hint mt-2">
                {selectedUFs.length === 0 ? 'Todos os estados serão monitorados' : `${selectedUFs.length} estado(s) selecionado(s)`}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-background-tertiary transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={!isValid || updateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Salvar alterações
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
