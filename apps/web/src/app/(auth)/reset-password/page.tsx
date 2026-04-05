'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/reset-password', { token, password }),
    onSuccess: () => {
      setTimeout(() => router.push('/login'), 2000);
    },
  });

  const mismatch = password !== confirm && confirm.length > 0;
  const isWeak = password.length > 0 && password.length < 8;

  if (mutation.isSuccess) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="mx-auto text-success" size={40} />
        <h2 className="text-lg font-semibold text-foreground">Senha redefinida!</h2>
        <p className="text-sm text-foreground-muted">Redirecionando para o login...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-danger">Link inválido ou expirado.</p>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
        <p className="mt-1 text-sm text-foreground-muted">Escolha uma senha segura para sua conta.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (!mismatch && !isWeak) mutation.mutate(); }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Nova senha</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            >
              {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {isWeak && <p className="text-xs text-danger mt-1">Mínimo de 8 caracteres</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Confirmar senha</label>
          <input
            type={showPwd ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Repita a senha"
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${mismatch ? 'border-danger' : 'border-border'}`}
          />
          {mismatch && <p className="text-xs text-danger mt-1">As senhas não coincidem</p>}
        </div>

        {mutation.isError && (
          <p className="text-xs text-danger">Link inválido ou expirado. Solicite um novo link.</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || mismatch || isWeak || !password || !confirm}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
          Redefinir senha
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-foreground-muted text-sm">Carregando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
