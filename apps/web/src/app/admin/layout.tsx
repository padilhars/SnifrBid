export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-background-secondary flex items-center px-6 gap-4">
        <a href="/dashboard" className="text-foreground-muted hover:text-foreground transition-colors text-sm flex items-center gap-1">
          ← App
        </a>
        <div className="w-px h-4 bg-border" />
        <span className="font-bold text-primary">SnifrBid</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/30">Admin</span>
        <nav className="flex items-center gap-1 ml-4 overflow-x-auto">
          {[
            { href: '/admin', label: 'Métricas' },
            { href: '/admin/planos', label: 'Planos' },
            { href: '/admin/tenants', label: 'Empresas' },
            { href: '/admin/portais', label: 'Portais' },
            { href: '/admin/modalidades', label: 'Modalidades' },
            { href: '/admin/ufs', label: 'UFs' },
            { href: '/admin/filas', label: 'Filas' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-1.5 text-sm rounded-lg text-foreground-muted hover:bg-background-tertiary hover:text-foreground transition-colors whitespace-nowrap"
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
