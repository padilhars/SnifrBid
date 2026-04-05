'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, Users, Brain, CreditCard, Plus, Loader2,
  CheckCircle2, XCircle, AlertCircle, TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, applyCnpjMask } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import type { Tenant, Plan } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type TabType = 'empresa' | 'usuarios' | 'ia' | 'plano';

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'ia', label: 'Inteligência Artificial', icon: Brain },
  { id: 'plano', label: 'Plano', icon: CreditCard },
];

interface TenantDetails extends Tenant {
  users: Array<{ id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string }>;
  usageHistory: Array<{ month: string; analyses: number }>;
}

interface AIConfig {
  useOwnAI: boolean;
  provider: string;
  model: string;
  hasApiKey: boolean;
}

interface AITestResult {
  success: boolean;
  latencyMs?: number;
  model?: string;
  error?: string;
}

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'custom', label: 'Customizado' },
];

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
};

export default function ConfiguracoesPage() {
  const qc = useQueryClient();
  const { tenant, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('empresa');

  // Empresa form state
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');

  // IA form state
  const [aiProvider, setAiProvider] = useState('google');
  const [aiModel, setAiModel] = useState('');
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiTestResult, setAiTestResult] = useState<AITestResult | null>(null);

  // Invite modal state
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const { data: tenantData, isLoading } = useQuery<TenantDetails>({
    queryKey: ['tenant-details'],
    queryFn: async () => {
      const res = await api.get<TenantDetails>('/tenant/details');
      setCompanyName(res.data.name);
      setCompanySlug(res.data.slug);
      return res.data;
    },
  });

  const { data: aiConfig, isLoading: aiLoading } = useQuery<AIConfig>({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const res = await api.get<AIConfig>('/tenant/ai-config');
      setAiProvider(res.data.provider || 'google');
      setAiModel(res.data.model || '');
      return res.data;
    },
    enabled: activeTab === 'ia',
  });

  const saveCompanyMutation = useMutation({
    mutationFn: () => api.patch('/tenant', { name: companyName, slug: companySlug }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenant-details'] }); toast.success('Dados salvos'); },
    onError: () => toast.error('Erro ao salvar'),
  });

  const toggleAISourceMutation = useMutation({
    mutationFn: (useOwn: boolean) => api.patch('/tenant/ai-config', { aiSource: useOwn ? 'own' : 'platform' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-config', 'tenant-details'] }); toast.success('Configuração salva'); },
    onError: () => toast.error('Erro ao salvar'),
  });

  const saveAIConfigMutation = useMutation({
    mutationFn: (data: { provider: string; model: string; apiKey?: string }) => api.put('/tenant/ai-config', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-config'] }); toast.success('Configuração salva'); setAiApiKey(''); },
    onError: () => toast.error('Erro ao salvar configuração'),
  });

  const testAIConnectionMutation = useMutation({
    mutationFn: () => api.post<AITestResult>('/tenant/ai-config/test'),
    onSuccess: (res) => setAiTestResult(res.data),
    onError: () => setAiTestResult({ success: false, error: 'Erro de conexão' }),
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post('/tenant/users/invite', { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-details'] });
      toast.success('Convite enviado');
      setInviteModal(false);
      setInviteEmail('');
    },
    onError: () => toast.error('Erro ao enviar convite'),
  });

  const toggleUserMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.patch(`/tenant/users/${userId}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-details'] }),
    onError: () => toast.error('Erro ao atualizar usuário'),
  });

  const plan = tenantData?.plan;
  const users = tenantData?.users ?? [];
  const usedUsers = users.filter((u) => u.isActive).length;
  const maxUsers = plan?.maxUsers ?? 1;
  const analysesUsed = tenantData?.analysesUsedThisMonth ?? 0;
  const maxAnalyses = plan?.maxAnalysesPerMonth ?? 0;
  const isAtUserLimit = usedUsers >= maxUsers;
  const useOwnAI = tenantData?.aiSource === 'own';

  return (
    <AppShell title="Configurações">
      <div className="max-w-3xl">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Empresa */}
        {activeTab === 'empresa' && (
          <div className="space-y-4">
            <div className="bg-background-secondary border border-border rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">Nome da empresa</label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : (
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">CNPJ</label>
                <input
                  value={applyCnpjMask(tenantData?.cnpj ?? '')}
                  readOnly
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background-tertiary text-foreground-muted cursor-not-allowed"
                />
                <p className="text-xs text-foreground-hint mt-1">CNPJ não pode ser alterado após o cadastro</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">Slug (URL)</label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : (
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <span className="px-3 py-2 bg-background-tertiary text-foreground-muted text-sm border-r border-border">app.snifrbid.com.br/</span>
                    <input
                      value={companySlug}
                      onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 px-3 py-2 text-sm bg-background text-foreground focus:outline-none"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => saveCompanyMutation.mutate()}
                disabled={saveCompanyMutation.isPending || isLoading}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saveCompanyMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Salvar alterações
              </button>
            </div>
          </div>
        )}

        {/* Tab: Usuários */}
        {activeTab === 'usuarios' && (
          <div className="space-y-4">
            {isAtUserLimit && (
              <div className="flex items-center gap-3 p-3 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm">
                <AlertCircle size={16} className="shrink-0" />
                Você atingiu o limite de usuários do seu plano. Faça upgrade para adicionar mais membros.
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-foreground-muted">
                <span className="font-semibold text-foreground">{usedUsers}</span> de <span className="font-semibold text-foreground">{maxUsers}</span> usuários ativos
              </div>
              <button
                onClick={() => setInviteModal(true)}
                disabled={isAtUserLimit}
                title={isAtUserLimit ? 'Limite de usuários atingido — faça upgrade do plano' : 'Convidar usuário'}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={13} />
                Convidar usuário
              </button>
            </div>

            {/* Barra de progresso */}
            <div className="h-1.5 rounded-full bg-background-tertiary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usedUsers / maxUsers >= 1 ? 'bg-danger' : usedUsers / maxUsers >= 0.8 ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${Math.min(100, (usedUsers / maxUsers) * 100)}%` }}
              />
            </div>

            {/* Tabela de usuários */}
            <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-foreground-muted font-medium">Nome</th>
                      <th className="text-left p-3 text-foreground-muted font-medium">Email</th>
                      <th className="text-left p-3 text-foreground-muted font-medium">Papel</th>
                      <th className="text-left p-3 text-foreground-muted font-medium">Status</th>
                      {user?.role === 'owner' && <th className="p-3 text-foreground-muted font-medium">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="p-3 font-medium text-foreground">{u.name}</td>
                        <td className="p-3 text-foreground-muted">{u.email}</td>
                        <td className="p-3 text-foreground-muted">{ROLE_LABELS[u.role] ?? u.role}</td>
                        <td className="p-3">
                          <span className={`text-xs font-medium ${u.isActive ? 'text-success' : 'text-foreground-hint'}`}>
                            {u.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        {user?.role === 'owner' && (
                          <td className="p-3 text-center">
                            {u.id !== user?.id && (
                              <button
                                onClick={() => toggleUserMutation.mutate({ userId: u.id, isActive: !u.isActive })}
                                disabled={toggleUserMutation.isPending}
                                className="text-xs text-foreground-muted hover:text-foreground underline"
                              >
                                {u.isActive ? 'Desativar' : 'Ativar'}
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab: IA */}
        {activeTab === 'ia' && (
          <div className="space-y-4">
            {/* Toggle usar IA própria */}
            <div className="bg-background-secondary border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground text-sm">Usar minha própria IA</p>
                  <p className="text-xs text-foreground-muted mt-1">
                    Quando ativo, as análises usam sua chave de API. O custo é cobrado diretamente na sua conta do provedor.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={useOwnAI}
                  onClick={() => toggleAISourceMutation.mutate(!useOwnAI)}
                  disabled={toggleAISourceMutation.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${useOwnAI ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${useOwnAI ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {useOwnAI && (
                <div className="mt-3 p-3 bg-info/10 border border-info/30 rounded-lg text-xs text-info">
                  Ao usar IA própria, o custo das análises é cobrado diretamente na sua conta do provedor. As análises do sistema não serão contabilizadas no seu plano.
                </div>
              )}
            </div>

            {/* Configuração da IA */}
            {useOwnAI && (
              <div className="bg-background-secondary border border-border rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-1">Provedor</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none"
                  >
                    {AI_PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-1">Modelo</label>
                  <input
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder="ex: gpt-4o, gemini-1.5-pro, claude-3-5-sonnet-20241022"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground-muted mb-1">
                    API Key {aiConfig?.hasApiKey && <span className="text-success">(configurada)</span>}
                  </label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder={aiConfig?.hasApiKey ? '••••••••••••••••' : 'Cole sua API key aqui'}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Resultado do teste */}
                {aiTestResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${aiTestResult.success ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
                    {aiTestResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {aiTestResult.success
                      ? `Conexão OK — Modelo: ${aiTestResult.model} · Latência: ${aiTestResult.latencyMs}ms`
                      : aiTestResult.error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => testAIConnectionMutation.mutate()}
                    disabled={testAIConnectionMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-background-tertiary disabled:opacity-50 transition-colors"
                  >
                    {testAIConnectionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Testar conexão
                  </button>
                  <button
                    onClick={() => saveAIConfigMutation.mutate({ provider: aiProvider, model: aiModel, apiKey: aiApiKey || undefined })}
                    disabled={saveAIConfigMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {saveAIConfigMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    Salvar
                  </button>
                </div>
              </div>
            )}

            {/* Histórico de uso */}
            {tenantData?.usageHistory && tenantData.usageHistory.length > 0 && (
              <div className="bg-background-secondary border border-border rounded-xl p-5">
                <p className="text-sm font-medium text-foreground mb-4">Histórico de análises</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={tenantData.usageHistory}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--background-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="analyses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Tab: Plano */}
        {activeTab === 'plano' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : plan ? (
              <>
                {/* Card do plano atual */}
                <div className="bg-background-secondary border border-primary/30 rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-foreground-muted">Plano atual</p>
                      <p className="text-xl font-bold text-foreground">{plan.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(useOwnAI ? plan.priceWithOwnAiBrl : plan.priceWithPlatformAiBrl)}
                        <span className="text-sm font-normal text-foreground-muted">/mês</span>
                      </p>
                      <p className="text-xs text-foreground-muted">{useOwnAI ? 'sem IA do sistema' : 'inclui IA do sistema'}</p>
                    </div>
                  </div>

                  {!useOwnAI && (
                    <div className="flex items-center gap-2 p-2 bg-success/10 border border-success/30 rounded-lg text-xs text-success mb-4">
                      <TrendingUp size={13} />
                      Economize {formatCurrency(parseFloat(plan.priceWithPlatformAiBrl) - parseFloat(plan.priceWithOwnAiBrl))}/mês configurando sua própria IA →
                      <button onClick={() => setActiveTab('ia')} className="underline">Configurar</button>
                    </div>
                  )}

                  {/* Barras de uso */}
                  <div className="space-y-3">
                    {[
                      { label: 'Análises este mês', used: analysesUsed, max: plan.maxAnalysesPerMonth },
                      { label: 'Usuários ativos', used: usedUsers, max: plan.maxUsers },
                    ].map(({ label, used, max }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-foreground-muted mb-1">
                          <span>{label}</span>
                          <span><strong className="text-foreground">{used}</strong> / {max}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-background-tertiary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${used / max >= 1 ? 'bg-danger' : used / max >= 0.8 ? 'bg-warning' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features do plano */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Interesses', value: plan.maxInterests },
                    { label: 'Portais', value: plan.maxPortals },
                    { label: 'Análises/mês', value: plan.maxAnalysesPerMonth },
                    { label: 'Usuários', value: plan.maxUsers },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-background-secondary border border-border rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{value === -1 ? '∞' : value}</p>
                      <p className="text-xs text-foreground-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-foreground-muted text-sm">Nenhum plano ativo</div>
            )}
          </div>
        )}
      </div>

      {/* Modal de convite */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-foreground">Convidar usuário</h3>
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1">Papel</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none"
              >
                <option value="admin">Administrador</option>
                <option value="member">Membro</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setInviteModal(false); setInviteEmail(''); }}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-background-tertiary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => inviteMutation.mutate()}
                disabled={inviteMutation.isPending || !inviteEmail}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {inviteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Enviar convite
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
