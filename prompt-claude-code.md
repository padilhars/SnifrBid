# Prompt para iniciar o Claude Code

Cole este prompt no Claude Code após entrar em `~/app` dentro do tmux.

---

```
Leia o arquivo `snifrbid-spec.md` na íntegra antes de escrever qualquer código.
O documento tem aproximadamente 4000 linhas — leia todo ele agora.

Após a leitura completa, siga esta sequência exata:

━━━ ETAPA 0 — Preparação ━━━

1. Crie o arquivo `CLAUDE.md` na raiz do projeto conforme especificado
   na seção "CLAUDE.md — arquivo obrigatório na raiz do projeto"

2. Inicialize o repositório git:
   git init && git add . && git commit -m "chore: init"

3. Instale os MCPs conforme a seção "MCP Servers recomendados":
   - postgres MCP
   - redis MCP
   - context7 MCP
   - git MCP

4. Instale as skills conforme a seção "Skills recomendadas":
   - ralph-loop
   - claude-mem
   - ui-ux-pro-max
   - security (opcional)

5. Confirme: `claude mcp list` mostra postgres, redis, context7 e git conectados.

━━━ ETAPA 1 — Implementação ━━━

Implemente o sistema fase por fase, nesta ordem:
Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7 → Fase 8 → Fase 9 → Fase 10

Para cada fase:
- Leia a seção completa antes de escrever código
- Implemente todos os arquivos descritos
- Execute TODOS os itens da checklist de validação com dados reais (não mocks)
- Corrija qualquer falha antes de avançar
- Reporte no formato obrigatório (✅ ou ⚠️) ao final de cada fase
- Faça commit com `feat: fase N — [nome] concluída e validada`
- Só avance para a próxima fase após validação 100% completa

Atenção especial:
- Na Fase 5, implemente o AIProviderService (seção 5.A) ANTES de qualquer worker
- A Fase 8 (frontend) aparece após as Fases 9 e 10 no documento por organização,
  mas deve ser implementada entre a Fase 7 e a Fase 9
- Todas as queries que usam RLS devem usar o helper `withTenantContext()`
- A rota `/licitacoes/favorites` deve ser registrada ANTES de `/licitacoes/:id`
- `pnpm typecheck` deve passar com zero erros antes de cada commit

Qualquer decisão não coberta pela spec: escolha a opção mais simples e
documente com `// DECISÃO: [justificativa]` no código.

Pode começar pela Etapa 0.
```
