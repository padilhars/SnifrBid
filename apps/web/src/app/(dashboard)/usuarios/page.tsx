'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/shared/LoadingSkeleton';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/utils';

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  member: 'Membro',
};

function InviteModal({ onClose, maxUsers, currentCount }: { onClose: () => void; maxUsers: number; currentCount: number }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: () => api.post('/tenants/users/invite', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-users'] });
      toast.success('Usuário criado com sucesso');
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? 'Erro ao criar usuário');
    },
  });

  const atLimit = maxUsers !== -1 && currentCount >= maxUsers;
  const valid = form.name && form.email && form.password;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary border border-border rounded-xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Novo usuário</h3>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground"><X size={18} /></button>
        </div>

        {atLimit && (
          <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            Limite de {maxUsers} usuário(s) atingido. Faça upgrade do plano.
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Nome completo</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Senha</label>
          <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Papel</label>
          <select value={form.role} onChange={(e) => set('role', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none">
            <option value="member">Membro</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground-muted hover:text-foreground">Cancelar</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !valid || atLimit}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ user, onClose }: { user: TenantUser; onClose: () => void }) {
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [form, setForm] = useState({ name: user.name, role: user.role });

  const mutation = useMutation({
    mutationFn: () => api.patch(`/tenants/users/${user.id}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-users'] });
      toast.success('Usuário atualizado');
      onClose();
    },
    onError: () => toast.error('Erro ao atualizar usuário'),
  });

  const isOwner = user.role === 'owner';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-secondary border border-border rounded-xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Editar usuário</h3>
          <button onClick={onClose} className="text-foreground-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Nome</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        {!isOwner && currentUser?.role === 'owner' && (
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1">Papel</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none">
              <option value="member">Membro</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 text-sm rounded-lg border border-border text-foreground-muted hover:text-foreground">Cancelar</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const qc = useQueryClient();
  const { user: currentUser, tenant } = useAuthStore();
  const [showInvite, setShowInvite] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);

  const { data: users, isLoading } = useQuery<TenantUser[]>({
    queryKey: ['tenant-users'],
    queryFn: async () => (await api.get('/tenants/users')).data,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-users'] });
      toast.success('Usuário desativado');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? 'Erro ao desativar usuário');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tenants/users/${id}`, { isActive: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-users'] });
      toast.success('Usuário reativado');
    },
    onError: () => toast.error('Erro ao reativar usuário'),
  });

  const isAdmin = currentUser?.role === 'system_admin';
  const canManage = ['owner', 'admin', 'system_admin'].includes(currentUser?.role ?? '');
  const maxUsers = isAdmin ? -1 : (tenant?.plan?.maxUsers ?? 1);
  const activeCount = users?.filter((u) => u.isActive).length ?? 0;
  const atLimit = maxUsers !== -1 && activeCount >= maxUsers;

  return (
    <AppShell title="Usuários">
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground-muted">
            <span className="font-semibold text-foreground">{activeCount}</span>
            {maxUsers !== -1 && <> de <span className="font-semibold text-foreground">{maxUsers}</span></>} usuário{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''}
          </div>
          {canManage && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus size={15} />
              Novo usuário
            </button>
          )}
        </div>

        {maxUsers !== -1 && (
          <div className="h-1.5 rounded-full bg-background-tertiary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${activeCount / maxUsers >= 1 ? 'bg-danger' : activeCount / maxUsers >= 0.8 ? 'bg-warning' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, (activeCount / maxUsers) * 100)}%` }}
            />
          </div>
        )}

        <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !users?.length ? (
            <div className="p-8 text-center text-foreground-muted text-sm">Nenhum usuário encontrado</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-foreground-muted font-medium">Usuário</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Papel</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Status</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Último acesso</th>
                  <th className="text-left p-3 text-foreground-muted font-medium">Cadastrado</th>
                  {canManage && <th className="p-3 text-foreground-muted font-medium">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-background-tertiary/30">
                    <td className="p-3">
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-foreground-muted">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${u.role === 'owner' ? 'bg-primary/10 text-primary border-primary/20' : u.role === 'admin' ? 'bg-warning/10 text-warning border-warning/20' : 'border-border text-foreground-muted'}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-medium ${u.isActive ? 'text-success' : 'text-foreground-hint'}`}>
                        {u.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-foreground-muted">{u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}</td>
                    <td className="p-3 text-xs text-foreground-muted">{formatDate(u.createdAt)}</td>
                    {canManage && (
                      <td className="p-3">
                        <div className="flex items-center gap-1 justify-end">
                          {u.id !== currentUser?.id && (
                            <>
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
                                title="Editar"
                              >
                                <Pencil size={12} />
                              </button>
                              {u.isActive ? (
                                <button
                                  onClick={() => {
                                    if (confirm(`Desativar ${u.name}?`)) deactivateMutation.mutate(u.id);
                                  }}
                                  disabled={deactivateMutation.isPending}
                                  className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-danger transition-colors"
                                  title="Desativar"
                                >
                                  <Trash2 size={12} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => reactivateMutation.mutate(u.id)}
                                  disabled={reactivateMutation.isPending || atLimit}
                                  className="text-xs px-2 py-1 rounded-lg border border-border text-foreground-muted hover:text-success transition-colors disabled:opacity-40"
                                  title={atLimit ? 'Limite de usuários atingido' : 'Reativar'}
                                >
                                  Reativar
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          maxUsers={maxUsers}
          currentCount={activeCount}
        />
      )}
      {editingUser && <EditModal user={editingUser} onClose={() => setEditingUser(null)} />}
    </AppShell>
  );
}
