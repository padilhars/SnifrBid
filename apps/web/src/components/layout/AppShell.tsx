'use client';

import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
}

export function AppShell({ children, title }: AppShellProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content — offset pelo sidebar */}
      <div className={cn('transition-all duration-200', sidebarOpen ? 'ml-[220px]' : 'ml-[60px]')}>
        <Topbar title={title} />
        <main className="p-6 min-h-[calc(100vh-4rem)] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
