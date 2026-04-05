'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Modalidade {
  id: string;
  name: string;
  code: string;
  portalId: string;
  isActive: boolean;
}

interface Portal {
  id: string;
  name: string;
}

export default function AdminModalidadesPage() {
  const { data: modalidades, isLoading } = useQuery<Modalidade[]>({
    queryKey: ['admin-modalidades'],
    queryFn: async () => (await api.get('/admin/modalidades')).data,
  });

  const { data: portals } = useQuery<Portal[]>({
    queryKey: ['admin-portals'],
    queryFn: async () => (await api.get('/admin/portals')).data,
  });

  const portalMap = Object.fromEntries((portals ?? []).map((p) => [p.id, p.name]));

  const grouped = (modalidades ?? []).reduce<Record<string, Modalidade[]>>((acc, m) => {
    const key = portalMap[m.portalId] ?? m.portalId;
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-bold text-foreground">Modalidades</h1>
      <p className="text-sm text-foreground-muted">
        Modalidades cadastradas por portal. Inseridas automaticamente pelo seed a partir dos dados do PNCP.
      </p>

      {isLoading ? (
        <p className="text-sm text-foreground-muted">Carregando...</p>
      ) : (
        Object.entries(grouped).map(([portalName, items]) => (
          <div key={portalName} className="bg-background-secondary border border-border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-foreground text-sm">{portalName}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-sm"
                >
                  <span className="text-foreground truncate">{m.name}</span>
                  <span className="text-xs text-foreground-muted ml-2 shrink-0">#{m.code}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
