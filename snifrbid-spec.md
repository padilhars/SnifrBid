# SnifrBid — Especificação Técnica Completa para Implementação

> **Documento de referência para o Claude Code.**
> Siga as fases em ordem. Conclua e valide cada fase antes de avançar.
> Cada fase termina com uma checklist de validação obrigatória.

---

---

## Instruções de execução para o Claude Code

> Esta seção deve ser lida **antes de qualquer implementação**. Define o comportamento esperado durante todo o desenvolvimento.

### Modo de operação: autônomo com validação por fase

O Claude Code deve implementar o sistema de forma totalmente autônoma, fase por fase, seguindo esta disciplina em cada etapa:

```
1. Ler a especificação da fase integralmente antes de escrever qualquer código
2. Implementar todos os arquivos da fase
3. Executar a checklist de validação da fase (todos os itens)
4. Corrigir qualquer item que falhou antes de avançar
5. Reportar o resultado ao usuário com o seguinte formato:
```

**Formato obrigatório de relatório ao final de cada fase:**

```
✅ FASE N — [nome] — CONCLUÍDA

Implementado:
- [lista do que foi criado/modificado]

Validação:
- ✅ [item da checklist] — OK
- ✅ [item da checklist] — OK
- ✅ [item da checklist] — OK

Pronto para avançar para a Fase N+1.
```

Se algum item da checklist falhar:

```
⚠️ FASE N — [nome] — BLOQUEADA

Problema encontrado:
- ❌ [item que falhou] — [descrição do erro]

Correção aplicada:
- [o que foi feito para corrigir]

Re-validação:
- ✅ [item] — OK após correção

Pronto para avançar para a Fase N+1.
```

### Regras de ouro para o Claude Code

1. **Nunca avançar de fase sem validação completa.** Se um item da checklist falha e não consegue ser corrigido, parar e reportar ao usuário antes de prosseguir.

2. **Testar com dados reais.** Cada validação funcional deve usar dados reais — não mocks. Se a checklist diz "coleta pelo menos 1 licitação", fazer a chamada real à API do PNCP.

3. **Compilação TypeScript obrigatória.** Ao final de cada fase que envolva código TypeScript, executar `pnpm typecheck` em todo o monorepo. Zero erros é o critério de aceite.

4. **Commits atômicos por fase.** Ao concluir e validar cada fase, fazer um commit com a mensagem `feat: fase N — [nome] concluída e validada`.

5. **Nunca ignorar erros com `@ts-ignore` ou `any` para "fazer avançar".** Resolver o erro de verdade.

6. **Ao encontrar uma decisão não especificada**, preferir a opção mais simples e documentar no código com um comentário `// DECISÃO: [justificativa]`.

7. **Ler o documento completo (`snifrbid-spec.md`) antes de iniciar a Fase 1**, para entender todas as dependências e decisões arquiteturais antes de escrever a primeira linha.

---

## MCP Servers recomendados para o Claude Code

Instale os servidores MCP abaixo antes de iniciar a implementação. Eles dão ao Claude Code acesso direto ao banco, ao Redis e à documentação atualizada das bibliotecas — eliminando o ciclo de "escrever → copiar resultado → colar de volta".

### Instalação (executar na raiz do projeto)

#### 1. PostgreSQL MCP — acesso direto ao banco
Permite que o Claude Code inspecione o schema, valide migrations, verifique dados inseridos pelo seed e debugue queries sem sair do terminal.

```bash
claude mcp add postgres   --scope project   -- npx --yes @modelcontextprotocol/server-postgres   "postgresql://snifr:SUA_SENHA@localhost:5432/snifrbid"
```

**Uso durante a implementação:**
- Verificar se todas as tabelas foram criadas corretamente após migration
- Confirmar que o seed inseriu os dados esperados
- Debugar queries do Drizzle inspecionando o resultado diretamente

#### 2. Redis MCP — acesso direto ao Redis
Permite inspecionar filas BullMQ, verificar jobs enfileirados, checar estado de cache e confirmar que não há conexões vazando.

```bash
claude mcp add redis   --scope project   -- npx --yes @modelcontextprotocol/server-redis   "redis://:SUA_SENHA@localhost:6379"
```

**Uso durante a implementação:**
- Verificar jobs enfileirados no BullMQ após coleta
- Inspecionar cache de filtros e do provedor de IA ativo
- Confirmar que tokens JWT revogados estão na blacklist

#### 3. Context7 MCP — documentação atualizada das bibliotecas
Busca documentação real e atualizada de qualquer biblioteca diretamente dos repositórios oficiais. Crítico para Drizzle ORM, Fastify 5, BullMQ e Next.js 16, que têm APIs que mudaram recentemente.

```bash
claude mcp add context7   --scope project   -- npx --yes @upstash/context7-mcp
```

**Uso durante a implementação:**
- Consultar API correta do Drizzle 0.45.x antes de escrever queries
- Verificar breaking changes do Next.js 16 / Tailwind 4
- Checar sintaxe atualizada do Fastify 5 para plugins e hooks

#### 4. Git MCP — controle de versão integrado
Permite que o Claude Code faça commits atômicos ao final de cada fase validada, sem precisar de comandos manuais.

```bash
claude mcp add git   --scope project   -- uvx mcp-server-git
```

**Uso durante a implementação:**
- Commit automático ao final de cada fase validada
- Inspecionar diff antes de commitar para garantir que apenas o esperado foi alterado
- Criar branches por fase se desejado

### Verificar instalação dos MCPs

Após instalar todos, confirmar que estão ativos:

```bash
claude mcp list
```

Deve exibir: `postgres`, `redis`, `context7`, `git` com status `connected`.

### Skills recomendadas

Instale as skills antes de iniciar a implementação. Elas ampliam as capacidades do Claude Code com memória persistente entre sessões, autonomia de loop e inteligência de design.

#### ralph-loop — autonomia entre sessões
Executa as fases da spec como PRD de forma autônoma. Cada iteração spawna uma nova instância do Claude Code com contexto limpo; ao concluir, atualiza os arquivos `CLAUDE.md` com aprendizados para a próxima iteração.

```bash
git clone https://github.com/harrymunro/ralph-wiggum ~/.claude/skills/ralph
```

#### claude-mem — memória persistente entre sessões
Captura tudo que o Claude Code faz, comprime com IA e injeta contexto relevante nas sessões seguintes. Resolve o problema de "esquecer" decisões arquiteturais das fases anteriores ao retomar o trabalho.

```bash
/plugin install claude-mem
```

#### ui-ux-pro-max — inteligência de design para Next.js + shadcn
Banco de dados pesquisável de estilos, paletas, tipografia e padrões de UX. Suporta nativamente a stack Next.js + shadcn/ui usada no projeto.

```bash
npx uipro-cli init
```

#### frontend-design — já disponível
Esta skill já está ativa no ambiente. Nenhuma instalação necessária.

#### security (opcional) — auditoria automatizada
Varredura de injeção de comando, exfiltração de dados, prompt injection e riscos de dependências. Útil como validação extra ao final de cada fase.

```bash
/plugin install skill-security-auditor@alirezarezvani/claude-skills
```

---

### Ordem de instalação recomendada

