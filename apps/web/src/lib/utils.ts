import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, pattern = 'dd/MM/yyyy'): string {
  if (!date) return '—';
  try {
    return format(new Date(date), pattern, { locale: ptBR });
  } catch {
    return '—';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  } catch {
    return '—';
  }
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  return `${Math.round(score * 100)}/100`;
}

export function scoreColor(score: number | null | undefined): string {
  const s = (score ?? 0) * 100;
  if (s >= 80) return 'text-emerald-400';
  if (s >= 60) return 'text-yellow-400';
  if (s >= 40) return 'text-slate-400';
  return 'text-red-400';
}

export function scoreBgColor(score: number | null | undefined): string {
  const s = (score ?? 0) * 100;
  if (s >= 80) return 'bg-[#022c22] text-[#6ee7b7]';
  if (s >= 60) return 'bg-[#271b05] text-[#fcd34d]';
  if (s >= 40) return 'bg-background-tertiary text-foreground-muted';
  return 'bg-[#2d0d0d] text-[#fca5a5]';
}

export function riscoBadgeConfig(nivel: string | null | undefined) {
  switch (nivel) {
    case 'baixo': return { label: 'Risco baixo', className: 'text-success border-success' };
    case 'medio': return { label: 'Risco médio', className: 'text-warning border-warning' };
    case 'alto': return { label: 'Risco alto', className: 'text-danger border-danger' };
    case 'critico': return { label: 'Crítico', className: 'text-red-600 border-red-600 font-bold' };
    default: return { label: nivel ?? '—', className: '' };
  }
}

export function applyCnpjMask(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}
