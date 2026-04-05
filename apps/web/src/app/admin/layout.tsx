import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin layout — proteção adicional feita pelo middleware
  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-background-secondary flex items-center px-6 gap-4">
        <span className="font-bold text-primary">SnifrBid</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/30">Admin</span>
        <nav className="flex items-center gap-1 ml-4">
          {[
            { href: '/admin', label: 'Métricas' },
            { href: '/admin/tenants', label: 'Tenants' },
            { href: '/admin/portais', label: 'Portais' },
            { href: '/admin/filas', label: 'Filas' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-1.5 text-sm rounded-lg text-foreground-muted hover:bg-background-tertiary hover:text-foreground transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
