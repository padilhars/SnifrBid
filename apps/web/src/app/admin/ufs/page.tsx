'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UF {
  code: string;
  name: string;
}

export default function AdminUFsPage() {
  const { data: ufs, isLoading } = useQuery<UF[]>({
    queryKey: ['admin-ufs'],
    queryFn: async () => (await api.get('/admin/ufs')).data,
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-foreground">UFs</h1>
      <p className="text-sm text-foreground-muted">
        Unidades federativas disponíveis para filtro de licitações. Dados inseridos pelo seed.
      </p>

      {isLoading ? (
        <p className="text-sm text-foreground-muted">Carregando...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {ufs?.map((uf) => (
            <div
              key={uf.code}
              className="flex items-center gap-2 p-3 rounded-lg bg-background-secondary border border-border"
            >
              <span className="font-mono font-bold text-primary text-sm w-6">{uf.code}</span>
              <span className="text-sm text-foreground truncate">{uf.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
