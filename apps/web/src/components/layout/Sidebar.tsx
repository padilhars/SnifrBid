'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Star, Bell, Settings,
  ChevronLeft, ChevronRight, LogOut, BarChart3, ShieldCheck,
  Users, Globe, Map, Trophy,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotifStore } from '@/stores/notifStore';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/licitacoes', label: 'Licitações', icon: FileText },
  { href: '/participando', label: 'Participando', icon: Trophy },
  { href: '/interesses', label: 'Meus interesses', icon: Star },
  { href: '/portais', label: 'Portais', icon: Globe },
  { href: '/ufs', label: 'Unidades Federativas', icon: Map },
  { href: '/usuarios', label: 'Usuários', icon: Users },
  { href: '/acompanhamento', label: 'Acompanhamento', icon: BarChart3 },
  { href: '/notificacoes', label: 'Notificações', icon: Bell, badge: true },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const { unreadCount } = useNotifStore();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignora erro de logout
    }
    clearAuth();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-background-secondary border-r border-border flex flex-col transition-all duration-200 z-40',
        sidebarOpen ? 'w-[220px]' : 'w-[60px]',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border', sidebarOpen ? 'justify-between' : 'justify-center')}>
        {sidebarOpen && (
          <Link href="/dashboard" className="font-bold text-lg text-primary">SnifrBid</Link>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-background-tertiary text-foreground-muted hover:text-foreground transition-colors"
          aria-label={sidebarOpen ? 'Recolher sidebar' : 'Expandir sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm relative',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground-muted hover:bg-background-tertiary hover:text-foreground',
                !sidebarOpen && 'justify-center px-0',
              )}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
              {badge && unreadCount > 0 && (
                <span className={cn(
                  'text-xs rounded-full bg-danger text-white font-bold flex items-center justify-center',
                  sidebarOpen ? 'ml-auto w-5 h-5' : 'absolute top-1 right-1 w-4 h-4 text-[10px]',
                )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin link — visível apenas para system_admin */}
      {user?.role === 'system_admin' && (
        <div className="px-2 pb-1 border-t border-border pt-1">
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm',
              pathname.startsWith('/admin')
                ? 'bg-danger/10 text-danger font-medium'
                : 'text-foreground-muted hover:bg-background-tertiary hover:text-foreground',
              !sidebarOpen && 'justify-center px-0',
            )}
            title={!sidebarOpen ? 'Admin' : undefined}
          >
            <ShieldCheck size={18} className="shrink-0" />
            {sidebarOpen && <span>Admin</span>}
          </Link>
        </div>
      )}

      {/* User footer */}
      <div className="p-2 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sm text-foreground-muted hover:bg-background-tertiary hover:text-danger transition-colors',
            !sidebarOpen && 'justify-center px-0',
          )}
          title={!sidebarOpen ? 'Sair' : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {sidebarOpen && (
            <div className="text-left overflow-hidden">
              <div className="truncate text-foreground text-xs font-medium">{user?.name}</div>
              <div className="truncate text-foreground-hint text-xs">Sair</div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
