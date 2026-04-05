import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import * as schema from '../schema/index.js';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../../.env') });
if (!process.env.ADMIN_INITIAL_PASSWORD) {
    console.error('❌ ADMIN_INITIAL_PASSWORD é obrigatória para o seed inicial');
    process.exit(1);
}
const portaisSeed = [
    { name: 'PNCP', slug: 'pncp', adapterKey: 'pncp', baseUrl: 'https://pncp.gov.br/api/pncp/v1', isActive: true, config: {} },
    { name: 'ComprasRS', slug: 'compras-rs', adapterKey: 'compras-rs', baseUrl: 'https://www.compras.rs.gov.br', isActive: true, config: {} },
    { name: 'BNC', slug: 'bnc', adapterKey: 'bnc', baseUrl: 'https://bnc.org.br', isActive: true, config: {} },
    { name: 'Banrisul', slug: 'banrisul', adapterKey: 'banrisul', baseUrl: 'https://licitacoes.banrisul.com.br', isActive: false, config: {} },
];
const modalidadesPNCPSeed = [
    { name: 'Leilão - Eletrônico', code: '1' },
    { name: 'Diálogo Competitivo', code: '2' },
    { name: 'Concurso', code: '3' },
    { name: 'Concorrência - Eletrônica', code: '4' },
    { name: 'Concorrência - Presencial', code: '5' },
    { name: 'Pregão - Eletrônico', code: '6' },
    { name: 'Pregão - Presencial', code: '7' },
    { name: 'Dispensa de Licitação', code: '8' },
    { name: 'Inexigibilidade', code: '9' },
    { name: 'Manifestação de Interesse', code: '10' },
    { name: 'Pré-qualificação', code: '11' },
    { name: 'Credenciamento', code: '12' },
    { name: 'Leilão - Presencial', code: '13' },
];
const ufsSeed = [
    { code: 'AC', name: 'Acre' },
    { code: 'AL', name: 'Alagoas' },
    { code: 'AP', name: 'Amapá' },
    { code: 'AM', name: 'Amazonas' },
    { code: 'BA', name: 'Bahia' },
    { code: 'CE', name: 'Ceará' },
    { code: 'DF', name: 'Distrito Federal' },
    { code: 'ES', name: 'Espírito Santo' },
    { code: 'GO', name: 'Goiás' },
    { code: 'MA', name: 'Maranhão' },
    { code: 'MT', name: 'Mato Grosso' },
    { code: 'MS', name: 'Mato Grosso do Sul' },
    { code: 'MG', name: 'Minas Gerais' },
    { code: 'PA', name: 'Pará' },
    { code: 'PB', name: 'Paraíba' },
    { code: 'PR', name: 'Paraná' },
    { code: 'PE', name: 'Pernambuco' },
    { code: 'PI', name: 'Piauí' },
    { code: 'RJ', name: 'Rio de Janeiro' },
    { code: 'RN', name: 'Rio Grande do Norte' },
    { code: 'RS', name: 'Rio Grande do Sul' },
    { code: 'RO', name: 'Rondônia' },
    { code: 'RR', name: 'Roraima' },
    { code: 'SC', name: 'Santa Catarina' },
    { code: 'SP', name: 'São Paulo' },
    { code: 'SE', name: 'Sergipe' },
    { code: 'TO', name: 'Tocantins' },
];
const aiProvidersSeed = [
    {
        name: 'Google Gemini', slug: 'gemini',
        modelDefault: 'gemini-1.5-pro',
        modelsAvailable: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
        isActive: false, isDefault: true, config: {},
    },
    {
        name: 'OpenAI ChatGPT', slug: 'openai',
        modelDefault: 'gpt-4o',
        modelsAvailable: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
        isActive: false, isDefault: false, config: {},
    },
    {
        name: 'Anthropic Claude', slug: 'claude',
        modelDefault: 'claude-opus-4-5',
        modelsAvailable: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
        isActive: false, isDefault: false, config: {},
    },
    {
        name: 'Provedor customizado', slug: 'custom',
        apiBaseUrl: '',
        modelDefault: '',
        modelsAvailable: [],
        isActive: false, isDefault: false, config: {},
    },
];
const planosSeed = [
    {
        name: 'Gratuito', slug: 'free',
        maxInterests: 1, maxPortals: 1, maxAnalysesPerMonth: 10, maxUsers: 1,
        priceWithPlatformAiBrl: '0', priceWithOwnAiBrl: '0',
    },
    {
        name: 'Básico', slug: 'basic',
        maxInterests: 3, maxPortals: 2, maxAnalysesPerMonth: 50, maxUsers: 2,
        priceWithPlatformAiBrl: '197', priceWithOwnAiBrl: '97',
    },
    {
        name: 'Pro', slug: 'pro',
        maxInterests: 10, maxPortals: 4, maxAnalysesPerMonth: 200, maxUsers: 5,
        priceWithPlatformAiBrl: '497', priceWithOwnAiBrl: '297',
    },
    {
        name: 'Enterprise', slug: 'enterprise',
        maxInterests: -1, maxPortals: -1, maxAnalysesPerMonth: -1, maxUsers: -1,
        priceWithPlatformAiBrl: '1497', priceWithOwnAiBrl: '997',
    },
];
async function seed() {
    const client = postgres(process.env.DATABASE_URL, { max: 1 });
    const db = drizzle(client, { schema });
    console.log('Iniciando seed...');
    // 1. Extensões e FTS — executar via SQL raw
    await client `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await client `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
    await client `CREATE EXTENSION IF NOT EXISTS "vector"`;
    await client `CREATE EXTENSION IF NOT EXISTS "unaccent"`;
    await client `CREATE EXTENSION IF NOT EXISTS "pg_trgm"`;
    await client `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'snifrbid_pt'
      ) THEN
        CREATE TEXT SEARCH CONFIGURATION snifrbid_pt (COPY = pg_catalog.portuguese);
        ALTER TEXT SEARCH CONFIGURATION snifrbid_pt
          ALTER MAPPING FOR hword, hword_part, word WITH unaccent, portuguese_stem;
      END IF;
    END $$
  `;
    // Índices FTS e trgm (não suportados pelo Drizzle customType)
    await client `
    CREATE INDEX IF NOT EXISTS idx_licitacoes_search ON licitacoes USING GIN(search_vector)
  `;
    await client `
    CREATE INDEX IF NOT EXISTS idx_licitacoes_objeto_trgm ON licitacoes USING GIN(objeto gin_trgm_ops)
  `;
    await client `
    CREATE INDEX IF NOT EXISTS idx_licitacoes_embedding ON licitacoes USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100)
  `;
    // Trigger para search_vector
    await client `
    CREATE OR REPLACE FUNCTION update_licitacao_search_vector()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('snifrbid_pt', coalesce(NEW.objeto, '')), 'A') ||
        setweight(to_tsvector('snifrbid_pt', coalesce(NEW.orgao_nome, '')), 'B');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `;
    await client `
    DROP TRIGGER IF EXISTS trig_licitacoes_search_vector ON licitacoes
  `;
    await client `
    CREATE TRIGGER trig_licitacoes_search_vector
      BEFORE INSERT OR UPDATE ON licitacoes
      FOR EACH ROW EXECUTE FUNCTION update_licitacao_search_vector()
  `;
    // Função auxiliar para FTS
    await client `
    CREATE OR REPLACE FUNCTION snifrbid_phrase_query(keyword TEXT) RETURNS tsquery AS $$
    BEGIN
      RETURN phraseto_tsquery('snifrbid_pt', keyword);
    END;
    $$ LANGUAGE plpgsql IMMUTABLE
  `;
    // 2. UFs
    await db.insert(schema.ufs).values(ufsSeed).onConflictDoNothing();
    console.log('✅ UFs inseridas');
    // 3. Portais
    const portaisInserted = await db.insert(schema.portals)
        .values(portaisSeed)
        .onConflictDoNothing()
        .returning();
    console.log(`✅ ${portaisInserted.length} portais inseridos`);
    // 4. Modalidades do PNCP
    const pncp = await db.query.portals.findFirst({
        where: (p, { eq }) => eq(p.slug, 'pncp'),
    });
    if (pncp) {
        await db.insert(schema.modalidades)
            .values(modalidadesPNCPSeed.map(m => ({ ...m, portalId: pncp.id })))
            .onConflictDoNothing();
        console.log('✅ Modalidades PNCP inseridas');
    }
    // 5. Provedores de IA
    await db.insert(schema.aiProviders).values(aiProvidersSeed).onConflictDoNothing();
    console.log('✅ AI Providers inseridos');
    // 6. Planos
    const planosInserted = await db.insert(schema.plans).values(planosSeed).onConflictDoNothing().returning();
    console.log(`✅ ${planosInserted.length} planos inseridos`);
    // 7. Tenant system + usuário admin
    const freePlan = await db.query.plans.findFirst({
        where: (p, { eq }) => eq(p.slug, 'free'),
    });
    if (!freePlan)
        throw new Error('Plano free não encontrado após seed');
    const [systemTenant] = await db.insert(schema.tenants)
        .values({
        name: 'Sistema',
        slug: 'system',
        planId: freePlan.id,
        isActive: true,
        settings: {},
    })
        .onConflictDoNothing()
        .returning();
    const tenantForAdmin = systemTenant ?? await db.query.tenants.findFirst({
        where: (t, { eq }) => eq(t.slug, 'system'),
    });
    if (!tenantForAdmin)
        throw new Error('Tenant system não encontrado');
    const passwordHash = await bcrypt.hash(process.env.ADMIN_INITIAL_PASSWORD, 12);
    await db.insert(schema.users)
        .values({
        tenantId: tenantForAdmin.id,
        email: process.env.ADMIN_EMAIL ?? 'admin@snifrbid.com.br',
        passwordHash,
        name: 'Administrador',
        role: 'system_admin',
        isActive: true,
    })
        .onConflictDoNothing();
    console.log('✅ Admin inserido');
    // 8. RLS — Row Level Security (isolamento por tenant e por usuário)
    // IMPORTANTE: o usuário da aplicação NÃO deve ser superuser (superuser bypassa RLS)
    const rlsTables = ['interests', 'matches', 'analyses', 'notifications', 'match_user_watchlist'];
    for (const table of rlsTables) {
        await client.unsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
        await client.unsafe(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
    }
    // Policy tenant_isolation: cada tenant vê apenas seus próprios dados
    const tenantTables = ['interests', 'matches', 'analyses', 'notifications'];
    for (const table of tenantTables) {
        await client.unsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = '${table}' AND policyname = 'tenant_isolation'
        ) THEN
          CREATE POLICY tenant_isolation ON ${table}
            USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
        END IF;
      END $$
    `);
    }
    // Policy user_isolation: watchlist é por usuário
    await client `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'match_user_watchlist' AND policyname = 'user_isolation'
      ) THEN
        CREATE POLICY user_isolation ON match_user_watchlist
          USING (user_id = current_setting('app.current_user_id', true)::uuid);
      END IF;
    END $$
  `;
    console.log('✅ RLS habilitado nas tabelas sensíveis');
    console.log('\n✅ Seed concluído com sucesso!');
    await client.end();
}
seed().catch((err) => {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map