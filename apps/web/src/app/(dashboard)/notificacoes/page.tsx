'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Mail, MessageCircle, Globe, Check, X, Loader2, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import type { Notification, NotificationPreferences } from '@/types';

const NOTIFICATION_TYPES = [
  { key: 'notifyNewMatch', label: 'Nova oportunidade encontrada' },
  { key: 'notifyAnalysisComplete', label: 'Análise concluída' },
  { key: 'notifyStatusChange', label: 'Mudança de status' },
  { key: 'notifyDeadlineAlert', label: 'Alerta de prazo' },
] as const;

const CHANNELS = [
  { key: 'telegramEnabled', label: 'Telegram' },
  { key: 'emailEnabled', label: 'Email' },
  { key: 'webpushEnabled', label: 'Web Push' },
] as const;

interface HistoryPage {
  data: Notification[];
  total: number;
}

export default function NotificacoesPage() {
  const qc = useQueryClient();
  const [telegramModal, setTelegramModal] = useState(false);
  const [telegramCode, setTelegramCode] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  const { data: prefs, isLoading: prefsLoading } = useQuery<NotificationPreferences>({
    queryKey: ['notif-prefs'],
    queryFn: async () => (await api.get('/notifications/preferences')).data,
  });

  const { data: history, isLoading: histLoading } = useQuery<HistoryPage>({
    queryKey: ['notif-history', historyPage],
    queryFn: async () => (await api.get('/notifications/history', { params: { page: historyPage, limit: 20 } })).data,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) => api.put('/notifications/preferences', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-prefs'] });
      toast.success('Preferências salvas');
    },
    onError: () => toast.error('Erro ao salvar preferências'),
  });

  const telegramConnectMutation = useMutation({
    mutationFn: () => api.post<{ code: string }>('/notifications/telegram/connect'),
    onSuccess: (res) => {
      setTelegramCode(res.data.code);
      setTelegramModal(true);
    },
    onError: () => toast.error('Erro ao gerar código Telegram'),
  });

  const webPushMutation = useMutation({
    mutationFn: async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await api.post('/notifications/webpush/subscribe', sub.toJSON());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notif-prefs'] });
      toast.success('Web Push ativado');
    },
    onError: () => toast.error('Erro ao ativar Web Push'),
  });

  function togglePref(key: keyof NotificationPreferences, value: boolean) {
    if (!prefs) return;
    saveMutation.mutate({ [key]: value });
  }

  const isSaving = saveMutation.isPending;

  const CHANNEL_STATUS_LABELS: Record<string, { label: string; className: string }> = {
    sent: { label: 'Enviado', className: 'text-success' },
    failed: { label: 'Falhou', className: 'text-danger' },
    pending: { label: 'Pendente', className: 'text-warning' },
  };

  const CHANNEL_ICONS: Record<string, React.ReactNode> = {
    telegram: <MessageCircle size={14} />,
    email: <Mail size={14} />,
    webpush: <Globe size={14} />,
  };

  return (
    <AppShell title="Notificações">
      <div className="max-w-3xl space-y-8">

        {/* Canais */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">Canais de notificação</h2>
          <div className="space-y-3">

            {/* Telegram */}
            <div className="bg-background-secondary border border-border rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MessageCircle size={20} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Telegram</p>
                    {prefs?.telegramChatId ? (
                      <p className="text-xs text-success">Conectado (ID: {prefs.telegramChatId})</p>
                    ) : (
                      <p className="text-xs text-foreground-muted">Não conectado</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {prefsLoading ? <Skeleton className="h-6 w-12 rounded-full" /> : (
                    <button
                      role="switch"
                      aria-checked={prefs?.telegramEnabled}
                      onClick={() => togglePref('telegramEnabled', !prefs?.telegramEnabled)}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs?.telegramEnabled ? 'bg-primary' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs?.telegramEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  )}
                  <button
                    onClick={() => telegramConnectMutation.mutate()}
                    disabled={telegramConnectMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                  >
                    {telegramConnectMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : prefs?.telegramChatId ? 'Reconectar' : 'Conectar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-background-secondary border border-border rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-xs text-foreground-muted">Notificações por email</p>
                  </div>
                </div>
                {prefsLoading ? <Skeleton className="h-6 w-11 rounded-full" /> : (
                  <button
                    role="switch"
                    aria-checked={prefs?.emailEnabled}
                    onClick={() => togglePref('emailEnabled', !prefs?.emailEnabled)}
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs?.emailEnabled ? 'bg-primary' : 'bg-border'}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs?.emailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Web Push */}
            <div className="bg-background-secondary border border-border rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Web Push</p>
                    <p className="text-xs text-foreground-muted">Notificações no navegador</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {prefsLoading ? <Skeleton className="h-6 w-12 rounded-full" /> : (
                    <button
                      role="switch"
                      aria-checked={prefs?.webpushEnabled}
                      onClick={() => togglePref('webpushEnabled', !prefs?.webpushEnabled)}
                      disabled={isSaving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prefs?.webpushEnabled ? 'bg-primary' : 'bg-border'}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${prefs?.webpushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  )}
                  {!prefs?.webpushEnabled && (
                    <button
                      onClick={() => webPushMutation.mutate()}
                      disabled={webPushMutation.isPending}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {webPushMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Ativar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tipos de notificação */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">Tipos de notificação</h2>
          <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-foreground-muted font-medium">Evento</th>
                  {CHANNELS.map((c) => (
                    <th key={c.key} className="p-3 text-foreground-muted font-medium text-center">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_TYPES.map(({ key, label }) => (
                  <tr key={key} className="border-b border-border last:border-0">
                    <td className="p-3 text-foreground">{label}</td>
                    {CHANNELS.map((c) => (
                      <td key={c.key} className="p-3 text-center">
                        {prefsLoading ? (
                          <Skeleton className="h-4 w-4 rounded mx-auto" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={!!(prefs as unknown as Record<string, unknown>)?.[key]}
                            onChange={(e) => togglePref(key as keyof NotificationPreferences, e.target.checked)}
                            disabled={isSaving || !(prefs as unknown as Record<string, unknown>)?.[c.key]}
                            className="rounded border-border accent-primary h-4 w-4"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alerta de prazo */}
          <div className="mt-3 flex items-center gap-3 bg-background-secondary border border-border rounded-xl p-4">
            <Bell size={16} className="text-foreground-muted shrink-0" />
            <span className="text-sm text-foreground">Alertar quando faltarem</span>
            {prefsLoading ? <Skeleton className="h-8 w-16" /> : (
              <input
                type="number"
                min={1}
                max={30}
                defaultValue={prefs?.deadlineAlertDays ?? 3}
                onBlur={(e) => saveMutation.mutate({ deadlineAlertDays: parseInt(e.target.value) || 3 })}
                className="w-16 text-sm px-2 py-1 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
            <span className="text-sm text-foreground">dias para o prazo</span>
            {isSaving && <Loader2 size={14} className="animate-spin text-foreground-muted" />}
          </div>
        </section>

        {/* Histórico */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-3">Histórico de notificações</h2>
          <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
            {histLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !history?.data.length ? (
              <div className="p-8 text-center text-foreground-muted text-sm">Nenhuma notificação enviada ainda</div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-foreground-muted font-medium">Data</th>
                      <th className="text-left p-3 text-foreground-muted font-medium">Tipo</th>
                      <th className="text-left p-3 text-foreground-muted font-medium">Canal</th>
                      <th className="text-left p-3 text-foreground-muted font-medium">Mensagem</th>
                      <th className="text-left p-3 text-foreground-muted font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.map((n) => {
                      const statusCfg = CHANNEL_STATUS_LABELS[n.status] ?? { label: n.status, className: '' };
                      return (
                        <tr key={n.id} className="border-b border-border last:border-0">
                          <td className="p-3 text-foreground-muted whitespace-nowrap">{formatDateTime(n.sentAt ?? n.createdAt)}</td>
                          <td className="p-3 text-foreground">{n.type.replace(/_/g, ' ')}</td>
                          <td className="p-3">
                            <span className="flex items-center gap-1.5 text-foreground-muted">
                              {CHANNEL_ICONS[n.channel] ?? <Bell size={14} />}
                              {n.channel}
                            </span>
                          </td>
                          <td className="p-3 text-foreground-muted max-w-xs truncate">{n.title ?? n.body ?? '—'}</td>
                          <td className="p-3">
                            <span className={`flex items-center gap-1 text-xs font-medium ${statusCfg.className}`}>
                              {n.status === 'sent' ? <Check size={12} /> : n.status === 'failed' ? <X size={12} /> : <RefreshCw size={12} />}
                              {statusCfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Paginação */}
                {history.total > 20 && (
                  <div className="flex items-center justify-between p-3 border-t border-border">
                    <button
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40 transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-foreground-muted">Página {historyPage}</span>
                    <button
                      onClick={() => setHistoryPage((p) => p + 1)}
                      disabled={historyPage * 20 >= history.total}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground disabled:opacity-40 transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Modal Telegram */}
      {telegramModal && telegramCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-foreground">Conectar Telegram</h3>
            <p className="text-sm text-foreground-muted">
              Abra o Telegram, procure o bot <strong>@SnifrBidBot</strong> e envie o código abaixo:
            </p>
            <div className="bg-background-tertiary rounded-lg p-4 text-center">
              <code className="text-2xl font-mono font-bold text-primary tracking-widest">{telegramCode}</code>
            </div>
            <p className="text-xs text-foreground-hint text-center">O código expira em 10 minutos</p>
            <button
              onClick={() => { setTelegramModal(false); qc.invalidateQueries({ queryKey: ['notif-prefs'] }); }}
              className="w-full text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