```bash
# 1. Subir infraestrutura primeiro (PostgreSQL e Redis precisam estar rodando)
cd infra && docker compose up -d

# 2. Instalar MCPs
claude mcp add postgres --scope project -- npx --yes @modelcontextprotocol/server-postgres "postgresql://snifr:SENHA@localhost:5432/snifrbid"
claude mcp add redis --scope project -- npx --yes @modelcontextprotocol/server-redis "redis://:SENHA@localhost:6379"
claude mcp add context7 --scope project -- npx --yes @upstash/context7-mcp
claude mcp add git --scope project -- uvx mcp-server-git

# 3. Instalar skills
git clone https://github.com/harrymunro/ralph-wiggum ~/.claude/skills/ralph
/plugin install claude-mem
npx uipro-cli init
/plugin install skill-security-auditor@alirezarezvani/claude-skills

# 4. Verificar MCPs
claude mcp list

# 5. Iniciar implementação
claude
```

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Stack e Versões](#2-stack-e-versões)
3. [Estrutura do Monorepo](#3-estrutura-do-monorepo)
4. [Schema do Banco de Dados](#4-schema-do-banco-de-dados)
5. [Fase 1 — Infraestrutura do Servidor](#fase-1--infraestrutura-do-servidor)
6. [Fase 2 — Monorepo e Pacotes Base](#fase-2--monorepo-e-pacotes-base)
7. [Fase 3 — API Core (Fastify)](#fase-3--api-core-fastify)
8. [Fase 4 — Sistema de Portais Plugável](#fase-4--sistema-de-portais-plugável)
9. [Fase 5 — Workers e Filas (BullMQ)](#fase-5--workers-e-filas-bullmq)
10. [Fase 6 — Motor de Matching e IA](#fase-6--motor-de-matching-e-ia)
11. [Fase 7 — Notificações](#fase-7--notificações)
12. [Fase 8 — Frontend (Next.js)](#fase-8--frontend-nextjs)
13. [Fase 9 — Multi-tenancy e Planos](#fase-9--multi-tenancy-e-planos)
14. [Fase 10 — Portais Adicionais](#fase-10--portais-adicionais)
15. [Variáveis de Ambiente](#variáveis-de-ambiente)
16. [Decisões Arquiteturais e Regras](#decisões-arquiteturais-e-regras)

---

## 1. Visão Geral do Sistema

O SnifrBid é uma plataforma SaaS multi-tenant que monitora automaticamente licitações públicas brasileiras e usa IA para identificar oportunidades relevantes para cada empresa cadastrada.

### Fluxo principal

```
Portais externos (PNCP, ComprasRS, BNC, Banrisul)
        ↓  (API REST ou scraping, ciclo de 4h)
Agregação de filtros ativos
  └─ union de todas as modalidades + UFs dos interesses ativos de todos os tenants
        ↓
Workers de Coleta (BullMQ)
  └─ coleta já parametrizada: só modalidades e UFs que alguém monitora
        ↓
Motor de Matching (FTS + pg_trgm + pgvector)
        ↓  (apenas matches)
Análise IA (provedor configurado pelo admin)
        ↓
Notificações (Telegram + Email + Web Push)
        ↓
Frontend (dashboard por tenant)
```

### Conceitos-chave

- **Tenant**: empresa cadastrada na plataforma
- **Interesse**: configuração de monitoramento de um tenant (palavras-chave + modalidades + regiões + portais)
- **Licitação**: oportunidade coletada de um portal
- **Match**: licitação que satisfaz um interesse de um tenant
- **Análise**: resultado da avaliação da licitação pelo provedor de IA ativo (Gemini, OpenAI, Claude ou próprio do tenant)
- **Portal**: fonte de dados (PNCP, ComprasRS, etc.) — plugável via adapter

---

## 2. Stack e Versões

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | **24 LTS** (Krypton) | Runtime — LTS ativo até abril/2028 |
| TypeScript | **5.x** (latest) | Linguagem |
| pnpm | **10.x** (latest) | Gerenciador de pacotes |
| Turbo | **2.x** (latest) | Monorepo build orchestration |
| Fastify | **5.x** (latest, 5.8+) | API HTTP |
| Next.js | **16.x** (latest stable) | Frontend |
| Drizzle ORM | **0.45.x** (latest) | ORM + migrations |
| Drizzle Kit | **0.30.x** (latest) | CLI de migrations |
| PostgreSQL | **17** | Banco de dados principal |
| pgvector | **0.8.x** | Extensão vetorial |
| Redis | **8.x** | Cache + filas |
| BullMQ | **5.x** (latest, 5.72+) | Sistema de filas |
| Docker Engine | **28.x** | Containers |
| Docker Compose | **v2** (latest) | Orquestração local/prod |
| Nginx | **1.28.x** (mainline) | Reverse proxy |
| Certbot | latest | SSL/TLS automático |
| PM2 | **5.x** (latest) | Process manager (workers) |

### Extensões PostgreSQL obrigatórias

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Configuração FTS para português

```sql
CREATE TEXT SEARCH CONFIGURATION snifrbid_pt (COPY = pg_catalog.portuguese);
ALTER TEXT SEARCH CONFIGURATION snifrbid_pt
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, portuguese_stem;
```

---

## 3. Estrutura do Monorepo

```
snifrbid/
├── apps/
│   ├── api/                    # Fastify 5 — processo na porta 4000
│   │   ├── src/
│   │   │   ├── server.ts       # bootstrap do Fastify
│   │   │   ├── routes/         # rotas organizadas por domínio
│   │   │   │   ├── auth/
│   │   │   │   ├── tenants/
│   │   │   │   ├── interests/
│   │   │   │   ├── licitacoes/
│   │   │   │   ├── notifications/
│   │   │   │   └── admin/
│   │   │   ├── plugins/        # plugins Fastify (auth, cors, rateLimit)
│   │   │   ├── hooks/          # onRequest, preHandler
│   │   │   ├── schemas/        # JSON schemas (Zod → TypeBox)
│   │   │   └── services/       # lógica de negócio da API
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── workers/                # BullMQ workers — processo separado
│   │   ├── src/
│   │   │   ├── main.ts         # bootstrap dos workers
│   │   │   ├── queues/         # definição e configuração das filas
│   │   │   ├── workers/        # implementações dos workers
│   │   │   │   ├── CollectionWorker.ts
│   │   │   │   ├── MatchingWorker.ts
│   │   │   │   ├── AnalysisWorker.ts
│   │   │   │   ├── NotificationWorker.ts
│   │   │   │   └── MonitoringWorker.ts
│   │   │   ├── schedulers/     # cron jobs (FlowProducer)
│   │   │   └── services/       # lógica específica dos workers
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                    # Next.js 16 — porta 3000 (interno)
│       ├── src/
│       │   ├── app/            # App Router
│       │   │   ├── (auth)/     # login, register, forgot-password
│       │   │   ├── (dashboard)/ # área logada do tenant
│       │   │   │   ├── oportunidades/
│       │   │   │   ├── interesses/
│       │   │   │   ├── notificacoes/
│       │   │   │   └── configuracoes/
│       │   │   └── admin/      # painel administrativo
│       │   ├── components/
│       │   ├── lib/
│       │   └── hooks/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── db/                     # Schema Drizzle + migrations + seed
│   │   ├── src/
│   │   │   ├── index.ts        # exporta db, schema, types
│   │   │   ├── schema/         # definições de tabelas por domínio
│   │   │   ├── migrations/     # arquivos SQL gerados pelo drizzle-kit
│   │   │   └── seed/           # dados iniciais (portais, modalidades)
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared/                 # tipos, utilitários, constantes compartilhados
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types/          # interfaces e tipos TypeScript
│   │   │   ├── utils/          # helpers (datas, strings, hashing)
│   │   │   ├── constants/      # enums, constantes de domínio
│   │   │   └── redis.ts        # singleton do cliente Redis
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── portal-core/            # interface IPortalAdapter + BaseAdapter
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── IPortalAdapter.ts
│   │   │   ├── BaseAdapter.ts
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── portals/                # implementações dos adapters
│       ├── src/
│       │   ├── index.ts
│       │   ├── pncp/
│       │   │   ├── PNCPAdapter.ts
│       │   │   └── pncp.types.ts
│       │   ├── compras-rs/
│       │   │   ├── ComprasRSAdapter.ts
│       │   │   └── compras-rs.types.ts
│       │   ├── bnc/
│       │   │   ├── BNCAdapter.ts
│       │   │   └── bnc.types.ts
│       │   └── banrisul/
│       │       ├── BanrisulAdapter.ts
│       │       └── banrisul.types.ts
│       ├── package.json
│       └── tsconfig.json
│
├── infra/
│   ├── docker-compose.yml      # desenvolvimento
│   ├── docker-compose.prod.yml # produção — igual ao dev mas sem ports expostos e com restart: always
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       ├── app.conf        # app.snifrbid.com.br → Next.js :3000
│   │       ├── api.conf        # api.snifrbid.com.br → Fastify :4000
│   │       └── root.conf       # snifrbid.com.br → placeholder
│   └── scripts/
│       ├── setup-server.sh     # provisionamento inicial do VPS
│       ├── deploy.sh           # deploy em produção
│       └── backup-db.sh        # backup do PostgreSQL
│
├── package.json                # root — workspaces + scripts turbo
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
└── tsconfig.base.json          # tsconfig compartilhado
```

---

## 4. Schema do Banco de Dados

### 4.1 Tabelas de sistema e tenants

```sql
-- Provedores de IA configuráveis pelo admin
CREATE TABLE ai_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,               -- 'Google Gemini', 'OpenAI ChatGPT', 'Anthropic Claude', etc.
  slug VARCHAR(50) UNIQUE NOT NULL,         -- 'gemini', 'openai', 'claude', 'custom'
  api_base_url VARCHAR(255),                -- URL base da API (para provedores custom)
  model_default VARCHAR(100) NOT NULL,      -- modelo padrão ex: 'gemini-1.5-pro', 'gpt-4o', 'claude-opus-4-5'
  models_available TEXT[] NOT NULL DEFAULT '{}', -- lista de modelos disponíveis
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false, -- apenas um pode ser default
  config JSONB NOT NULL DEFAULT '{}',       -- configurações extras (timeout, max_tokens, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chave de API por provedor (separada para segurança — nunca exposta via API)
CREATE TABLE ai_provider_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  api_key_encrypted TEXT NOT NULL,          -- criptografado com pgcrypto antes de persistir
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  last_test_status VARCHAR(20),             -- 'ok', 'error'
  last_test_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Planos de assinatura
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  max_interests INT NOT NULL DEFAULT 3,
  max_portals INT NOT NULL DEFAULT 1,
  max_analyses_per_month INT NOT NULL DEFAULT 50,  -- -1 = ilimitado
  max_users INT NOT NULL DEFAULT 1,                -- máximo de usuários por tenant neste plano

  -- Preços diferenciados conforme uso de IA
  -- Quando o tenant usa IA própria, não consumimos tokens — plano mais barato
  price_with_platform_ai_brl NUMERIC(10,2) NOT NULL DEFAULT 0,  -- preço usando a IA do sistema
  price_with_own_ai_brl NUMERIC(10,2) NOT NULL DEFAULT 0,       -- preço usando IA própria (menor)

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenants (empresas)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan_id UUID NOT NULL REFERENCES plans(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  analyses_used_this_month INT NOT NULL DEFAULT 0,
  analyses_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + INTERVAL '1 month',

  -- Preço ativo do tenant — recalculado sempre que ele altera a config de IA
  current_price_brl NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- 'platform' = usa IA do sistema | 'own' = usa IA própria
  ai_source VARCHAR(20) NOT NULL DEFAULT 'platform',

  settings JSONB NOT NULL DEFAULT '{}',

  -- Configuração de IA própria do tenant (opcional)
  -- Se preenchido, usa a IA do tenant em vez da IA do sistema
  -- Estrutura: { provider: 'openai', model: 'gpt-4o', api_key_encrypted: '...', active: true }
  ai_config JSONB DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',  -- 'owner', 'admin', 'member', 'system_admin' (apenas para o admin do sistema — não pertence a tenant)
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tokens de refresh JWT
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,  -- SHA-256 do token raw
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.2 Tabelas de portais e modalidades

```sql
-- Portais monitorados (gerenciados pelo admin do sistema)
CREATE TABLE portals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,   -- 'pncp', 'compras-rs', 'bnc', 'banrisul'
  adapter_key VARCHAR(50) NOT NULL,   -- chave usada para carregar o adapter
  base_url VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}', -- configurações específicas do portal
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modalidades de licitação
CREATE TABLE modalidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL,          -- código numérico ou string do portal
  portal_id UUID NOT NULL REFERENCES portals(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(code, portal_id)
);

-- UFs (estados brasileiros) — tabela simples de referência
CREATE TABLE ufs (
  code CHAR(2) PRIMARY KEY,           -- 'RS', 'SP', etc.
  name VARCHAR(50) NOT NULL
);
```

### 4.3 Tabelas de interesses

```sql
-- Interesses dos tenants
CREATE TABLE interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,         -- nome dado pelo usuário ao interesse

  -- Matching contextual: cada keyword tem seu próprio contexto semântico
  -- Estrutura: [{ keyword: "óleo", context: "veículos automotores, caminhões, maquinário pesado" }]
  -- O match só ocorre quando a keyword É encontrada E o texto se encaixa no contexto
  keyword_contexts JSONB NOT NULL DEFAULT '[]',

  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca dentro do JSONB de keyword_contexts
CREATE INDEX idx_interests_keywords ON interests USING GIN(keyword_contexts);

-- Relação interesse ↔ modalidades
CREATE TABLE interest_modalidades (
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  modalidade_id UUID NOT NULL REFERENCES modalidades(id),
  PRIMARY KEY (interest_id, modalidade_id)
);

-- Relação interesse ↔ portais
CREATE TABLE interest_portals (
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  portal_id UUID NOT NULL REFERENCES portals(id),
  PRIMARY KEY (interest_id, portal_id)
);

-- Relação interesse ↔ UFs
CREATE TABLE interest_ufs (
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  uf_code CHAR(2) NOT NULL REFERENCES ufs(code),
  PRIMARY KEY (interest_id, uf_code)
);
```

### 4.4 Tabelas de licitações

```sql
-- Licitações coletadas
CREATE TABLE licitacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portal_id UUID NOT NULL REFERENCES portals(id),
  external_id VARCHAR(255) NOT NULL,  -- ID original no portal
  modalidade_id UUID REFERENCES modalidades(id),
  uf_code CHAR(2) REFERENCES ufs(code),
  orgao_nome VARCHAR(500),
  orgao_cnpj VARCHAR(18),
  objeto TEXT NOT NULL,               -- descrição do objeto da licitação
  valor_estimado NUMERIC(18,2),
  status VARCHAR(100),
  data_publicacao TIMESTAMPTZ,
  data_abertura TIMESTAMPTZ,
  data_encerramento TIMESTAMPTZ,
  edital_url TEXT,
  portal_url TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}',     -- dados brutos do portal
  content_hash VARCHAR(64),                  -- SHA-256 do estado atual
  search_vector TSVECTOR,                    -- índice FTS
  embedding VECTOR(768),                     -- embedding semântico (pgvector)
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(portal_id, external_id)
);

-- Índices para licitações
CREATE INDEX idx_licitacoes_portal ON licitacoes(portal_id);
CREATE INDEX idx_licitacoes_uf ON licitacoes(uf_code);
CREATE INDEX idx_licitacoes_data_publicacao ON licitacoes(data_publicacao DESC);
CREATE INDEX idx_licitacoes_search ON licitacoes USING GIN(search_vector);
CREATE INDEX idx_licitacoes_objeto_trgm ON licitacoes USING GIN(objeto gin_trgm_ops);
CREATE INDEX idx_licitacoes_embedding ON licitacoes USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger para atualizar search_vector automaticamente
CREATE OR REPLACE FUNCTION update_licitacao_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('snifrbid_pt', coalesce(NEW.objeto, '')), 'A') ||
    setweight(to_tsvector('snifrbid_pt', coalesce(NEW.orgao_nome, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_licitacoes_search_vector
  BEFORE INSERT OR UPDATE ON licitacoes
  FOR EACH ROW EXECUTE FUNCTION update_licitacao_search_vector();

-- Documentos de uma licitação
CREATE TABLE licitacao_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  licitacao_id UUID NOT NULL REFERENCES licitacoes(id) ON DELETE CASCADE,
  tipo VARCHAR(100),                  -- 'edital', 'termo_referencia', 'anexo', 'ata'
  nome VARCHAR(500),
  url TEXT NOT NULL,
  tamanho_bytes INT,
  mime_type VARCHAR(100),
  content_hash VARCHAR(64),
  downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.5 Tabelas de matches e análises

```sql
-- Matches entre licitações e interesses
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  licitacao_id UUID NOT NULL REFERENCES licitacoes(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  score_textual FLOAT,                -- score do FTS/trgm (0..1)
  score_semantico FLOAT,              -- score do pgvector (0..1)
  score_final FLOAT,                  -- score combinado
  matched_keywords TEXT[],            -- palavras que fizeram match
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Valores por tenant (decisão da empresa, visível para todos os usuários do tenant):
  --   'pending'        — aguardando análise
  --   'analyzing'      — análise em andamento
  --   'analyzed'       — análise concluída
  --   'dismissed'      — dispensada (para todos os usuários do tenant)
  --   'participando'   — empresa decidiu participar (para todos os usuários do tenant)
  --   'quota_exceeded' — limite de análises do plano atingido
  -- NOTA: 'monitorando' NÃO é status de match — é flag pessoal por usuário (ver match_user_watchlist)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(licitacao_id, interest_id)
);

-- Watchlist pessoal por usuário
-- Permite que cada usuário marque licitações favoritas independentemente
-- Alimenta a aba "Favoritas" do frontend — separada por usuário, não por tenant
-- TODAS as licitações (found, monitoradas, participando) são monitoradas automaticamente
-- pelo sistema para detectar mudanças — esta tabela é apenas para organização pessoal do usuário
CREATE TABLE match_user_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_id)
);

CREATE INDEX idx_watchlist_user ON match_user_watchlist(user_id);
CREATE INDEX idx_watchlist_tenant ON match_user_watchlist(tenant_id);

CREATE INDEX idx_matches_tenant ON matches(tenant_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created ON matches(created_at DESC);

-- Análises da IA
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  model_used VARCHAR(100) NOT NULL,   -- 'gemini-1.5-pro', 'gpt-4o', 'claude-opus-4-5', etc.
  prompt_tokens INT,
  completion_tokens INT,

  -- Resultados estruturados da análise
  score_aderencia INT,                -- 0-100
  nivel_risco VARCHAR(20),            -- 'baixo', 'medio', 'alto', 'critico'
  complexidade_tecnica VARCHAR(20),   -- 'baixa', 'media', 'alta'
  estimativa_chances VARCHAR(20),     -- 'baixa', 'media', 'alta'
  criterio_julgamento VARCHAR(100),
  documentacao_exigida TEXT[],
  requisitos_tecnicos TEXT[],
  pontos_atencao TEXT[],

  -- Datas e prazos extraídos
  data_visita_tecnica TIMESTAMPTZ,
  data_entrega_proposta TIMESTAMPTZ,
  data_abertura_propostas TIMESTAMPTZ,

  -- Texto narrativo da análise
  resumo TEXT,
  analise_completa TEXT,

  raw_response JSONB,                 -- resposta bruta do Gemini
  error_message TEXT,                 -- em caso de falha
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.6 Tabelas de notificações e monitoramento

```sql
-- Preferências de notificação por usuário
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_chat_id VARCHAR(100),
  telegram_enabled BOOLEAN NOT NULL DEFAULT false,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  webpush_enabled BOOLEAN NOT NULL DEFAULT false,
  webpush_subscription JSONB,         -- objeto PushSubscription serializado
  notify_new_match BOOLEAN NOT NULL DEFAULT true,
  notify_analysis_complete BOOLEAN NOT NULL DEFAULT true,
  notify_status_change BOOLEAN NOT NULL DEFAULT true,
  notify_deadline_alert BOOLEAN NOT NULL DEFAULT true,
  deadline_alert_days INT NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Histórico de notificações enviadas
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  match_id UUID REFERENCES matches(id),
  type VARCHAR(100) NOT NULL,         -- 'new_match', 'analysis_complete', 'status_change', 'deadline_alert'
  channel VARCHAR(50) NOT NULL,       -- 'telegram', 'email', 'webpush'
  title VARCHAR(500),
  body TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monitoramento de mudanças em licitações
CREATE TABLE licitacao_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  licitacao_id UUID NOT NULL REFERENCES licitacoes(id) ON DELETE CASCADE,
  content_hash VARCHAR(64) NOT NULL,
  snapshot JSONB NOT NULL,
  changes_detected JSONB,             -- diff do snapshot anterior
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Fase 1 — Infraestrutura do Servidor

**Objetivo**: VPS Ubuntu provisionado, Docker rodando, Nginx configurado, SSL ativo.

### 1.1 Informações do servidor

- **IP**: 129.121.47.59
- **OS**: Ubuntu 22.04 LTS (será reinstalado/zerado)
- **Usuário deploy**: `snifr`
- **SSH porta**: 22022
- **Domínios**:
  - `snifrbid.com.br` — reservado para site institucional (futuro)
  - `app.snifrbid.com.br` — frontend Next.js (porta 3000)
  - `api.snifrbid.com.br` — API Fastify (porta 4000)

### 1.2 Script de provisionamento (`infra/scripts/setup-server.sh`)

O script deve executar na ordem:

1. **Atualização do sistema**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

2. **Hardening SSH**
   - Desabilitar login root via SSH
   - A porta SSH já está configurada como 22022 — não alterar
   - Limitar tentativas com fail2ban
   - ⚠ Desabilitação de autenticação por senha (apenas chaves) — **deixar para uma fase futura**

3. **Configuração de keep-alive SSH** (evita desconexão por inatividade)

   No servidor (`/etc/ssh/sshd_config`), adicionar ou ajustar:
   ```
   ClientAliveInterval 60
   ClientAliveCountMax 0
   ```
   `ClientAliveCountMax 0` significa que o servidor nunca encerra a conexão por inatividade — envia keep-alive a cada 60 segundos indefinidamente.

   Após editar, recarregar o sshd:
   ```bash
   systemctl reload sshd
   ```

   No cliente (máquina local), adicionar em `~/.ssh/config`:
   ```
   Host bloodhound
     HostName 129.121.47.59
     Port 22022
     User snifr
     ServerAliveInterval 60
     ServerAliveCountMax 0
   ```
   Assim a conexão SSH nunca expira por inatividade em nenhum dos dois lados.

4. **Instalar Docker Engine** (método oficial apt, não snap)
   ```bash
   curl -fsSL https://get.docker.com | sh
   # Adicionar o usuário snifr ao grupo docker (já deve existir)
   usermod -aG docker snifr
   ```

5. **Instalar Docker Compose v2** (plugin, não standalone)

6. **Instalar Nginx**
   ```bash
   apt-get install -y nginx
   ```

7. **Instalar Certbot**
   ```bash
   snap install --classic certbot
   ln -s /snap/bin/certbot /usr/bin/certbot
   ```

8. **Instalar Node.js 24 LTS** via nvm (para o usuário snifr)

9. **Instalar pnpm** via corepack

10. **Instalar PM2** globalmente

11. **Configurar UFW**
    ```bash
    ufw allow 22022/tcp   # SSH
    ufw allow 80/tcp      # HTTP
    ufw allow 443/tcp     # HTTPS
    ufw enable
    ```

12. **Criar estrutura de diretórios**
    ```bash
    mkdir -p /home/snifr/app
    mkdir -p /home/snifr/backups
    mkdir -p /var/log/snifrbid
    ```

### 1.3 Configuração Nginx (`infra/nginx/conf.d/`)

Criar três arquivos separados — um por subdomínio.

#### `infra/nginx/conf.d/app.conf` — Frontend (Next.js)

```nginx
server {
    listen 80;
    server_name app.snifrbid.com.br;
    return 301 https://app.snifrbid.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.snifrbid.com.br;

    ssl_certificate /etc/letsencrypt/live/app.snifrbid.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.snifrbid.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/app.snifrbid.access.log;
    error_log /var/log/nginx/app.snifrbid.error.log;
}
```

#### `infra/nginx/conf.d/api.conf` — API (Fastify)

```nginx
server {
    listen 80;
    server_name api.snifrbid.com.br;
    return 301 https://api.snifrbid.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.snifrbid.com.br;

    ssl_certificate /etc/letsencrypt/live/api.snifrbid.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.snifrbid.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Rate limiting
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:4000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # Bull Board (admin de filas) — protegido por auth básica
    location /admin/queues {
        proxy_pass http://localhost:4000/admin/queues;
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }

    access_log /var/log/nginx/api.snifrbid.access.log;
    error_log /var/log/nginx/api.snifrbid.error.log;
}
```

#### `infra/nginx/conf.d/root.conf` — Domínio raiz (placeholder para site futuro)

```nginx
server {
    listen 80;
    server_name snifrbid.com.br www.snifrbid.com.br;
    return 301 https://snifrbid.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name snifrbid.com.br www.snifrbid.com.br;

    ssl_certificate /etc/letsencrypt/live/snifrbid.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/snifrbid.com.br/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Placeholder — redireciona para o app enquanto o site não existe
    # Quando o site institucional for desenvolvido, substituir este bloco
    location / {
        return 302 https://app.snifrbid.com.br$request_uri;
    }

    access_log /var/log/nginx/root.snifrbid.access.log;
    error_log /var/log/nginx/root.snifrbid.error.log;
}
```

Adicionar no `nginx.conf` (dentro do bloco `http`):
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
```

#### Emissão dos certificados SSL (3 certificados independentes)

```bash
# Um comando por subdomínio — cada um gera seu próprio certificado
certbot certonly --nginx -d snifrbid.com.br -d www.snifrbid.com.br
certbot certonly --nginx -d app.snifrbid.com.br
certbot certonly --nginx -d api.snifrbid.com.br
```

> **Pré-requisito DNS**: antes de emitir os certificados, criar os registros A no painel DNS do domínio apontando `app` e `api` para o IP `129.121.47.59`. O Certbot valida via HTTP — se o DNS não estiver propagado, a emissão falha.

### 1.4 Fluxo de trabalho com tmux

> **Pré-requisito manual**: o tmux já deve estar instalado e a sessão `snifrbid-dev` já deve estar ativa antes de iniciar o Claude Code. Ver instruções de setup inicial no README.

**Reconectar ao servidor após queda de conexão:**
```bash
ssh bloodhound
tmux attach -t snifrbid-dev
```

**Estrutura das janelas tmux:**

| Janela | Nome | Uso |
|---|---|---|
| 1 | `claude` | Claude Code rodando — nunca fechar |
| 2 | `logs` | `pm2 logs` ou `pnpm workers:dev` |
| 3 | `db` | `psql`, `redis-cli`, inspeções |
| 4 | `infra` | `docker compose`, deploys, Nginx |

**Comandos essenciais do tmux:**

```bash
# Navegar entre janelas
Ctrl+B  1        # ir para janela 1 (claude)
Ctrl+B  2        # ir para janela 2 (logs)
Ctrl+B  n        # próxima janela
Ctrl+B  p        # janela anterior

# Detach (sair sem encerrar — processos continuam rodando)
Ctrl+B  d

# Reconectar depois de uma queda de conexão
ssh bloodhound
tmux attach -t snifrbid-dev

# Listar sessões ativas
tmux ls

# Dividir janela em painéis (útil para logs lado a lado)
Ctrl+B  %        # dividir verticalmente
Ctrl+B  "        # dividir horizontalmente
Ctrl+B  setas    # mover entre painéis
```

**Cenário de queda de conexão:**
1. Conexão SSH cai (queda de internet, timeout, etc.)
2. O tmux mantém todos os processos rodando no servidor
3. O Claude Code continua executando a fase atual
4. Ao reconectar: `ssh bloodhound && tmux attach -t snifrbid-dev`
5. Você está de volta exatamente onde estava, com todo o output preservado

**Iniciar o Claude Code dentro do tmux (janela `claude`):**
```bash
cd ~/app
claude   # inicia na janela 1 — ctrl+B d para sair sem encerrar
```

### 1.5 Checklist de validação — Fase 1

- [ ] SSH na porta 22022 funcionando com chave (porta já pré-configurada no servidor)
- [ ] Login root via SSH bloqueado
- [ ] Keep-alive SSH configurado — `ClientAliveInterval 60` e `ClientAliveCountMax 0` em sshd_config
- [ ] tmux já ativo com sessão `snifrbid-dev` (pré-configurado manualmente)
- [ ] Reconexão funciona: `ssh bloodhound && tmux attach -t snifrbid-dev`
- [ ] `docker --version` retorna 28.x+
- [ ] `docker compose version` retorna v2.x
- [ ] `nginx -t` passa sem erros
- [ ] Registros DNS criados: `app` e `api` apontando para 129.121.47.59
- [ ] `certbot certonly` obteve certificados para `snifrbid.com.br`, `app.snifrbid.com.br` e `api.snifrbid.com.br`
- [ ] `https://app.snifrbid.com.br` abre com SSL válido (pode mostrar 502 ainda)
- [ ] `https://api.snifrbid.com.br` abre com SSL válido (pode mostrar 502 ainda)
- [ ] `https://snifrbid.com.br` redireciona para `https://app.snifrbid.com.br`
- [ ] `ufw status` mostra apenas 22022, 80, 443 abertos

---

## Fase 2 — Monorepo e Pacotes Base

**Objetivo**: Monorepo funcionando, todos os pacotes compilando, banco de dados rodando com schema aplicado.

### 2.1 Configuração root do monorepo

**`package.json` root:**
```json
{
  "name": "snifrbid",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "api:dev": "turbo run dev --filter=@snifrbid/api",
    "workers:dev": "turbo run dev --filter=@snifrbid/workers",
    "web:dev": "turbo run dev --filter=@snifrbid/web",
    "db:migrate": "turbo run db:migrate --filter=@snifrbid/db",
    "db:seed": "turbo run db:seed --filter=@snifrbid/db",
    "db:generate": "turbo run db:generate --filter=@snifrbid/db",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**`turbo.json`:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false,
      "dependsOn": ["db:migrate"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

**`tsconfig.base.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 2.2 `packages/shared`

Exportações principais:

- **`types/`**: interfaces `Tenant`, `User`, `Licitacao`, `Interest`, `Match`, `Analysis`, `Portal` — exatamente alinhadas com o schema do banco
- **`utils/hash.ts`**: função `sha256(input: string): string` usando `crypto` nativo
- **`utils/date.ts`**: helpers de data/hora no fuso horário de Brasília (`America/Sao_Paulo`)
- **`utils/slugify.ts`**: gera slug de strings em português
- **`constants/roles.ts`**: enum `UserRole { OWNER, ADMIN, MEMBER }`
- **`constants/status.ts`**: enums de status para matches, notificações, etc.
- **`redis.ts`**: singleton Redis usando `ioredis`

```typescript
// packages/shared/src/redis.ts
import { Redis } from 'ioredis';

let instance: Redis | null = null;

export function getRedis(): Redis {
  if (!instance) {
    instance = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null, // obrigatório para BullMQ
    });
  }
  return instance;
}
```

**Regra crítica**: nunca instanciar `new Redis()` diretamente fora de `shared/redis.ts`. Todos os pacotes que precisam de Redis importam `getRedis()` deste arquivo.

### 2.3 `packages/db`

**`drizzle.config.ts`:**
```typescript
import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '../../.env' });

export default {
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**`src/index.ts`:**
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export { schema };
export * from './schema/index.js';

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 20,
      idle_timeout: 30,
    });
    db = drizzle(client, { schema });
  }
  return db;
}
```

**Regra crítica**: `drizzle-orm` e `postgres` são dependências **apenas** de `packages/db`. Nenhum outro pacote ou app os instala diretamente — todos importam `getDb()` de `@snifrbid/db`.

**Schema Drizzle** — implementar como arquivos separados por domínio dentro de `src/schema/`:
- `ai.ts` — tabelas: `ai_providers`, `ai_provider_credentials`
- `tenants.ts` — tabelas: `plans`, `tenants`, `users`, `refresh_tokens`, `audit_logs`
- `portals.ts` — tabelas: `portals`, `modalidades`, `ufs`
- `interests.ts` — tabelas: `interests`, `interest_modalidades`, `interest_portals`, `interest_ufs`
- `licitacoes.ts` — tabelas: `licitacoes`, `licitacao_documentos`
- `matches.ts` — tabelas: `matches`, `analyses`, `match_user_watchlist`
- `notifications.ts` — tabelas: `notification_preferences`, `notifications`, `licitacao_snapshots`

Exportar tudo em `src/schema/index.ts`.

**`src/seed/index.ts`** — dados iniciais:

```typescript
// Portais
const portaisSeed = [
  { name: 'PNCP', slug: 'pncp', adapter_key: 'pncp', base_url: 'https://pncp.gov.br/api/pncp/v1' },
  { name: 'ComprasRS', slug: 'compras-rs', adapter_key: 'compras-rs', base_url: 'https://www.compras.rs.gov.br' },
  { name: 'BNC', slug: 'bnc', adapter_key: 'bnc', base_url: 'https://bnc.org.br' },
  { name: 'Banrisul', slug: 'banrisul', adapter_key: 'banrisul', base_url: 'https://licitacoes.banrisul.com.br' },
];

// Modalidades do PNCP (conforme documentação oficial)
const modalidadesPNCP = [
  { name: 'Leilão - Eletrônico', code: '1', portal_slug: 'pncp' },
  { name: 'Diálogo Competitivo', code: '2', portal_slug: 'pncp' },
  { name: 'Concurso', code: '3', portal_slug: 'pncp' },
  { name: 'Concorrência - Eletrônica', code: '4', portal_slug: 'pncp' },
  { name: 'Concorrência - Presencial', code: '5', portal_slug: 'pncp' },
  { name: 'Pregão - Eletrônico', code: '6', portal_slug: 'pncp' },
  { name: 'Pregão - Presencial', code: '7', portal_slug: 'pncp' },
  { name: 'Dispensa de Licitação', code: '8', portal_slug: 'pncp' },
  { name: 'Inexigibilidade', code: '9', portal_slug: 'pncp' },
  { name: 'Manifestação de Interesse', code: '10', portal_slug: 'pncp' },
  { name: 'Pré-qualificação', code: '11', portal_slug: 'pncp' },
  { name: 'Credenciamento', code: '12', portal_slug: 'pncp' },
  { name: 'Leilão - Presencial', code: '13', portal_slug: 'pncp' },
];

// 27 UFs brasileiras
const ufsSeed = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  // ... todas as 27 UFs
];

// Provedores de IA (inativos por padrão — admin configura a chave e ativa)
const aiProvidersSeed = [
  {
    name: 'Google Gemini',
    slug: 'gemini',
    model_default: 'gemini-1.5-pro',
    models_available: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
    is_active: false,
    is_default: true,
  },
  {
    name: 'OpenAI ChatGPT',
    slug: 'openai',
    model_default: 'gpt-4o',
    models_available: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    is_active: false,
    is_default: false,
  },
  {
    name: 'Anthropic Claude',
    slug: 'claude',
    model_default: 'claude-opus-4-5',
    models_available: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
    is_active: false,
    is_default: false,
  },
  {
    name: 'Provedor customizado',
    slug: 'custom',
    api_base_url: '',
    model_default: '',
    models_available: [],
    is_active: false,
    is_default: false,
  },
];

// Planos
// Preços: with_platform_ai = usando IA do sistema (mais caro, inclui custo de tokens)
//         with_own_ai = usando IA própria (mais barato, sem custo de tokens para nós)
const planosSeed = [
  {
    name: 'Gratuito', slug: 'free',
    max_interests: 1, max_portals: 1, max_analyses_per_month: 10, max_users: 1,
    price_with_platform_ai_brl: 0, price_with_own_ai_brl: 0,
  },
  {
    name: 'Básico', slug: 'basic',
    max_interests: 3, max_portals: 2, max_analyses_per_month: 50, max_users: 2,
    price_with_platform_ai_brl: 197, price_with_own_ai_brl: 97,
  },
  {
    name: 'Pro', slug: 'pro',
    max_interests: 10, max_portals: 4, max_analyses_per_month: 200, max_users: 5,
    price_with_platform_ai_brl: 497, price_with_own_ai_brl: 297,
  },
  {
    name: 'Enterprise', slug: 'enterprise',
    max_interests: -1, max_portals: -1, max_analyses_per_month: -1, max_users: -1,
    price_with_platform_ai_brl: 1497, price_with_own_ai_brl: 997,
  },
];

// Usuário administrador do sistema
// A senha deve ser alterada imediatamente após o primeiro login
// Gerada a partir da env ADMIN_INITIAL_PASSWORD (obrigatória no primeiro boot)
const adminSeed = {
  name: 'Administrador',
  email: process.env.ADMIN_EMAIL ?? 'admin@snifrbid.com.br',
  // Hash de process.env.ADMIN_INITIAL_PASSWORD com bcrypt cost 12
  // Se a env não estiver definida, lançar erro no seed
  role: 'system_admin', // role especial — fora do escopo de tenant
};
// NOTA: O usuário admin NÃO pertence a nenhum tenant.
// Criar um tenant especial 'system' com slug 'system' para o admin.
```

### 2.4 Docker Compose de desenvolvimento

**`infra/docker-compose.yml`:**
```yaml
# version removida — Docker Compose v2 não requer declaração de versão
services:
  postgres:
    image: pgvector/pgvector:pg17
    container_name: snifrbid_postgres
    environment:
      POSTGRES_DB: snifrbid
      POSTGRES_USER: snifr
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U snifr"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:8-alpine
    container_name: snifrbid_redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 2.5 Checklist de validação — Fase 2

- [ ] `pnpm install` na raiz sem erros
- [ ] `pnpm build` compila todos os pacotes sem erros TypeScript
- [ ] `docker compose up -d` sobe PostgreSQL e Redis
- [ ] `pnpm db:migrate` aplica todas as migrations sem erros
- [ ] `pnpm db:seed` insere dados iniciais (portais, modalidades, UFs, planos)
- [ ] Verificar via psql: 6 extensões ativas, configuração FTS `snifrbid_pt` existe
- [ ] Verificar via psql: todas as tabelas criadas com índices corretos

---

## Fase 3 — API Core (Fastify)

**Objetivo**: API rodando com autenticação JWT, RBAC, multi-tenancy, e rotas CRUD completas.

### 3.1 Bootstrap do servidor (`apps/api/src/server.ts`)

```typescript
import Fastify from 'fastify';
import { authPlugin } from './plugins/auth.js';
import { corsPlugin } from './plugins/cors.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { tenantPlugin } from './plugins/tenant.js';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
    },
    trustProxy: true,  // necessário atrás do Nginx
  });

  // Plugins globais
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(authPlugin);
  await app.register(tenantPlugin);

  // Rotas
  await app.register(import('./routes/auth/index.js'), { prefix: '/auth' });
  await app.register(import('./routes/tenants/index.js'), { prefix: '/tenants' });
  await app.register(import('./routes/interests/index.js'), { prefix: '/interests' });
  await app.register(import('./routes/licitacoes/index.js'), { prefix: '/licitacoes' });
  await app.register(import('./routes/notifications/index.js'), { prefix: '/notifications' });
  await app.register(import('./routes/admin/index.js'), { prefix: '/admin' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}
```

### 3.2 Plugin de autenticação

**JWT com duplo token (access + refresh):**

- Access token: expira em 15 minutos, contém `{ sub: userId, tenantId, role }`
- Refresh token: expira em 7 dias, armazenado no Redis como hash SHA-256

```typescript
// plugins/auth.ts
// Usar @fastify/jwt para verificação
// Middleware de autenticação:
//   1. Extrai Bearer token do header Authorization
//   2. Verifica assinatura JWT
//   3. Verifica se token não está na blacklist (Redis: key 'blacklist:${jti}')
//   4. Carrega usuário do banco e adiciona em request.user
//   5. Carrega tenant e adiciona em request.tenant

// Blacklist de tokens (logout)
// Redis: SET blacklist:${jti} 1 EX ${secondsUntilExpiry}
```

### 3.3 Plugin de multi-tenancy

Toda rota autenticada deve:
1. Extrair `tenantId` do JWT
2. Configurar RLS no PostgreSQL: `SET LOCAL app.current_tenant_id = '${tenantId}'`
3. Adicionar `request.tenant` com os dados completos do tenant

### 3.4 Rotas obrigatórias

**`/auth`**
- `POST /auth/register` — cadastro de tenant + usuário owner
- `POST /auth/login` — login, retorna access + refresh tokens
- `POST /auth/refresh` — troca refresh token por novo access token
- `POST /auth/logout` — revoga tokens (blacklist no Redis)
- `POST /auth/forgot-password` — envia email com link
- `POST /auth/reset-password` — aplica nova senha
- `GET /auth/me` — dados do usuário autenticado

**`/interests`** (requer autenticação)
- `GET /interests` — lista interesses do tenant
- `POST /interests` — cria interesse
- `PUT /interests/:id` — atualiza interesse
- `DELETE /interests/:id` — remove interesse
- `PATCH /interests/:id/toggle` — ativa/desativa

**`/licitacoes`** (requer autenticação)
- `GET /licitacoes` — lista com filtros (status, data, portal, UF, modalidade)
- `GET /licitacoes/:id` — detalhes + documentos + análise
- `GET /licitacoes/:id/analysis` — análise da IA

- `POST /licitacoes/:id/dismiss` — dispensar licitação **(escopo tenant)** — visível para todos os usuários
- `POST /licitacoes/:id/participar` — marcar como participando **(escopo tenant)** — visível para todos
- `DELETE /licitacoes/:id/participar` — desmarcar participação **(escopo tenant)**

- `POST /licitacoes/:id/favorite` — adicionar aos favoritos **(escopo usuário)** — só para quem chamou
- `DELETE /licitacoes/:id/favorite` — remover dos favoritos **(escopo usuário)**
- `GET /licitacoes/favorites` — lista favoritos do usuário autenticado
  > **Atenção de implementação**: registrar esta rota **antes** de `/licitacoes/:id` no Fastify para evitar que "favorites" seja interpretado como um `:id`. Fastify processa rotas na ordem de registro.

**`/notifications`** (requer autenticação)
- `GET /notifications/preferences` — configurações do usuário
- `PUT /notifications/preferences` — atualiza configurações
- `POST /notifications/webpush/subscribe` — registra subscription Web Push
- `POST /notifications/telegram/connect` — inicia fluxo de conexão Telegram
- `GET /notifications/history` — histórico paginado

**Regra de limite de usuários por tenant**: ao convidar um novo usuário (`POST /tenants/users/invite`), a API verifica:
```typescript
const userCount = await getDb()
  .select({ count: count() })
  .from(schema.users)
  .where(and(
    eq(schema.users.tenant_id, tenantId),
    eq(schema.users.is_active, true),
  ));

const plan = tenant.plan;
if (plan.max_users !== -1 && userCount[0].count >= plan.max_users) {
  throw new ForbiddenError(
    `Seu plano permite no máximo ${plan.max_users} usuário(s). ` +
    `Faça upgrade para adicionar mais membros.`
  );
}
```
Retorna HTTP 403 com mensagem clara e link para a página de upgrade do plano.

**`/admin`** (requer role `system_admin`)
- `GET /admin/tenants` — lista tenants
- `PUT /admin/tenants/:id` — edita tenant
- `GET /admin/portals` — lista portais
- `POST /admin/portals` — cadastra portal
- `PUT /admin/portals/:id` — edita portal
- `GET /admin/queues` — status das filas (Bull Board)
- `GET /admin/stats` — métricas do sistema

### 3.5 Segurança obrigatória

- **Rate limiting**: `@fastify/rate-limit` — 100 req/min por IP, 500 req/min por tenant
- **CORS**: apenas origem `https://app.snifrbid.com.br` em produção
- **Helmet**: `@fastify/helmet` com CSP adequado
- **Validação**: todos os inputs validados com JSON Schema do Fastify (TypeBox)
- **SQL injection**: **nunca** usar string interpolation em queries. Sempre parâmetros bindados via Drizzle
- **Senhas**: bcrypt com cost factor 12
- **Logs de auditoria**: toda mutação de dado grava em `audit_logs`
  - Ações de favoritos: `favorited`, `unfavorited` (com `user_id` — escopo pessoal)
  - Ações de participação: `match_participando`, `match_participando_removed` (com `user_id` — escopo tenant)
  - Ações de dispensa: `match_dismissed` (com `user_id` — escopo tenant)

### 3.6 Checklist de validação — Fase 3

- [ ] `curl http://localhost:4000/health` retorna 200
- [ ] `POST /auth/register` cria tenant + usuário e retorna tokens
- [ ] `POST /auth/login` retorna access + refresh tokens
- [ ] Rota protegida sem token retorna 401
- [ ] Rota protegida com token expirado retorna 401
- [ ] `POST /auth/refresh` com refresh válido retorna novo access token
- [ ] `POST /auth/logout` invalida tokens
- [ ] CRUD completo de interesses funcionando
- [ ] Validação rejeitando payloads inválidos com mensagens descritivas
- [ ] `tsc --noEmit` passa sem erros

---

## Fase 4 — Sistema de Portais Plugável

**Objetivo**: Interface `IPortalAdapter` implementada, adapter PNCP funcional e testado.

### 4.1 Interface do adapter (`packages/portal-core/src/IPortalAdapter.ts`)

```typescript
export interface LicitacaoColetada {
  externalId: string;
  objeto: string;
  orgaoNome?: string;
  orgaoCnpj?: string;
  modalidadeCode?: string;
  ufCode?: string;
  valorEstimado?: number;
  status?: string;
  dataPublicacao?: Date;
  dataAbertura?: Date;
  dataEncerramento?: Date;
  editalUrl?: string;
  portalUrl?: string;
  documentos?: Array<{
    tipo: string;
    nome: string;
    url: string;
  }>;
  rawData: Record<string, unknown>;
}

export interface IPortalAdapter {
  readonly portalSlug: string;
  readonly portalName: string;

  /**
   * Coleta licitações publicadas/atualizadas desde `since`.
   * Filtros obrigatórios — não há coleta sem escopo definido.
   * Deve ser idempotente — chamadas repetidas com mesmo intervalo
   * não devem produzir duplicatas.
   */
  fetchLicitacoes(
    since: Date,
    options: FetchLicitacoesOptions
  ): AsyncGenerator<LicitacaoColetada>;

  /**
   * Busca detalhes completos de uma licitação específica,
   * incluindo lista de documentos.
   */
  fetchDetalhes(externalId: string): Promise<LicitacaoColetada>;

  /**
   * Verifica se o portal está acessível.
   */
  healthCheck(): Promise<boolean>;
}

export interface FetchLicitacoesOptions {
  modalidadeCodes: string[];  // códigos das modalidades a buscar
  ufCodes: string[];          // UFs a buscar
  until?: Date;
}
```

### 4.2 BaseAdapter (`packages/portal-core/src/BaseAdapter.ts`)

Implementar funcionalidades comuns:
- Retry automático com backoff exponencial (máximo 3 tentativas)
- Rate limiting para não sobrecarregar o portal
- Logging padronizado
- Tratamento de erros HTTP (429, 503, etc.)
- Timeout configurável por request (padrão: 30s)

### 4.3 Adapter PNCP (`packages/portals/src/pncp/PNCPAdapter.ts`)

**Endpoints utilizados da API PNCP:**

```
GET /v1/contratacoes/publicacao
  Params:
    - dataInicial: YYYYMMDD
    - dataFinal: YYYYMMDD
    - codigoModalidadeContratacao: número (1-13)
    - uf: sigla do estado
    - pagina: número da página
    - tamanhoPagina: máximo 500

GET /v1/contratacoes/{cnpj}/{ano}/{sequencial}
  Retorna detalhes completos de uma contratação
```

**Implementação com paginação automática:**

```typescript
// NOTA: esta implementação simplificada é apenas referência de estrutura.
// A implementação real usa a assinatura da interface (com FetchLicitacoesOptions)
// conforme especificado na seção 4.1 e implementado na seção 5.3.4.
async *fetchLicitacoes(
  since: Date,
  options: FetchLicitacoesOptions
): AsyncGenerator<LicitacaoColetada> {
  const { modalidadeCodes, ufCodes, until = new Date() } = options;
  const dataInicial = formatDate(since, 'YYYYMMDD');
  const dataFinal = formatDate(until, 'YYYYMMDD');

  // Itera sobre cada combinação modalidade × UF
  for (const modalidadeCode of modalidadeCodes) {
    for (const ufCode of ufCodes) {
      let pagina = 1;
      while (true) {
        const response = await this.get('/contratacoes/publicacao', {
          dataInicial,
          dataFinal,
          codigoModalidadeContratacao: modalidadeCode,
          uf: ufCode,
          pagina,
          tamanhoPagina: 500,
        });
        if (!response.data?.length) break;
        for (const item of response.data) yield this.mapToLicitacao(item);
        if (response.data.length < 500) break;
        pagina++;
      }
    }
  }
}
```

**Mapeamento de campos** — garantir que todos os campos do schema sejam preenchidos corretamente a partir dos dados do PNCP.

### 4.4 Registro de adapters

```typescript
// packages/portals/src/index.ts
import { PNCPAdapter } from './pncp/PNCPAdapter.js';
import { ComprasRSAdapter } from './compras-rs/ComprasRSAdapter.js';

const adapters = new Map<string, IPortalAdapter>();

export function registerAdapter(adapter: IPortalAdapter) {
  adapters.set(adapter.portalSlug, adapter);
}

export function getAdapter(slug: string): IPortalAdapter {
  const adapter = adapters.get(slug);
  if (!adapter) throw new Error(`Adapter não encontrado para portal: ${slug}`);
  return adapter;
}

// Registro automático
registerAdapter(new PNCPAdapter());
registerAdapter(new ComprasRSAdapter());
// etc.
```

### 4.5 Checklist de validação — Fase 4

- [ ] `PNCPAdapter.healthCheck()` retorna `true`
- [ ] `PNCPAdapter.fetchLicitacoes(ontem)` retorna ao menos 1 licitação
- [ ] Paginação funcionando (busca >500 resultados se existirem)
- [ ] Retry automático funciona com erro simulado
- [ ] `LicitacaoColetada` tem todos os campos obrigatórios preenchidos
- [ ] Nenhuma chamada usa string interpolation em URLs com dados externos

---

## Fase 5 — Workers e Filas (BullMQ)

**Objetivo**: Todos os workers rodando, ciclo de 4h de coleta funcionando end-to-end.

### 5.1 Definição das filas

```typescript
// apps/workers/src/queues/index.ts
import { Queue } from 'bullmq';
import { getRedis } from '@snifrbid/shared';

const connection = getRedis();

export const collectionQueue = new Queue('collection', { connection });
export const matchingQueue = new Queue('matching', { connection });
export const analysisQueue = new Queue('analysis', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 }, // 1min, 2min, 4min
    timeout: 180000, // 3 minutos
  },
});
export const notificationQueue = new Queue('notification', { connection });
export const monitoringQueue = new Queue('monitoring', { connection });
// maintenanceQueue exportada aqui para ser acessível tanto no scheduler
// quanto no Bull Board registrado na API
export const maintenanceQueue = new Queue('maintenance', { connection });
```

### 5.2 Scheduler (cron jobs)

```typescript
// apps/workers/src/schedulers/index.ts
// Usando QueueScheduler + repeat do BullMQ

// Coleta a cada 4 horas — enfileira um job por portal ativo
collectionQueue.add('collect-all', {}, {
  repeat: { pattern: '0 */4 * * *' },
  jobId: 'collect-all-recurring',
});

// Monitoramento de mudanças a cada 30 minutos
monitoringQueue.add('monitor-changes', {}, {
  repeat: { pattern: '*/30 * * * *' },
  jobId: 'monitor-changes-recurring',
});

// Reset de contador de análises no início de cada mês
// maintenanceQueue importada de ../queues/index.js
maintenanceQueue.add('reset-analyses-counter', {}, {
  repeat: { pattern: '0 0 1 * *' },
  jobId: 'reset-analyses-recurring',
});
```

### 5.3 CollectionWorker

**Princípio fundamental**: a coleta nunca é genérica. Antes de buscar qualquer dado nos portais, o worker agrega todas as modalidades e UFs dos interesses ativos de todos os tenants e usa esses valores como parâmetros de filtragem nas chamadas à API do portal. Licitações fora desse escopo nunca chegam ao banco.

#### 5.3.1 Agregação de filtros antes da coleta

```typescript
// apps/workers/src/services/CollectionFilterService.ts

export interface CollectionFilter {
  portalId: string;
  portalSlug: string;
  modalidadeCodes: string[];  // union de todos os interesses ativos para este portal
  ufCodes: string[];          // union de todas as UFs dos interesses ativos
}

export async function buildCollectionFilters(): Promise<CollectionFilter[]> {
  // Busca todos os interesses ativos com suas relações
  const interesses = await getDb().query.interests.findMany({
    where: eq(schema.interests.is_active, true),
    with: {
      portals: { with: { portal: true } },
      modalidades: { with: { modalidade: true } },
      ufs: true,
    },
  });

  if (interesses.length === 0) return []; // nenhum interesse ativo — nada a coletar

  // Agrupa por portal fazendo union de modalidades e UFs
  const portalMap = new Map<string, CollectionFilter>();

  for (const interesse of interesses) {
    for (const ip of interesse.portals) {
      const portalId = ip.portal.id;

      if (!portalMap.has(portalId)) {
        portalMap.set(portalId, {
          portalId,
          portalSlug: ip.portal.adapter_key,
          modalidadeCodes: [],
          ufCodes: [],
        });
      }

      const filter = portalMap.get(portalId)!;

      // Adiciona modalidades deste interesse (sem duplicatas)
      for (const im of interesse.modalidades) {
        if (!filter.modalidadeCodes.includes(im.modalidade.code)) {
          filter.modalidadeCodes.push(im.modalidade.code);
        }
      }

      // Adiciona UFs deste interesse (sem duplicatas)
      for (const iu of interesse.ufs) {
        if (!filter.ufCodes.includes(iu.uf_code)) {
          filter.ufCodes.push(iu.uf_code);
        }
      }
    }
  }

  return Array.from(portalMap.values());
}
```

**Exemplo do resultado**: se o Tenant A monitora "Pregão Eletrônico + RS, SC" e o Tenant B monitora "Dispensa + SP, RJ", o filtro para o PNCP será `modalidades: [6, 8]` e `ufs: [RS, SC, SP, RJ]`. O portal só retorna licitações dentro desse escopo.

#### 5.3.2 Execução da coleta com filtros

```typescript
// apps/workers/src/workers/CollectionWorker.ts

async function processCollectionJob(job: Job) {
  // 1. Agregar filtros de todos os interesses ativos
  const filters = await buildCollectionFilters();

  if (filters.length === 0) {
    job.log('Nenhum interesse ativo — coleta ignorada');
    return;
  }

  const since = new Date(Date.now() - 4 * 60 * 60 * 1000); // últimas 4h
  const now = new Date();

  for (const filter of filters) {
    // Verifica se o portal está ativo no banco
    const portal = await getDb().query.portals.findFirst({
      where: and(
        eq(schema.portals.id, filter.portalId),
        eq(schema.portals.is_active, true),
      ),
    });
    if (!portal) continue;

    const adapter = getAdapter(filter.portalSlug);

    job.log(`Coletando ${portal.name} | modalidades: ${filter.modalidadeCodes.join(',')} | UFs: ${filter.ufCodes.join(',')}`);

    // 2. Coleta já parametrizada com os filtros agregados
    for await (const licitacao of adapter.fetchLicitacoes(since, {
      modalidadeCodes: filter.modalidadeCodes,
      ufCodes: filter.ufCodes,
    })) {
      // 3. Ignorar licitações já encerradas antes de persistir
      if (
        licitacao.dataEncerramento &&
        new Date(licitacao.dataEncerramento) < now
      ) {
        job.log(`Ignorada (encerrada): ${licitacao.externalId}`);
        continue;
      }

      // 4. Upsert — idempotente por (portal_id, external_id)
      const [saved] = await getDb().insert(schema.licitacoes)
        .values({
          portalId: portal.id,
          externalId: licitacao.externalId,
          // ... mapear todos os campos
          contentHash: sha256(JSON.stringify(licitacao.rawData)),
        })
        .onConflictDoUpdate({
          target: [schema.licitacoes.portalId, schema.licitacoes.externalId],
          set: {
            // Só atualiza campos que mudaram (baseado no contentHash)
            status: sql`CASE WHEN licitacoes.content_hash != excluded.content_hash
                        THEN excluded.status
                        ELSE licitacoes.status END`,
            dataEncerramento: sql`CASE WHEN licitacoes.content_hash != excluded.content_hash
                                  THEN excluded.data_encerramento
                                  ELSE licitacoes.data_encerramento END`,
            rawData: sql`CASE WHEN licitacoes.content_hash != excluded.content_hash
                         THEN excluded.raw_data
                         ELSE licitacoes.raw_data END`,
            contentHash: sql`excluded.content_hash`,
            updatedAt: new Date(),
          },
        })
        .returning();

      // 4. Só enfileira matching se é registro novo ou conteúdo mudou
      // Comparar timestamps em ms — === em objetos Date compara referência, não valor
      const isNew = saved.collectedAt.getTime() === saved.updatedAt.getTime();
      if (isNew) {
        await matchingQueue.add('match', { licitacaoId: saved.id });
      } else {
        // Conteúdo mudou — enfileira monitoramento de mudança
        await monitoringQueue.add('diff', { licitacaoId: saved.id });
      }
    }
  }
}
```

#### 5.3.3 Atualização da interface IPortalAdapter

A interface `IPortalAdapter` e `FetchLicitacoesOptions` já estão definidas na seção 4.1 com a assinatura correta. A seção 5.3.3 apenas documenta que esta atualização deve estar presente — não há redefinição.

#### 5.3.4 Implementação no adapter PNCP

O PNCP suporta filtro por `codigoModalidadeContratacao` e `uf` nativamente na API — os filtros são passados diretamente como query params:

```typescript
// packages/portals/src/pncp/PNCPAdapter.ts

async *fetchLicitacoes(
  since: Date,
  options: FetchLicitacoesOptions
): AsyncGenerator<LicitacaoColetada> {
  const { modalidadeCodes, ufCodes } = options;
  const dataInicial = formatDate(since, 'YYYYMMDD');
  const dataFinal = formatDate(options.until ?? new Date(), 'YYYYMMDD');

  // Itera sobre cada combinação modalidade × UF
  // O PNCP aceita apenas um valor por vez em cada parâmetro
  for (const modalidadeCode of modalidadeCodes) {
    for (const ufCode of ufCodes) {
      let pagina = 1;

      while (true) {
        const response = await this.get('/contratacoes/publicacao', {
          dataInicial,
          dataFinal,
          codigoModalidadeContratacao: modalidadeCode,
          uf: ufCode,
          pagina,
          tamanhoPagina: 500,
        });

        if (!response.data?.length) break;

        for (const item of response.data) {
          yield this.mapToLicitacao(item);
        }

        if (response.data.length < 500) break;
        pagina++;
      }
    }
  }
}
```

**Portais sem suporte a filtros na API** (ex: scraping): o adapter recebe os filtros e aplica a filtragem localmente após coletar a página, antes de fazer `yield`. O resultado é o mesmo — nenhuma licitação fora do escopo chega ao banco — mas o volume de requisições ao portal pode ser maior. Documentar isso no adapter com um comentário `// FILTRO_LOCAL`.

#### 5.3.5 Invalidação automática ao criar/editar interesse

Quando um tenant cria ou altera um interesse, o cache de filtros (se houver) deve ser invalidado para que o próximo ciclo de coleta considere o novo escopo:

```typescript
// Na rota POST/PUT /interests da API:
await getRedis().del('collection:filters:cache');
```

### 5.4 MatchingWorker

#### Lógica de matching com contexto semântico

O match não é baseado apenas em palavras-chave isoladas. Cada keyword carrega um **contexto semântico** que restringe quando ela é válida.

**Exemplo:**
- Keyword: `óleo` | Contexto: `veículos automotores, caminhões, maquinário pesado`
- Resultado: só dá match se `óleo` aparecer na licitação **E** o objeto da licitação for semanticamente compatível com o contexto informado
- Licitação sobre "óleo de cozinha para merenda escolar" → **não dá match**
- Licitação sobre "óleo lubrificante para frota de caminhões" → **dá match**

O matching ocorre em **três estágios em sequência**:

**Estágio 1 — Filtro estrutural** (custo zero, elimina a maioria):
Verifica UF, portal e modalidade contra os filtros do interesse. Se não bater, descarta imediatamente.

**Estágio 2 — Presença da keyword** (FTS + trgm):
Verifica se a keyword está presente no texto da licitação usando `phraseto_tsquery` (preserva frases compostas) e `pg_trgm` para fuzzy matching (erros de digitação em editais). Só avança se a keyword for encontrada.

**Estágio 3 — Validação de contexto** (IA leve):
Envia o objeto da licitação + o contexto do interesse para o provedor de IA com um prompt de classificação binária (compatível / incompatível). Só cria o match se a IA confirmar compatibilidade contextual. Usa o modelo mais barato disponível (ex: `gemini-1.5-flash`, `gpt-4o-mini`, `claude-haiku`) para minimizar custo.

```typescript
// apps/workers/src/workers/MatchingWorker.ts

interface KeywordContext {
  keyword: string;
  context: string; // "veículos automotores, caminhões, maquinário pesado"
}

async function processMatchingJob(job: Job<{ licitacaoId: string }>) {
  const { licitacaoId } = job.data;

  const licitacao = await getDb().query.licitacoes.findFirst({
    where: eq(schema.licitacoes.id, licitacaoId),
  });

  if (!licitacao) return;

  const interesses = await getDb().query.interests.findMany({
    where: eq(schema.interests.is_active, true),
    with: { ufs: true, portals: true, modalidades: true },
  });

  for (const interesse of interesses) {
    // ESTÁGIO 1: Filtro estrutural (UF, portal, modalidade)
    if (!matchesFilters(licitacao, interesse)) continue;

    const keywordContexts: KeywordContext[] = interesse.keyword_contexts;
    const matchedKeywords: string[] = [];
    let maxKeywordScore = 0;

    // ESTÁGIO 2: Verificar presença de cada keyword no texto
    for (const kc of keywordContexts) {
      const [ftsResult] = await getDb().execute(sql`
        SELECT
          ts_rank(search_vector, phraseto_tsquery('snifrbid_pt', ${kc.keyword})) as score,
          search_vector @@ phraseto_tsquery('snifrbid_pt', ${kc.keyword}) as found_fts,
          similarity(objeto, ${kc.keyword}) as score_trgm
        FROM licitacoes
        WHERE id = ${licitacaoId}
      `);

      const found = ftsResult.found_fts || ftsResult.score_trgm > 0.3;
      if (!found) continue;

      // ESTÁGIO 3: Validar contexto via IA (modelo leve)
      if (kc.context && kc.context.trim().length > 0) {
        const contextMatch = await validateContext(
          licitacao.objeto,
          kc.keyword,
          kc.context,
          interesse.tenantId
        );
        if (!contextMatch) continue; // keyword encontrada mas fora do contexto
      }

      matchedKeywords.push(kc.keyword);
      maxKeywordScore = Math.max(maxKeywordScore, ftsResult.score ?? 0);
    }

    if (matchedKeywords.length === 0) continue;

    const scoreFinal = calcularScoreFinal(maxKeywordScore, matchedKeywords.length, keywordContexts.length);

    const [match] = await getDb().insert(schema.matches)
      .values({
        licitacaoId,
        interestId: interesse.id,
        tenantId: interesse.tenantId,
        scoreFinal,
        matchedKeywords,
        status: 'pending',
      })
      .onConflictDoNothing()
      .returning();

    if (match) {
      await analysisQueue.add('analyze', { matchId: match.id });
    }
  }
}

// Validação de contexto com modelo leve — resposta binária
async function validateContext(
  objetoLicitacao: string,
  keyword: string,
  context: string,
  tenantId: string
): Promise<boolean> {
  const prompt = `Responda apenas "sim" ou "não".

A licitação abaixo é compatível com o contexto informado para a palavra-chave "${keyword}"?

Contexto esperado: ${context}

Objeto da licitação: ${objetoLicitacao}

Resposta:`;

  // Passa tenantId para usar a IA do tenant se configurada (modelo leve)
  const response = await aiProviderService.classifyContext(prompt, tenantId);
  return response.toLowerCase().startsWith('sim');
}
```

**Função auxiliar SQL** — criar no banco:
```sql
CREATE OR REPLACE FUNCTION snifrbid_phrase_query(keyword TEXT) RETURNS tsquery AS $$
BEGIN
  RETURN phraseto_tsquery('snifrbid_pt', keyword);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### 5.A AIProviderService — implementar PRIMEIRO nesta fase

> **Ordem obrigatória**: implementar este serviço **antes de qualquer worker**. As seções 5.3 a 5.7 dependem dele. Está listado aqui por organização, mas deve ser o primeiro código escrito na Fase 5.

Serviço que abstrai qual provedor de IA está ativo:

```typescript
// apps/workers/src/services/AIProviderService.ts

export interface AIAnalysisResult {
  scoreAderencia: number;
  nivelRisco: 'baixo' | 'medio' | 'alto' | 'critico';
  complexidadeTecnica: 'baixa' | 'media' | 'alta';
  estimativaChances: 'baixa' | 'media' | 'alta';
  criterioJulgamento: string;
  documentacaoExigida: string[];
  requisitosTecnicos: string[];
  pontosAtencao: string[];
  dataEntregaProposta: string | null;
  dataAberturaProposta: string | null;
  resumo: string;
  analiseCompleta: string;
}

export class AIProviderService {
  // Carrega o provedor ativo do banco (com cache em Redis por 5 minutos)
  async getActiveProvider(): Promise<AiProvider & { credential: AiProviderCredential }> {
    const cached = await getRedis().get('ai:active_provider');
    if (cached) return JSON.parse(cached);

    const provider = await getDb().query.ai_providers.findFirst({
      where: and(
        eq(schema.ai_providers.is_active, true),
        eq(schema.ai_providers.is_default, true),
      ),
      with: { credential: true },
    });

    if (!provider) throw new Error('Nenhum provedor de IA ativo configurado');

    await getRedis().setex('ai:active_provider', 300, JSON.stringify(provider));
    return provider;
  }

  // Descriptografa a chave de API usando pgcrypto
  async decryptApiKey(encryptedKey: string): Promise<string> {
    const result = await getDb().execute(
      sql`SELECT pgp_sym_decrypt(${encryptedKey}::bytea, ${process.env.AI_ENCRYPTION_KEY}) as key`
    );
    return result[0].key as string;
  }

  // Ponto de entrada único para análise — resolve IA do tenant ou do sistema
  async analyze(
    prompt: string,
    tenantId?: string
  ): Promise<{ result: AIAnalysisResult; modelUsed: string; promptTokens: number; completionTokens: number; usedTenantAI: boolean }> {
    // 1. Verificar se o tenant configurou IA própria
    if (tenantId) {
      const tenant = await getDb().query.tenants.findFirst({
        where: eq(schema.tenants.id, tenantId),
        columns: { ai_config: true },
      });

      if (tenant?.ai_config?.active && tenant.ai_config.api_key_encrypted) {
        const apiKey = await this.decryptApiKey(tenant.ai_config.api_key_encrypted);
        const result = await this.callProvider(
          prompt,
          tenant.ai_config.provider,
          apiKey,
          tenant.ai_config.model
        );
        return { ...result, usedTenantAI: true };
      }
    }

    // 2. Fallback para IA do sistema (configurada pelo admin)
    const provider = await this.getActiveProvider();
    const apiKey = await this.decryptApiKey(provider.credential.api_key_encrypted);
    const result = await this.callProvider(prompt, provider.slug, apiKey, provider.model_default);
    return { ...result, usedTenantAI: false };
  }

  private async callProvider(prompt: string, slug: string, apiKey: string, model: string) {
    switch (slug) {
      case 'gemini':   return this.analyzeWithGemini(prompt, apiKey, model);
      case 'openai':   return this.analyzeWithOpenAI(prompt, apiKey, model);
      case 'claude':   return this.analyzeWithClaude(prompt, apiKey, model);
      case 'custom':   return this.analyzeWithCustom(prompt, apiKey, { model_default: model } as any);
      default: throw new Error(`Provedor desconhecido: ${slug}`);
    }
  }

  // Validação de contexto (modelo leve — mais barato)
  // Mapeamento de modelos pesados → leves por provedor
  private readonly lightModelMap: Record<string, string> = {
    'gemini-1.5-pro': 'gemini-1.5-flash',
    'gemini-2.0-flash': 'gemini-1.5-flash',
    'gpt-4o': 'gpt-4o-mini',
    'gpt-4-turbo': 'gpt-4o-mini',
    'claude-opus-4-5': 'claude-haiku-4-5',
    'claude-sonnet-4-5': 'claude-haiku-4-5',
  };

  async classifyContext(prompt: string, tenantId?: string): Promise<string> {
    // Resolve provedor e usa modelo leve correspondente
    let slug: string;
    let apiKey: string;
    let model: string;

    if (tenantId) {
      const tenant = await getDb().query.tenants.findFirst({
        where: eq(schema.tenants.id, tenantId),
        columns: { ai_config: true },
      });
      if (tenant?.ai_config?.active && tenant.ai_config.api_key_encrypted) {
        slug = tenant.ai_config.provider;
        apiKey = await this.decryptApiKey(tenant.ai_config.api_key_encrypted);
        model = this.lightModelMap[tenant.ai_config.model] ?? tenant.ai_config.model;
        // classifyContext usa callProviderRaw — retorna texto simples, não JSON de análise
        return await this.callProviderRaw(prompt, slug, apiKey, model);
      }
    }

    const provider = await this.getActiveProvider();
    apiKey = await this.decryptApiKey(provider.credential.api_key_encrypted);
    model = this.lightModelMap[provider.model_default] ?? provider.model_default;
    return await this.callProviderRaw(prompt, provider.slug, apiKey, model);
  }

  // callProviderRaw — retorna texto bruto (sem parsing de JSON)
  // usado para classificações binárias (sim/não) e outros prompts simples
  private async callProviderRaw(
    prompt: string,
    slug: string,
    apiKey: string,
    model: string
  ): Promise<string> {
    // Implementar chamada direta à API do provedor retornando texto simples
    // Sem tentar fazer parse de JSON — apenas o texto da resposta
    // DECISÃO: cada provedor implementa sua versão de raw call internamente
    switch (slug) {
      case 'gemini':  return this.rawCallGemini(prompt, apiKey, model);
      case 'openai':  return this.rawCallOpenAI(prompt, apiKey, model);
      case 'claude':  return this.rawCallClaude(prompt, apiKey, model);
      case 'custom':  return this.rawCallCustom(prompt, apiKey, model);
      default: throw new Error(`Provedor desconhecido: ${slug}`);
    }
  }

  private async analyzeWithGemini(prompt: string, apiKey: string, model: string) { /* ... */ }
  private async analyzeWithOpenAI(prompt: string, apiKey: string, model: string) { /* ... */ }
  private async analyzeWithClaude(prompt: string, apiKey: string, model: string) { /* ... */ }
  private async analyzeWithCustom(prompt: string, apiKey: string, provider: AiProvider) { /* ... */ }
}

export const aiProviderService = new AIProviderService();
```

**Invalidação de cache**: quando o admin alterar o provedor ativo no painel, a API deve executar:
```typescript
await getRedis().del('ai:active_provider');
```

**Recálculo de preço ao tenant alterar configuração de IA**: sempre que o tenant ativar ou desativar a IA própria, a API recalcula e persiste o preço ativo:

```typescript
// Na rota PUT /configuracoes/ia (ao salvar ai_config do tenant)
async function onTenantAIConfigSaved(tenantId: string, usingOwnAI: boolean) {
  const tenant = await getDb().query.tenants.findFirst({
    where: eq(schema.tenants.id, tenantId),
    with: { plan: true },
  });

  const newPrice = usingOwnAI
    ? tenant.plan.price_with_own_ai_brl
    : tenant.plan.price_with_platform_ai_brl;

  await getDb().update(schema.tenants)
    .set({
      ai_source: usingOwnAI ? 'own' : 'platform',
      current_price_brl: newPrice,
    })
    .where(eq(schema.tenants.id, tenantId));

  // Invalida cache de filtros e do provedor ativo
  await getRedis().del(`ai:tenant:${tenantId}`);
}
```

O mesmo recálculo deve ocorrer quando o **admin alterar o plano de um tenant** via `/admin/tenants`.

### 5.5 AnalysisWorker


```typescript
// Verifica limite do plano antes de chamar o Gemini

async function processAnalysisJob(job: Job<{ matchId: string }>) {
  const match = await getDb().query.matches.findFirst({
    where: eq(schema.matches.id, job.data.matchId),
    with: {
      licitacao: { with: { documentos: true } },
      interest: true,
      tenant: { with: { plan: true } },
    },
  });

  if (!match) return;

  // Verificar limite do plano
  const { tenant } = match;
  if (
    tenant.plan.max_analyses_per_month !== -1 &&
    tenant.analyses_used_this_month >= tenant.plan.max_analyses_per_month
  ) {
    await getDb().update(schema.matches)
      .set({ status: 'quota_exceeded' })
      .where(eq(schema.matches.id, match.id));
    return;
  }

  // Baixar documentos (máximo 3, priorizando edital e TR)
  const docs = await downloadDocumentos(match.licitacao.documentos);

  // Montar prompt estruturado para o Gemini
  const prompt = buildAnalysisPrompt(match.licitacao, match.interest, docs);

  // Chamar o provedor de IA do tenant (se configurado) ou do sistema
  const response = await aiProviderService.analyze(prompt, match.tenantId);

  // Salvar análise
  await getDb().insert(schema.analyses).values({
    matchId: match.id,
    tenantId: match.tenantId,
    // ... campos da análise
  });

  // Incrementar contador de análises do tenant (atômico — evita race condition)
  // UPDATE com WHERE garante que o limite não seja ultrapassado por jobs concorrentes
  const updated = await getDb().update(schema.tenants)
    .set({ analyses_used_this_month: sql`analyses_used_this_month + 1` })
    .where(and(
      eq(schema.tenants.id, match.tenantId),
      // Dupla verificação atômica: só incrementa se ainda não atingiu o limite
      sql`(max_analyses_per_month = -1 OR analyses_used_this_month < (
        SELECT max_analyses_per_month FROM plans WHERE id = plan_id
      ))`
    ))
    .returning({ id: schema.tenants.id });

  if (updated.length === 0) {
    // Limite atingido por job concorrente — reverter status do match
    await getDb().update(schema.matches)
      .set({ status: 'quota_exceeded' })
      .where(eq(schema.matches.id, match.id));
    return;
  }

  // Enfileirar notificação
  await notificationQueue.add('notify', {
    type: 'analysis_complete',
    matchId: match.id,
    tenantId: match.tenantId,
  });
}
```

### 5.6 Prompt de análise do Gemini

```typescript
function buildAnalysisPrompt(licitacao, interest, documentos): string {
  return `
Você é um especialista em licitações públicas brasileiras. Analise a oportunidade abaixo
em relação ao interesse da empresa e retorne APENAS um JSON válido com a estrutura especificada.

## INTERESSE DA EMPRESA
Nome: ${interest.name}
Palavras-chave e contextos:
${(interest.keyword_contexts as Array<{keyword:string,context:string}>)
  .map(kc => `- "${kc.keyword}" → contexto: ${kc.context || 'não especificado'}`)
  .join('\n')}

## LICITAÇÃO
Portal: ${licitacao.portal?.name}
Objeto: ${licitacao.objeto}
Órgão: ${licitacao.orgaoNome}
UF: ${licitacao.ufCode}
Modalidade: ${licitacao.modalidade?.name}
Valor estimado: ${licitacao.valorEstimado ? `R$ ${licitacao.valorEstimado}` : 'Não informado'}
Data de abertura: ${licitacao.dataAbertura ?? 'Não informada'}

## DOCUMENTOS
${documentos.map(d => `### ${d.tipo?.toUpperCase()}\n${d.content}`).join('\n\n')}

## RESPOSTA ESPERADA (JSON estrito, sem markdown)
{
  "score_aderencia": <0-100>,
  "nivel_risco": <"baixo"|"medio"|"alto"|"critico">,
  "complexidade_tecnica": <"baixa"|"media"|"alta">,
  "estimativa_chances": <"baixa"|"media"|"alta">,
  "criterio_julgamento": "<string>",
  "documentacao_exigida": ["<item>"],
  "requisitos_tecnicos": ["<item>"],
  "pontos_atencao": ["<ponto>"],
  "data_entrega_proposta": "<ISO 8601 ou null>",
  "data_abertura_propostas": "<ISO 8601 ou null>",
  "resumo": "<2-3 parágrafos analisando a oportunidade>",
  "analise_completa": "<análise detalhada>"
}
`.trim();
}
```

### 5.7 MonitoringWorker

**Regra de monitoramento automático**: o sistema monitora automaticamente por mudanças
**todas** as licitações que possuem match ativo — independente de qualquer flag de usuário.
Isso inclui: licitações encontradas (pending/analyzed), monitoradas por qualquer usuário
na watchlist pessoal, e marcadas como participando pelo tenant.
Apenas licitações com status `dismissed` ou `quota_exceeded` são excluídas do monitoramento.

```typescript
// Detecta mudanças em licitações que possuem matches ativos

async function processMonitoringJob() {
  // Monitora TODAS as licitações com match ativo (exceto dispensadas)
  // independente de watchlist pessoal ou status de participação
  const licitacoesAtivas = await getDb()
    .selectDistinct({ id: schema.licitacoes.id })
    .from(schema.licitacoes)
    .innerJoin(schema.matches, eq(schema.matches.licitacaoId, schema.licitacoes.id))
    .where(notInArray(schema.matches.status, ['dismissed', 'quota_exceeded']));

  for (const { id } of licitacoesAtivas) {
    // Re-consultar o portal para ver se houve mudança
    const snapshot = await refreshLicitacao(id);

    if (snapshot.hasChanges) {
      await notificationQueue.add('notify', {
        type: 'status_change',
        licitacaoId: id,
        changes: snapshot.changes,
      });
    }
  }
}
```

### 5.8 Bull Board (interface visual das filas)

Instalar `@bull-board/fastify` e registrar na API:
```typescript
// Acessível em /admin/queues (protegido por auth básica no Nginx)
app.register(bullBoardPlugin, {
  queues: [
    collectionQueue,
    matchingQueue,
    analysisQueue,
    notificationQueue,
    monitoringQueue,
    maintenanceQueue,  // inclui o job de reset mensal de análises
  ],
  basePath: '/admin/queues',
});
```

### 5.9 Checklist de validação — Fase 5

- [ ] `pnpm workers:dev` inicia sem erros
- [ ] Job de coleta manual executa e salva licitações no banco
- [ ] Job de matching encontra match para um interesse de teste
- [ ] Job de análise chama o provedor de IA configurado e salva análise estruturada
- [ ] Retry automático funciona: job falha 2x e sucede na 3ª
- [ ] Bull Board acessível em `/admin/queues`
- [ ] Redis não acumula conexões abertas (verificar `redis-cli info clients`)
- [ ] Cron de 4h registrado e visível no Bull Board

---

## Fase 6 — Motor de Matching e IA

**Objetivo**: Matching preciso para palavras compostas, embeddings semânticos, análise Gemini completa.

### 6.1 Palavras-chave compostas

**Regra crítica**: Nunca usar `to_tsquery` diretamente com input do usuário. Sempre usar `phraseto_tsquery` para preservar frases.

```sql
-- CORRETO: "óleo lubrificante" é tratado como frase
SELECT * FROM licitacoes
WHERE search_vector @@ phraseto_tsquery('snifrbid_pt', 'óleo lubrificante');

-- ERRADO: trata como "óleo" AND "lubrificante" em qualquer ordem
SELECT * FROM licitacoes
WHERE search_vector @@ to_tsquery('snifrbid_pt', 'óleo & lubrificante');
```

**Para múltiplas keywords**, combinar com OR:
```sql
SELECT * FROM licitacoes
WHERE search_vector @@ (
  phraseto_tsquery('snifrbid_pt', 'óleo lubrificante') ||
  phraseto_tsquery('snifrbid_pt', 'lubrificante automotivo')
);
```

### 6.2 Embeddings semânticos

Usar a API do Gemini para gerar embeddings:
```typescript
// Gerar embedding do texto da licitação
const embedding = await generateEmbedding(licitacao.objeto);

// Buscar licitações semanticamente similares a um interesse
const resultados = await getDb().execute(sql`
  SELECT id, objeto,
    1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
  FROM licitacoes
  WHERE 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > 0.75
  ORDER BY similarity DESC
  LIMIT 20
`);
```

Gerar embedding ao salvar cada licitação (job assíncrono separado para não bloquear a coleta).

### 6.3 Score combinado

```typescript
// Score de relevância combinando FTS, trgm e embedding semântico
// Usado pelo MatchingWorker após o estágio 2 (presença de keyword)
function calcularScoreRelevancia(
  scoreFTS: number,      // 0..1 do ts_rank
  scoreTrgm: number,     // 0..1 do pg_trgm similarity
  scoreSemantico: number // 0..1 do pgvector cosine similarity
): number {
  // FTS tem maior peso pois é mais preciso para licitações
  return (scoreFTS * 0.5) + (scoreTrgm * 0.2) + (scoreSemantico * 0.3);
}

// Score final do match (0..1) — leva em conta cobertura de keywords
// Usado pelo MatchingWorker após validação contextual
function calcularScoreFinal(
  maxKeywordScore: number,       // melhor score FTS entre as keywords
  matchedKeywordsCount: number,  // quantas keywords fizeram match
  totalKeywordsCount: number     // total de keywords do interesse
): number {
  const coverageRatio = matchedKeywordsCount / Math.max(totalKeywordsCount, 1);
  return maxKeywordScore * 0.6 + coverageRatio * 0.4;
}
```

### 6.4 Checklist de validação — Fase 6

- [ ] Busca por "óleo lubrificante" NÃO retorna resultados sobre "óleo de cozinha" ou "lubrificante industrial" isolados
- [ ] Busca por "equipamento hospitalar" retorna "equipamentos hospitalares" (variação morfológica via stemming)
- [ ] Busca por "computador" retorna "computadores" e "microcomputador"
- [ ] Embedding gerado e armazenado para novas licitações
- [ ] Score semântico encontra matches que o FTS puro perderia

---

## Fase 7 — Notificações

**Objetivo**: Telegram, email e Web Push funcionando, com templates adequados.

### 7.0 Princípio fundamental — notificações são por usuário

**Cada usuário do tenant gerencia suas próprias preferências de notificação de forma completamente independente.**

- O `telegram_chat_id` é configurado por usuário (via fluxo do bot — o usuário não precisa saber o próprio ID)
- O email de notificação é o email de cadastro do usuário (campo `users.email`)
- Cada usuário escolhe individualmente quais canais ativar e quais tipos de evento receber
- Se o tenant tem 3 usuários: um com Telegram, outro com email, outro com Web Push — cada um recebe no seu canal
- **Não existe "notificação para o tenant"** — toda notificação é direcionada a um usuário específico
- O `NotificationWorker` busca todos os usuários ativos do tenant e itera sobre cada um respeitando suas preferências individuais

**Fluxo de conexão do Telegram (sem exigir o chat_id no cadastro):**
1. Usuário clica "Conectar Telegram" nas configurações
2. Sistema gera um código único de 6 dígitos válido por 10 minutos (salvo no Redis)
3. Usuário abre o bot no Telegram e envia `/conectar CODIGO`
4. Bot captura o `chat_id` automaticamente e salva em `notification_preferences`
5. Bot confirma: "✅ Telegram conectado com sucesso!"

### 7.1 NotificationWorker

```typescript
async function processNotificationJob(job: Job) {
  const { type, matchId, tenantId } = job.data;

  // Buscar usuários do tenant com notificações habilitadas
  // JOIN users → notification_preferences filtrando por tenant_id
  const usersDoTenant = await getDb()
    .select({ userId: schema.users.id })
    .from(schema.users)
    .where(and(
      eq(schema.users.tenant_id, tenantId),
      eq(schema.users.is_active, true),
    ));

  const userIds = usersDoTenant.map(u => u.userId);
  if (userIds.length === 0) return;

  const prefs = await getDb().query.notification_preferences.findMany({
    where: inArray(schema.notification_preferences.user_id, userIds),
    with: { user: true },
  });

  for (const pref of prefs) {
    if (pref.telegram_enabled && pref.telegram_chat_id) {
      await sendTelegram(pref.telegram_chat_id, type, matchId);
    }
    if (pref.email_enabled) {
      await sendEmail(pref.user.email, type, matchId);
    }
    if (pref.webpush_enabled && pref.webpush_subscription) {
      await sendWebPush(pref.webpush_subscription, type, matchId);
    }
  }
}
```

### 7.2 Telegram

- Bot criado via @BotFather
- Fluxo de conexão: usuário clica "Conectar Telegram" no app → recebe código único de 6 dígitos → envia `/conectar CODIGO` para o bot → bot confirma
- Mensagens usam Markdown V2 do Telegram
- Inline buttons para "Ver análise" e "Dispensar"

### 7.3 Email (Nodemailer + templates)

- SMTP via Resend ou Gmail (configurável via env)
- Templates HTML responsivos para: novo match, análise completa, mudança de status, alerta de prazo
- Endereço `from`: `SnifrBid <noreply@snifrbid.com.br>`

### 7.4 Web Push

- VAPID keys geradas uma vez e armazenadas nas env
- Biblioteca: `web-push`
- Frontend registra service worker e envia subscription para a API
- Notificações com ícone, badge e ações (abrir, dispensar)

### 7.5 Checklist de validação — Fase 7

- [ ] Telegram: usuário recebe mensagem após novo match
- [ ] Email: usuário recebe email após análise completa
- [ ] Web Push: notificação aparece no navegador
- [ ] Falha no Telegram não impede envio do email
- [ ] Histórico de notificações salvo em `notifications`

---

## Fase 9 — Multi-tenancy e Planos

**Objetivo**: Isolamento completo entre tenants, limites de plano aplicados, RLS no PostgreSQL.

### 9.1 Row Level Security (RLS)

```sql
-- Habilitar RLS nas tabelas sensíveis
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_user_watchlist ENABLE ROW LEVEL SECURITY;

-- Policy: tenant só vê seus próprios dados
CREATE POLICY tenant_isolation ON interests
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Policy: watchlist é por usuário — cada um só vê a sua
-- O app.current_user_id deve ser configurado junto com app.current_tenant_id no middleware
CREATE POLICY user_isolation ON match_user_watchlist
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- O usuário do banco usado pela aplicação NÃO é superuser
-- Superuser bypassa RLS — nunca usar credenciais de superuser na app
```

```typescript
// No middleware da API, antes de cada query:
// IMPORTANTE: SET LOCAL só persiste dentro de uma transação.
// Todas as queries que dependem de RLS devem ser executadas dentro
// de uma transação onde os parâmetros foram configurados.
// Usar o helper abaixo para garantir isolamento correto:

async function withTenantContext<T>(
  tenantId: string,
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`);
    await tx.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
    return fn();
  });
}

// Uso no handler da rota:
// return withTenantContext(request.user.tenantId, request.user.id, async () => {
//   return getDb().query.interests.findMany(...);
// });
```

### 9.2 Enforcement de limites de plano

- Máximo de interesses: verificar antes de criar novo interesse
- Máximo de portais por interesse: validar no endpoint
- Máximo de análises/mês: verificado no AnalysisWorker antes de chamar Gemini
- Reset automático no dia 1 de cada mês via job cron

### 9.3 Checklist de validação — Fase 9

- [ ] Tenant A não consegue ver dados do Tenant B via API
- [ ] Tenant A não consegue ver dados do Tenant B via consulta direta ao banco com RLS
- [ ] Criar mais interesses que o plano permite retorna erro 403 com mensagem clara
- [ ] Análises param após atingir limite do plano
- [ ] Reset de contador funciona no cron

---

## Fase 10 — Portais Adicionais

**Objetivo**: Adapters para ComprasRS, BNC e Banrisul implementados e testados.

### 10.1 ComprasRS

- URL base: `https://www.compras.rs.gov.br`
- Verificar disponibilidade de API REST; se ausente, usar Playwright para scraping
- Adapter deve implementar exatamente a mesma interface `IPortalAdapter`

### 10.2 BNC (Bolsa Nacional de Compras)

- URL base: `https://bnc.org.br`
- Mesma abordagem: API se disponível, scraping como fallback

### 10.3 Banrisul

- URL base: `https://licitacoes.banrisul.com.br`
- Específico para licitações do banco gaúcho

### 10.4 Regras para scraping (quando necessário)

- Usar `playwright` (headless Chromium) para portais com JavaScript
- Respeitar `robots.txt`
- Rate limiting agressivo: máximo 1 request/segundo
- User-agent realista
- Detectar e tratar CAPTCHAs (flag para intervenção manual)
- Nunca salvar sessões de usuário dos portais

---

## Variáveis de Ambiente

**`.env.example`** — todas as variáveis necessárias:

```env
# Banco de dados
DATABASE_URL=postgresql://snifr:SENHA@localhost:5432/snifrbid
POSTGRES_PASSWORD=GERAR_COM_openssl_rand_-hex_32

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=GERAR_COM_openssl_rand_-hex_32

# JWT
JWT_SECRET=GERAR_COM_openssl_rand_-hex_32
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# API
API_PORT=4000
API_HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info

# Usuário admin do sistema (usado apenas no seed inicial)
ADMIN_EMAIL=admin@snifrbid.com.br
ADMIN_INITIAL_PASSWORD=DEFINIR_SENHA_FORTE_E_TROCAR_APOS_PRIMEIRO_LOGIN

# Frontend
NEXT_PUBLIC_API_URL=https://api.snifrbid.com.br
NEXTAUTH_SECRET=GERAR_COM_openssl_rand_-hex_32
NEXTAUTH_URL=https://app.snifrbid.com.br

# IA — provedor ativo é configurado pelo admin no painel
# As chaves são inseridas pelo admin via interface e armazenadas criptografadas no banco
# Variáveis abaixo são opcionais: usadas apenas para bootstrap inicial via seed
AI_BOOTSTRAP_PROVIDER=gemini           # provedor padrão no primeiro boot
AI_BOOTSTRAP_GEMINI_KEY=               # chave Gemini para seed inicial (opcional)
AI_BOOTSTRAP_OPENAI_KEY=               # chave OpenAI para seed inicial (opcional)
AI_BOOTSTRAP_CLAUDE_KEY=               # chave Claude para seed inicial (opcional)
AI_ENCRYPTION_KEY=GERAR_COM_openssl_rand_-hex_32  # chave para criptografar API keys no banco

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_URL=https://api.snifrbid.com.br/webhooks/telegram

# Email (SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=
EMAIL_FROM=SnifrBid <noreply@snifrbid.com.br>

# Web Push (VAPID)
VAPID_PUBLIC_KEY=GERAR_COM_web-push_generate-vapid-keys
VAPID_PRIVATE_KEY=GERAR_COM_web-push_generate-vapid-keys
VAPID_SUBJECT=mailto:admin@snifrbid.com.br

# URLs públicas dos subdomínios
APP_URL=https://app.snifrbid.com.br
API_URL=https://api.snifrbid.com.br
```

**Regra obrigatória**: Senhas e segredos **sempre** gerados com `openssl rand -hex 32`. Nunca usar `openssl rand -base64` (pode conter caracteres `<>` que quebram o carregamento do `.env`).

---

## Decisões Arquiteturais e Regras

### Separação de processos

`apps/api` e `apps/workers` são **processos Node.js separados**. Nunca rodar workers dentro do processo da API. Razão: um worker travado ou com alto uso de CPU não deve afetar a latência da API.

### Singleton Redis

Nunca instanciar `new Redis()` fora de `packages/shared/src/redis.ts`. Todos os consumers importam `getRedis()`. A opção `maxRetriesPerRequest: null` é **obrigatória** para o BullMQ.

### Singleton DB

Nunca instanciar `drizzle()` fora de `packages/db/src/index.ts`. Todos os consumers importam `getDb()`.

### drizzle-orm é dependência exclusiva de packages/db

Nenhum outro pacote ou app instala `drizzle-orm` ou `postgres` diretamente. Isso evita conflitos de versão e instâncias duplicadas.

### Imports com extensão .js

Em todos os pacotes com `moduleResolution: NodeNext`, imports relativos **obrigatoriamente** usam extensão `.js`:
```typescript
// CORRETO
import { getDb } from './db/index.js';

// ERRADO (falha em runtime com ESM)
import { getDb } from './db/index';
```

### Idempotência dos jobs de coleta

Todo job de coleta usa `INSERT ... ON CONFLICT DO UPDATE`. Reprocessar o mesmo intervalo de tempo não cria duplicatas.

### Parâmetros bindados sempre

Nunca usar string interpolation em queries SQL. Sempre usar os mecanismos do Drizzle (`.where(eq(...))`, `sql` tagged template) ou parâmetros `$1, $2` do postgres.js.

### FTS com frases compostas

Sempre usar `phraseto_tsquery` (nunca `to_tsquery` com input do usuário) para preservar a semântica de frases como "óleo lubrificante".

### TypeScript estrito

`strict: true` em todos os `tsconfig.json`. Sem `any` explícito. Sem `@ts-ignore` sem comentário explicativo.

### @types/node em todo pacote que usa process

Qualquer pacote que use `process.env`, `Buffer`, `setTimeout`, ou qualquer API Node.js nativa deve ter `@types/node` em `devDependencies`.

### Geração de segredos

Sempre: `openssl rand -hex 32`
Nunca: `openssl rand -base64` (pode gerar `<` ou `>` que quebram `source .env`)

---

## CLAUDE.md — arquivo obrigatório na raiz do projeto

O Claude Code lê automaticamente o arquivo `CLAUDE.md` na raiz do repositório antes de qualquer operação. Este arquivo deve ser criado na Fase 2 com o seguinte conteúdo:

```markdown
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

## Comandos frequentes
```bash
pnpm install              # instalar dependências
pnpm build                # compilar todos os pacotes
pnpm typecheck            # verificar tipos (zero erros obrigatório)
pnpm db:migrate           # aplicar migrations
pnpm db:seed              # inserir dados iniciais
docker compose up -d      # subir PostgreSQL e Redis
```

## Spec completa
Ver `snifrbid-spec.md` na raiz do projeto.
```

---

## Fase 8 — Frontend (Next.js) — Especificação Completa

> **Nota de ordem**: esta seção contém a especificação detalhada do frontend e deve ser lida e implementada na sequência correta das fases (após a Fase 7 e antes da Fase 9), mesmo que apareça após as Fases 9 e 10 neste documento por motivo de organização.

### Stack do frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | **16.x** (latest stable) | Framework |
| React | **19.x** | UI |
| TypeScript | **5.x** (latest) | Linguagem |
| Tailwind CSS | **4.x** (4.2+) | Estilização — CSS-first, sem config.js |
| shadcn/ui | latest | Componentes base |
| Zustand | **5.x** (latest) | Estado global (client-side) |
| TanStack Query | **5.x** (5.96+) | Server state + cache + mutations |
| Axios | **1.x** (latest) | HTTP client |
| next-themes | latest | Toggle dark/light mode |
| Recharts | **2.x** (latest) | Gráficos e charts |
| date-fns | **4.x** (latest) | Formatação de datas em pt-BR |
| react-hook-form | **7.x** (latest) | Formulários |
| zod | **3.x** (latest) | Validação de schemas |
| lucide-react | latest | Ícones |
| sonner | latest | Toast notifications |
| @radix-ui/react-* | latest | Primitivos (via shadcn) |

---

### Design system


> **Nota sobre Tailwind CSS v4**: A versão 4.x introduz configuração CSS-first — não há mais `tailwind.config.js`.
> As customizações de tema são feitas diretamente em `globals.css` via `@theme { }`.
> O import muda de `@tailwind base/components/utilities` para simplesmente `@import "tailwindcss"`.
> O plugin para Next.js é `@tailwindcss/postcss` (não mais `tailwindcss` direto no postcss.config).

#### Paleta de cores (tokens CSS)

Definir em `apps/web/src/app/globals.css`:

```css
:root {
  /* Backgrounds */
  --background: 0 0% 98%;           /* página */
  --background-secondary: 0 0% 100%; /* superfície (cards) */
  --background-tertiary: 220 14% 96%; /* fundos sutis */

  /* Texto */
  --foreground: 222 47% 11%;
  --foreground-muted: 215 16% 47%;
  --foreground-hint: 215 14% 65%;

  /* Accent principal (índigo) */
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;

  /* Bordas */
  --border: 220 13% 88%;
  --border-strong: 220 13% 78%;

  /* Semânticas */
  --success: 160 84% 39%;
  --warning: 38 92% 50%;
  --danger: 0 84% 60%;
  --info: 217 91% 60%;

  /* Raios */
  --radius: 8px;
  --radius-lg: 12px;
}

.dark {
  --background: 222 47% 7%;
  --background-secondary: 222 47% 10%;
  --background-tertiary: 222 35% 13%;
  --foreground: 210 40% 90%;
  --foreground-muted: 215 20% 55%;
  --foreground-hint: 215 15% 40%;
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;
  --border: 217 32% 17%;
  --border-strong: 217 32% 25%;
  --success: 160 84% 39%;
  --warning: 38 92% 50%;
  --danger: 0 84% 60%;
  --info: 217 91% 60%;
}
```

#### Score de aderência — escala de cores

| Range | Label | Cor do badge | Fundo do badge |
|---|---|---|---|
| 80–100 | Alta aderência | `#6ee7b7` | `#022c22` |
| 60–79 | Aderência média | `#fcd34d` | `#271b05` |
| 40–59 | Aderência baixa | `#94a3b8` | bg-tertiary |
| 0–39 | Fora do perfil | `#fca5a5` | `#2d0d0d` |

#### Nível de risco — escala

| Valor | Cor | Ícone lucide |
|---|---|---|
| `baixo` | `--success` | `ShieldCheck` |
| `medio` | `--warning` | `ShieldAlert` |
| `alto` | `--danger` | `ShieldX` |
| `critico` | `#dc2626` bold | `AlertOctagon` |

---

### Estrutura de pastas (`apps/web/src/`)

```
app/
├── (auth)/                     # grupo sem sidebar
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   ├── reset-password/
│   │   └── page.tsx
│   └── layout.tsx              # layout centralizado, sem nav
│
├── (dashboard)/                # grupo com sidebar — tenant autenticado
│   ├── layout.tsx              # AppShell: sidebar + topbar + main
│   ├── page.tsx                # redireciona para /dashboard
│   ├── dashboard/
│   │   └── page.tsx
│   ├── oportunidades/
│   │   ├── page.tsx            # feed paginado
│   │   └── [id]/
│   │       └── page.tsx        # detalhes + análise
│   ├── interesses/
│   │   ├── page.tsx            # lista de interesses
│   │   └── [id]/
│   │       └── page.tsx        # edição
│   ├── acompanhamento/
│   │   └── page.tsx            # licitações monitoradas com mudanças
│   ├── notificacoes/
│   │   └── page.tsx            # histórico + preferências
│   └── configuracoes/
│       ├── page.tsx            # dados da empresa
│       ├── usuarios/
│       │   └── page.tsx
│       └── plano/
│           └── page.tsx
│
├── admin/                      # grupo admin do sistema
│   ├── layout.tsx
│   ├── page.tsx                # métricas globais
│   ├── tenants/
│   │   └── page.tsx
│   ├── portais/
│   │   └── page.tsx
│   └── filas/
│       └── page.tsx            # embed Bull Board
│
└── layout.tsx                  # root: providers, fonts, meta

components/
├── ui/                         # componentes shadcn gerados
├── layout/
│   ├── AppShell.tsx            # shell principal (sidebar + topbar)
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   └── ThemeToggle.tsx
├── oportunidades/
│   ├── OportunidadeFeed.tsx    # lista com infinite scroll
│   ├── OportunidadeCard.tsx    # card do feed
│   ├── OportunidadeDetalhes.tsx
│   ├── AnaliseCard.tsx         # resultado do Gemini
│   ├── ScoreBadge.tsx
│   ├── RiscoBadge.tsx
│   └── DocumentosList.tsx
├── interesses/
│   ├── InteresseForm.tsx       # formulário multi-step
│   ├── KeywordInput.tsx        # input de tags para keywords
│   ├── PortalSelector.tsx
│   ├── UFSelector.tsx
│   └── ModalidadeSelector.tsx
├── dashboard/
│   ├── MetricCard.tsx
│   ├── FeedRecente.tsx
│   ├── ChartMatches.tsx
│   └── AtividadeRecente.tsx
├── notifications/
│   ├── TelegramConnect.tsx
│   ├── WebPushToggle.tsx
│   └── NotificacaoItem.tsx
└── shared/
    ├── PageHeader.tsx
    ├── EmptyState.tsx
    ├── LoadingSkeleton.tsx
    ├── ConfirmDialog.tsx
    └── DataTable.tsx

lib/
├── api.ts                      # instância Axios + interceptors
├── auth.ts                     # helpers de autenticação
├── queryClient.ts              # instância TanStack Query
└── utils.ts                    # cn(), formatters

hooks/
├── useAuth.ts
├── useOportunidades.ts
├── useInteresses.ts
└── useNotifications.ts

stores/
├── authStore.ts                # Zustand: user, tenant, tokens
├── uiStore.ts                  # Zustand: sidebar open, theme
└── notifStore.ts               # Zustand: contagem de não-lidas

types/
└── index.ts                    # tipos alinhados com @snifrbid/shared
```

---

### Layouts

#### Root layout (`app/layout.tsx`)

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="snifrbid-theme"
        >
          <QueryClientProvider client={queryClient}>
            <Toaster richColors position="top-right" />
            {children}
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### Auth layout (`app/(auth)/layout.tsx`)

Tela dividida 50/50: lado esquerdo com branding (logo + tagline + lista de benefícios), lado direito com o formulário. Em mobile: só o formulário.

```tsx
// Estrutura visual:
// [  Branding (indigo bg)  |  Formulário (bg-white)  ]
//         hidden md:flex          flex
```

#### App Shell (`components/layout/AppShell.tsx`)

```tsx
// Layout: sidebar fixa (220px) + área principal
// Sidebar colapsa para ícones (60px) em telas <1024px
// Topbar: título da página atual + ações contextuais + avatar
// Main: scroll independente da sidebar
```

---

### Páginas — especificação detalhada

---

#### `/login`

**Componentes:**
- Logo + nome do produto (centralizado no form)
- `Input` email com label
- `Input` senha com toggle show/hide
- `Button` "Entrar" (full width, primary)
- Link "Esqueci minha senha"
- Separador + link "Criar conta"

**Comportamento:**
- Submit chama `POST /api/auth/login`
- Em sucesso: salva tokens no `authStore` + redireciona para `/dashboard`
- Em erro 401: exibe mensagem inline no formulário (não toast)
- Loading state no botão durante request
- Campo email recebe foco automático ao montar

**Validação (zod):**
```ts
z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})
```

---

#### `/register`

**Etapas (formulário de 2 passos):**

Passo 1 — Dados da empresa:
- Nome da empresa (`Input`)
- CNPJ (`Input` com máscara `##.###.###/####-##`)
- Plano desejado (`RadioGroup` com cards dos planos)

Passo 2 — Dados do responsável:
- Nome completo
- Email
- Senha + confirmar senha
- Checkbox "Li e aceito os Termos de Uso"

**Comportamento:**
- Progresso visual (stepper 1/2 → 2/2)
- Passo 1 validado antes de avançar
- Submit do passo 2 chama `POST /api/auth/register`
- Em sucesso: login automático + redirect para `/dashboard`

---

#### `/dashboard`

O dashboard exibe **exclusivamente dados estatísticos e informações sobre licitações**. Não exibe feeds de atividade genéricos nem notícias externas.

**Linha de métricas — grid 4 colunas (2 em mobile):**

| Métrica | Dado | Ícone |
|---|---|---|
| Licitações encontradas hoje | matches criados nas últimas 24h | `Sparkles` |
| Aguardando análise | matches com status `pending` ou `analyzing` | `Clock` |
| Score médio de aderência | média dos `score_aderencia` dos últimos 30 dias | `TrendingUp` |
| Análises restantes | `max_analyses - analyses_used` do plano | `Zap` |

**Linha de métricas secundárias — grid 4 colunas:**

| Métrica | Dado |
|---|---|
| Monitoradas ativas | licitações com status `monitorando` |
| Participando | licitações com status `participando` |
| Encerram em ≤ 3 dias | count de licitações com `data_encerramento` próxima |
| Total no período | total de matches dos últimos 30 dias |

**Gráfico principal — linha do tempo de licitações (Recharts `AreaChart`):**
- Eixo X: últimos 30 dias
- Séries: encontradas por dia, analisadas por dia
- Ocupa largura total, altura 240px

**Grid de gráficos secundários (2 colunas):**
- Barras horizontais: matches por portal (últimos 7 dias)
- Pizza/donut: distribuição por modalidade (top 5 modalidades)

**Grid de gráficos terciários (2 colunas):**
- Barras: distribuição por UF (top 10 estados)
- Barras horizontais: distribuição por nível de risco (baixo / médio / alto / crítico)

**Banner de alerta (condicional):**
- Exibido no topo quando há licitações com `data_encerramento` ≤ 3 dias
- Exemplo: "⚠ 2 licitações encerram em menos de 3 dias — Ver agora →"

---

#### `/oportunidades`

**Abas de navegação (no topo da página):**
- **Encontradas** — todos os matches ativos do tenant (exceto dispensados)
- **Favoritas** — lista pessoal do usuário autenticado (`match_user_watchlist`) — cada usuário vê apenas o que ele mesmo marcou
- **Participando** — licitações com `status = 'participando'` no tenant — visível para todos os usuários do tenant

Cada aba tem seu próprio contador de itens atualizado em tempo real.

> **Comportamento esperado**: João e Maria são do mesmo tenant. João adiciona uma licitação às suas favoritas — Maria não vê na aba "Favoritas" dela. Mas se o dono do tenant marca uma licitação como "Participando", todos os usuários veem na aba "Participando".

**Topbar contextual (dentro de cada aba):**
- Contador dinâmico: "28 encontradas"
- Busca textual com debounce 300ms (filtra por objeto e órgão)
- Filtros rápidos (pills): Todas | Alta aderência (≥80) | Urgentes (≤3 dias) | Analisadas | Pendentes
- Ordenação: Mais recentes | Maior relevância | Prazo mais próximo | Maior valor

**Grade de cards (grid 1 coluna em mobile, 2 colunas em desktop):**

Cada `OportunidadeCard` exibe:
- **Cabeçalho**: nome do órgão + UF (badge) + portal (badge colorido)
- **Objeto**: texto completo truncado em 3 linhas com `title` para tooltip
- **Linha de metadados**: modalidade · valor estimado (quando disponível) · data de encerramento
- **Barra de relevância**: barra de progresso colorida (verde ≥80 / amarelo ≥60 / cinza <60) com a nota numérica à direita (ex: "87/100")
- **Status badge**: `Pendente` | `Analisando` | `Analisada` | `Favorita` | `Participando`
- **Rodapé de ações** (4 botões):
  - `Ver detalhes` → navega para `/oportunidades/[id]`
  - `Favoritar` → adiciona/remove das favoritas pessoais do usuário (escopo usuário — toggle individual; ícone de estrela ou coração preenchido quando ativo)
  - `Participando` → marca o tenant como participante (escopo tenant — visível para todos; requer confirmação; ícone de flag)
  - `Dispensar` → dispensa para o tenant inteiro (escopo tenant — abre confirm dialog com aviso "Esta ação será visível para todos os usuários do seu time")

**Paginação:** infinite scroll com `useInfiniteQuery`, 24 cards por página, skeleton loader durante carregamento.

**Estado vazio por aba:**
- Encontradas sem matches → "Nenhuma licitação encontrada ainda. O próximo ciclo de coleta ocorre em [tempo]."
- Favoritas vazia → "Você ainda não adicionou licitações aos favoritos. Clique em 'Favoritar' em qualquer oportunidade para salvá-la aqui."
- Participando vazia → "Nenhuma licitação marcada como participando. Quando seu time decidir participar de uma licitação, ela aparecerá aqui para todos os usuários."

> **Nota de UX**: o tooltip do botão "Favoritar" deve explicar: "Adicionar aos meus favoritos — só você verá aqui". O tooltip do botão "Participando" deve explicar: "Marcar para o time — todos os usuários verão aqui".

---

#### `/oportunidades/[id]`

**Header fixo da licitação (acima das abas):**
- Breadcrumb: Oportunidades → [objeto truncado]
- Objeto completo (h1)
- Grade de metadados: Portal · Modalidade · UF · Órgão · CNPJ · Valor estimado · Status atual
- Barra de ações: `Monitorar` (toggle) | `Participando` (toggle) | `Dispensar` | `Acessar no portal ↗`

**Abas da página de detalhes:**

---

**Aba 1 — Análise da IA**

Exibe o resultado completo gerado pelo provedor de IA.

- Estado `analyzing`: skeleton animado com mensagem "Analisando documentos..."
- Estado `pending`: CTA "Solicitar análise" (respeita limite do plano)
- Estado `quota_exceeded`: aviso de limite atingido com data do reset
- Estado `analyzed`: conteúdo completo:

```
┌─ Resumo executivo ────────────────────────────────┐
│ [campo resumo — 2-3 parágrafos]                   │
└───────────────────────────────────────────────────┘

┌─ Critério de julgamento · Documentação exigida ───┐
│  Critério: [texto]                                │
│  • [doc 1]  • [doc 2]                             │
└───────────────────────────────────────────────────┘

┌─ Requisitos técnicos ─────────────────────────────┐
│  • [item 1]  • [item 2]                           │
└───────────────────────────────────────────────────┘

┌─ Pontos de atenção ───────────────────────────────┐
│  ⚠ [ponto 1]                                      │
└───────────────────────────────────────────────────┘

┌─ Datas extraídas ─────────────────────────────────┐
│  Entrega proposta: DD/MM/AAAA HH:MM               │
│  Abertura propostas: DD/MM/AAAA HH:MM             │
└───────────────────────────────────────────────────┘

┌─ Análise completa ────────────────────────────────┐
│  [campo analise_completa — collapsible]           │
└───────────────────────────────────────────────────┘
```

---

**Aba 2 — Relevância**

Exibe a pontuação de aderência com explicação detalhada de cada dimensão.

```
┌─ Score geral ────────────────────────────────────┐
│  [gauge circular grande — 0 a 100]               │
│  "Alta aderência" (label contextual)             │
└──────────────────────────────────────────────────┘

┌─ Dimensões ──────────────────────────────────────┐
│  Aderência ao interesse                          │
│  [barra de progresso 87/100]                     │
│  [explicação textual da IA para esta nota]       │
│                                                  │
│  Nível de risco                              Alto │
│  [barra de progresso vermelha]                   │
│  [explicação: "Exige garantias de..."]           │
│                                                  │
│  Complexidade técnica                       Média │
│  [barra de progresso amarela]                    │
│  [explicação textual]                            │
│                                                  │
│  Estimativa de chances                      Média │
│  [barra de progresso]                            │
│  [explicação textual]                            │
└──────────────────────────────────────────────────┘

┌─ Keywords que geraram o match ───────────────────┐
│  [tag: óleo]  [tag: lubrificante]                │
│  Contexto validado: veículos automotores         │
└──────────────────────────────────────────────────┘
```

---

**Aba 3 — Histórico**

Timeline vertical com todas as modificações, atualizações e ações registradas nesta licitação.

Cada entrada da timeline exibe:
- Ícone colorido por tipo de evento
- Data/hora formatada (relativa + absoluta no hover)
- Descrição da mudança

Tipos de evento:
- `match_created` — "Match encontrado pelo interesse [nome]"
- `analysis_completed` — "Análise concluída — Score: 87"
- `status_changed` — "Status alterado: Publicada → Em andamento" *(do portal)*
- `deadline_changed` — "Prazo alterado: 15/06 → 22/06 (+ 7 dias)" *(do portal)*
- `document_added` — "Novo documento: Adendo 01" *(do portal)*
- `favorited` — "[usuário] adicionou aos favoritos" *(escopo usuário — visível só para esse usuário)*
- `unfavorited` — "[usuário] removeu dos favoritos" *(escopo usuário)*
- `participacao_marcada` — "[usuário] marcou o time como Participando" *(escopo tenant — visível para todos)*
- `participacao_removida` — "[usuário] desmarcou participação" *(escopo tenant)*
- `dismissed` — "[usuário] dispensou a licitação" *(escopo tenant — visível para todos)*

---

**Aba 4 — Documentos**

Lista todos os documentos disponíveis da licitação.

- Tipo sinalizado com ícone: `FileText` (edital) · `ClipboardList` (TR) · `Paperclip` (anexo) · `FileCheck` (ata)
- Informações: nome, tipo, tamanho, data de disponibilização
- Botão "Baixar" por documento
- Botão "Baixar todos" (zip)
- Indicador visual quando o documento foi usado na análise da IA

---

**Aba 5 — Snapshots**

Comparação visual entre versões da licitação ao longo do tempo.

- Seletor de duas datas (snapshot A e snapshot B) para comparação lado a lado
- Campos alterados destacados: removido em vermelho, adicionado em verde (estilo diff)
- Campos comparados: status, objeto, datas, valor estimado, documentos
- Listagem de todos os snapshots disponíveis com data e resumo das mudanças detectadas

---

#### `/interesses`

**Lista de interesses:**
- Card por interesse com: nome, keywords (como tags), portais ativos, UFs, status (ativo/inativo)
- Estatísticas do interesse: total de matches, matches esta semana
- Ações: Editar | Ativar/Desativar | Excluir (com confirm dialog)
- Botão "+ Novo interesse" (abre formulário em sheet lateral)

**Formulário de criação/edição (`InteresseForm` — Sheet lateral):**

Passo 1 — Identificação:
- Nome do interesse (ex: "Equipamentos TI - Sul do Brasil")
- Contexto/descrição para a IA (textarea — ajuda o Gemini a entender o negócio)

Passo 2 — Palavras-chave:
- `KeywordInput`: campo onde usuário digita e pressiona Enter para adicionar
- Cada keyword vira uma tag removível
- Placeholder: "Ex: equipamento de informática, computador, notebook"
- Aviso visual: "Frases compostas são preservadas — 'óleo lubrificante' busca a frase exata"

Passo 3 — Portais e filtros:
- `PortalSelector`: checkboxes com logo de cada portal ativo
- `ModalidadeSelector`: multi-select agrupado por portal
- `UFSelector`: mapa interativo OU multi-select com as 27 UFs (agrupadas por região)

**Validação:**
- Nome obrigatório
- Mínimo 1 keyword
- Mínimo 1 portal selecionado
- Limite de keywords por plano (exibir contador: "3/10 keywords")

---

#### `/acompanhamento`

Licitações que o tenant marcou para acompanhar (matches não-dispensados com análise concluída).

**Layout:**
- Mesma estrutura do feed de oportunidades
- Coluna adicional: "Última mudança detectada" (badge com tipo: status, prazo, documento)
- Filtro: Com mudanças recentes | Prazo próximo | Todas
- Banner quando há mudança nova não-vista: "Nova atualização em [objeto]"

---

#### `/notificacoes`

**Seção: Preferências (por canal)**

Card por canal:
- **Telegram**: toggle ativo/inativo + botão "Conectar" (abre modal com QR code e código) + exibe "Conectado como @username" quando configurado
- **Email**: toggle + campo de email (pré-preenchido com email do usuário)
- **Web Push**: toggle + botão "Ativar notificações no navegador" (solicita permissão)

**Seção: Tipos de notificação**

Tabela/grid com checkboxes por canal:

| Evento | Telegram | Email | Web Push |
|---|---|---|---|
| Nova oportunidade encontrada | ☑ | ☑ | ☑ |
| Análise concluída | ☑ | ☑ | ☐ |
| Mudança de status | ☑ | ☐ | ☑ |
| Alerta de prazo | ☑ | ☑ | ☑ |

Configuração: "Alertar quando faltarem __ dias para o prazo" (input numérico, default 3).

**Seção: Histórico**
- Tabela paginada: data, tipo, canal, status (enviado/falhou), preview da mensagem
- Filtros por canal e tipo

---

#### `/configuracoes`

**Aba: Empresa**
- Nome, CNPJ (read-only após cadastro), slug
- Botão salvar

**Aba: Usuários**
- Contador no topo: "2 de 5 usuários utilizados" (barra de progresso fina)
- Tabela: nome, email, role, status, ações
- Botão "Convidar usuário" → modal com email + seleção de role
  - Botão desabilitado (com tooltip explicativo) quando o limite do plano for atingido
  - Ao atingir o limite: banner "Você atingiu o limite de usuários do seu plano. Faça upgrade para adicionar mais membros."
- Owner pode alterar roles e desativar membros

**Aba: Inteligência Artificial**

Permite que o tenant configure IA própria para reduzir custos repassando o gasto diretamente às suas contas.

- Toggle: "Usar minha própria IA" (quando ativo, usa a config do tenant; quando inativo, usa a IA do sistema)
- Seletor de provedor: OpenAI, Google Gemini, Anthropic Claude, Customizado
- Campo de API Key (input password — nunca exibida)
- Seletor de modelo (lista carregada conforme o provedor selecionado)
- Botão "Testar conexão" — chama a API com prompt mínimo e exibe latência + modelo retornado
- Aviso informativo: "Ao usar IA própria, o custo das análises é cobrado diretamente na sua conta do provedor. As análises do sistema não serão contabilizadas no seu plano."
- Histórico de uso: análises realizadas com IA própria vs IA do sistema (gráfico barras por mês)

**Aba: Plano**
- Card do plano atual com features e limites:
  - Máximo de interesses
  - Máximo de portais
  - Máximo de análises por mês
  - Máximo de usuários
  - **Preço atual** (exibe dinamicamente o valor correspondente ao modo de IA do tenant):
    - Se usando IA do sistema: "R$ 497/mês (inclui IA)"
    - Se usando IA própria: "R$ 297/mês (sem IA — você usa sua própria chave)"
    - Badge informativo: "Economize R$ 200/mês configurando sua própria IA →" com link para a aba de IA
- Barras de progresso: análises usadas / total · interesses criados / máximo · usuários ativos / máximo
- Botões de upgrade para planos superiores (cada card de plano superior mostra os dois preços: "R$ X com IA do sistema" e "R$ Y com IA própria")
- Histórico de uso (gráfico de barras por mês)

---

#### `/admin` (sistema)

Acessível apenas para usuários com role `system_admin` (fora do escopo de tenant).

**`/admin` — Métricas globais:**
- Total de tenants ativos
- Análises realizadas hoje / semana / mês
- Licitações coletadas hoje
- Status dos workers (último heartbeat de cada fila)
- Alertas: filas com jobs falhados, portais com erros

**`/admin/tenants`:**
- DataTable paginada com busca
- Colunas: empresa, plano, usuários, análises usadas, fonte de IA (`platform` / `own`), preço atual (R$), status, criado em
- Ações: ver detalhes, alterar plano, ativar/desativar
- Ao alterar plano: recalcula e persiste `current_price_brl` automaticamente conforme `ai_source` do tenant

**`/admin/ia`:**
- Cards por provedor: nome, modelo padrão, status (ativo/inativo), último teste
- Formulário por provedor: campo de API key (input password, nunca exibida em texto), seleção de modelo padrão, botão "Testar conexão"
- Ao salvar: a chave é enviada via HTTPS, criptografada com `pgp_sym_encrypt` antes de persistir no banco
- Toggle para definir qual provedor é o padrão
- Histórico de uso por provedor: total de análises, tokens consumidos, custo estimado

**`/admin/portais`:**
- Cards por portal: nome, status (ativo/inativo), último health check, total coletado
- Toggle ativo/inativo
- Botão "Testar conexão" → chama health check e exibe resultado
- Formulário de cadastro de novo portal

**`/admin/filas`:**
- Embed do Bull Board via `<iframe src="/api/admin/queues" />`
- Protegido por autenticação admin

**`/admin/sistema`:** *(apenas acessível para administradores do sistema)*

Painel de monitoramento em tempo real de todos os serviços, workers e filas. Atualização automática a cada 30 segundos via polling ou SSE.

```
┌─ Serviços ────────────────────────────────────────┐
│  ● API Fastify          ONLINE   latência: 12ms   │
│  ● Workers (PM2)        ONLINE   uptime: 3d 4h    │
│  ● PostgreSQL           ONLINE   conexões: 8/20   │
│  ● Redis                ONLINE   memória: 42MB    │
│  ● Nginx                ONLINE                    │
└───────────────────────────────────────────────────┘

┌─ Workers (BullMQ) ────────────────────────────────┐
│  Fila             Aguard.  Ativo  Concl.  Falhou  │
│  collection          0       0    1.2k      2     │
│  matching            3       1    8.4k      0     │
│  analysis            1       2     892      5     │
│  notification        0       0    3.1k      1     │
│  monitoring          0       0    2.3k      0     │
└───────────────────────────────────────────────────┘

┌─ Portais ─────────────────────────────────────────┐
│  PNCP         ● online   último ciclo: 14min atrás│
│  ComprasRS    ● online   último ciclo: 14min atrás│
│  BNC          ⚠ lento    último ciclo: 32min atrás│
│  Banrisul     ○ inativo                           │
└───────────────────────────────────────────────────┘

┌─ Provedor de IA ──────────────────────────────────┐
│  Google Gemini (padrão)  ● online                 │
│  Último teste: 2min atrás · latência média: 3.2s  │
│  Análises hoje: 47 · tokens: 284k                 │
└───────────────────────────────────────────────────┘
```

- Cards com badge colorido: ● verde (online) · ⚠ amarelo (degradado) · ○ cinza (inativo) · ✕ vermelho (offline)
- Botão "Testar conexão" por serviço (dispara health check manual)
- Botão "Forçar coleta agora" (enfileira job de coleta manual)
- Botão "Limpar jobs falhados" por fila
- Link direto para o Bull Board completo

---

### Estado global (Zustand stores)

#### `authStore`

```typescript
interface AuthStore {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;

  setAuth: (user: User, tenant: Tenant, token: string) => void;
  clearAuth: () => void;
  updateToken: (token: string) => void;
}
```

#### `uiStore`

```typescript
interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}
```

#### `notifStore`

```typescript
interface NotifStore {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
}
```

---

### HTTP client (`lib/api.ts`)

```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
});

// Injeta access token em todo request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh automático em 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, {
          withCredentials: true, // refresh token via cookie HttpOnly
        });
        useAuthStore.getState().updateToken(data.accessToken);
        return api(original);
      } catch {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

### Autenticação no frontend

- Access token: armazenado apenas em memória (`authStore` Zustand) — nunca em `localStorage`
- Refresh token: cookie HttpOnly com `SameSite=Strict; Secure` (enviado automaticamente)
- Proteção de rotas: middleware Next.js (`middleware.ts`) verifica cookie de sessão
- SSR: páginas do dashboard são `"use client"` — sem server-side rendering com dados sensíveis

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has('snifrbid_session');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard') ||
                      request.nextUrl.pathname.startsWith('/oportunidades');

  if (isDashboard && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

### Web Push — Service Worker

Criar `apps/web/public/sw.js`:

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'SnifrBid', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: { url: data.url },
      actions: [
        { action: 'view', title: 'Ver oportunidade' },
        { action: 'dismiss', title: 'Dispensar' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'view' || !event.action) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
```

---

### Componentes shadcn a instalar

```bash
pnpm dlx shadcn@latest add \
  button input label textarea select \
  card badge separator sheet dialog \
  dropdown-menu navigation-menu tabs \
  toast sonner progress skeleton \
  form radio-group checkbox switch \
  avatar table pagination \
  collapsible tooltip popover \
  command alert alert-dialog
```

---

### Checklist de validação — Fase 8

**Auth:**
- [ ] Login redireciona para `/dashboard` em sucesso
- [ ] Rota `/dashboard` sem cookie redireciona para `/login`
- [ ] Refresh automático: access token renovado sem perceber ao usuário
- [ ] Logout limpa store + cookie + redireciona

**Dashboard:**
- [ ] 4 métricas exibidas corretamente com dados reais da API
- [ ] Feed recente carrega e é clicável
- [ ] Gráfico de barras por portal renderiza
- [ ] Banner de prazo aparece quando há licitações urgentes

**Oportunidades:**
- [ ] Infinite scroll carrega próximas páginas ao rolar
- [ ] Filtros por aderência/urgência/status funcionando
- [ ] Busca textual filtra em tempo real (debounce 300ms)
- [ ] Ordenação funciona nos 3 modos
- [ ] Estado vazio exibe CTA correto

**Detalhes da oportunidade:**
- [ ] Todos os campos de metadados exibidos
- [ ] AnaliseCard exibe skeleton durante análise em andamento
- [ ] AnaliseCard exibe resultado completo quando analisado
- [ ] Gauge de score animado ao montar
- [ ] Documentos listados com download funcional
- [ ] Timeline exibe histórico de mudanças

**Interesses:**
- [ ] Formulário multi-step (3 passos) com navegação
- [ ] Keywords compostas adicionadas como tags
- [ ] Seleção de UFs com todas as 27 opções
- [ ] Validação impede salvar sem keyword ou portal
- [ ] Limite do plano exibido e bloqueado quando atingido

**Notificações:**
- [ ] Fluxo Telegram: gera código → usuário envia ao bot → confirma conexão
- [ ] Web Push: solicita permissão → armazena subscription via API
- [ ] Preferências salvas com toast de confirmação
- [ ] Histórico paginado exibe notificações enviadas

**Tema:**
- [ ] Toggle dark/light funciona em todas as páginas
- [ ] Preferência persistida no `localStorage`
- [ ] Nenhuma cor hardcoded quebra no tema contrário

**Performance:**
- [ ] Lighthouse score ≥ 85 em Performance e Acessibilidade
- [ ] Imagens com `next/image` e lazy loading
- [ ] Fontes com `next/font`
- [ ] Nenhum layout shift (CLS < 0.1)

