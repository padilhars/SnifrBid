'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, tenant } = useAuthStore();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background-secondary">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Plano badge */}
        {tenant?.plan && (
          <span className="hidden sm:inline text-xs px-2 py-1 rounded-full border border-border text-foreground-muted capitalize">
            {tenant.plan.name}
          </span>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-background-tertiary text-foreground-muted hover:text-foreground transition-colors"
          aria-label="Alternar tema"
        >
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
          {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      </div>
    </header>
  );
}
