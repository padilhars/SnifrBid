'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { applyCnpjMask } from '@/lib/utils';
import type { User, Tenant } from '@/types';

const step1Schema = z.object({
  companyName: z.string().min(1, 'Nome da empresa obrigatório'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  planSlug: z.enum(['free', 'basic', 'pro', 'enterprise']),
});

const step2Schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'Aceite os termos para continuar' }) }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

const PLANS = [
  { slug: 'free', name: 'Gratuito', price: 'R$ 0', features: ['1 interesse', '1 portal', '10 análises/mês'] },
  { slug: 'basic', name: 'Básico', price: 'R$ 197/mês', features: ['3 interesses', '2 portais', '50 análises/mês'] },
  { slug: 'pro', name: 'Pro', price: 'R$ 497/mês', features: ['10 interesses', '4 portais', '200 análises/mês'] },
  { slug: 'enterprise', name: 'Enterprise', price: 'R$ 1.497/mês', features: ['Ilimitado', 'Todos portais', 'Análises ilimitadas'] },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<z.infer<typeof step1Schema> | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form1 = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: { planSlug: 'free' },
  });

  const form2 = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
  });

  const onStep1 = (data: z.infer<typeof step1Schema>) => {
    setStep1Data(data);
    setStep(2);
  };

  const onStep2 = async (data: z.infer<typeof step2Schema>) => {
    if (!step1Data) return;
    setServerError(null);
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string; user: User; tenant: Tenant }>('/auth/register', {
        companyName: step1Data.companyName,
        cnpj: step1Data.cnpj,
        planSlug: step1Data.planSlug,
        name: data.name,
        email: data.email,
        password: data.password,
      });
      document.cookie = `snifrbid_session=1; path=/; max-age=${60 * 60 * 24 * 7}; Secure; SameSite=Lax`;
      setAuth(res.data.user, res.data.tenant, res.data.accessToken, res.data.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setServerError(msg ?? 'Erro ao criar conta. Tente novamente.');
    }
  };

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= n ? 'bg-primary text-primary-foreground' : 'bg-border text-foreground-muted'}`}>
              {n}
            </div>
            {n < 2 && <div className={`w-12 h-0.5 transition-colors ${step > n ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Dados da empresa</h1>
          <p className="text-foreground-muted mb-6 text-sm">Passo 1 de 2</p>

          <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome da empresa</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                {...form1.register('companyName')}
              />
              {form1.formState.errors.companyName && (
                <p className="mt-1 text-xs text-danger">{form1.formState.errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">CNPJ</label>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                {...form1.register('cnpj', {
                  onChange: (e) => {
                    e.target.value = applyCnpjMask(e.target.value);
                  },
                })}
              />
              {form1.formState.errors.cnpj && (
                <p className="mt-1 text-xs text-danger">{form1.formState.errors.cnpj.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Plano</label>
              <div className="grid grid-cols-2 gap-2">
                {PLANS.map((plan) => (
                  <label key={plan.slug} className={`cursor-pointer rounded-lg border p-3 transition-colors ${form1.watch('planSlug') === plan.slug ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <input type="radio" value={plan.slug} {...form1.register('planSlug')} className="sr-only" />
                    <div className="font-medium text-sm text-foreground">{plan.name}</div>
                    <div className="text-xs text-primary font-semibold">{plan.price}</div>
                    <ul className="mt-1 space-y-0.5">
                      {plan.features.map((f) => (
                        <li key={f} className="text-xs text-foreground-muted">• {f}</li>
                      ))}
                    </ul>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setStep(1)} className="text-foreground-muted hover:text-foreground">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Dados do responsável</h1>
          </div>
          <p className="text-foreground-muted mb-6 text-sm">Passo 2 de 2</p>

          <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
            {serverError && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
                {serverError}
              </div>
            )}

            {(['name', 'email', 'password', 'confirmPassword'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {field === 'name' ? 'Nome completo' : field === 'email' ? 'Email' : field === 'password' ? 'Senha' : 'Confirmar senha'}
                </label>
                <input
                  type={field.toLowerCase().includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  {...form2.register(field)}
                />
                {form2.formState.errors[field] && (
                  <p className="mt-1 text-xs text-danger">{form2.formState.errors[field]?.message}</p>
                )}
              </div>
            ))}

            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" {...form2.register('acceptedTerms')} className="mt-0.5" />
              <span className="text-sm text-foreground-muted">
                Li e aceito os{' '}
                <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link>
              </span>
            </label>
            {form2.formState.errors.acceptedTerms && (
              <p className="text-xs text-danger">{form2.formState.errors.acceptedTerms.message}</p>
            )}

            <button
              type="submit"
              disabled={form2.formState.isSubmitting}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {form2.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Criar conta
            </button>
          </form>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Já tem conta?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">Entrar</Link>
      </p>
    </div>
  );
}
