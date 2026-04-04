# SnifrBid — Guia para o Claude Code

## Stack
Node.js 24 LTS · TypeScript 5 · pnpm 10 · Turbo 2
Fastify 5 · Drizzle ORM 0.45 · PostgreSQL 17 · Redis 8 · BullMQ 5
Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/ui

## Estrutura
- `apps/api` — API Fastify, porta 4000
- `apps/workers` — Workers BullMQ (processo separado)
- `apps/web` — Frontend Next.js, porta 3000
- `packages/db` — Schema Drizzle + migrations (única fonte de verdade do banco)
- `packages/shared` — Tipos, Redis singleton, utilitários
- `packages/portal-core` — Interface IPortalAdapter
- `packages/portals` — Adapters dos portais

## Regras críticas
1. Nunca instanciar `new Redis()` fora de `packages/shared/src/redis.ts`
2. Nunca instalar `drizzle-orm` fora de `packages/db`
3. Imports relativos sempre com extensão `.js` (moduleResolution NodeNext)
4. Nunca usar `to_tsquery` com input do usuário — sempre `phraseto_tsquery`
5. Nunca usar string interpolation em queries SQL
6. `pnpm typecheck` deve passar com zero erros antes de qualquer commit
7. Workers em processo separado da API — nunca misturar
8. A rota `/licitacoes/favorites` deve ser registrada ANTES de `/licitacoes/:id`
9. Todas as queries que usam RLS devem usar o helper `withTenantContext()`
10. Senhas/segredos gerados com `openssl rand -hex 32` (nunca -base64)

## Comandos frequentes
```bash
pnpm install              # instalar dependências
pnpm build                # compilar todos os pacotes
pnpm typecheck            # verificar tipos (zero erros obrigatório)
pnpm db:migrate           # aplicar migrations
pnpm db:seed              # inserir dados iniciais
docker compose up -d      # subir PostgreSQL e Redis
cd infra && docker compose up -d  # subir infra (path correto)
```

## Ordem das fases de implementação
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7 → **Fase 8** → Fase 9 → Fase 10
(Fase 8 é implementada entre 7 e 9, mesmo aparecendo depois no doc)

## Spec completa
Ver `snifrbid-spec.md` na raiz do projeto.
