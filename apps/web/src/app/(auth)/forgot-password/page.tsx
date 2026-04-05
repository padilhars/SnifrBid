'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/auth/forgot-password', { email }),
  });

  if (mutation.isSuccess) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="mx-auto text-success" size={40} />
        <h2 className="text-lg font-semibold text-foreground">Email enviado</h2>
        <p className="text-sm text-foreground-muted">
          Se existe uma conta com o email <strong>{email}</strong>, você receberá as instruções para redefinir a senha.
        </p>
        <Link href="/login" className="inline-block text-sm text-primary hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Esqueceu a senha?</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Informe seu email e enviaremos as instruções de recuperação.
        </p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-foreground-muted mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {mutation.isError && (
          <p className="text-xs text-danger">Erro ao enviar email. Tente novamente.</p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || !email}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
          Enviar instruções
        </button>
      </form>

      <Link href="/login" className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors">
        <ArrowLeft size={14} />
        Voltar ao login
      </Link>
    </div>
  );
}
