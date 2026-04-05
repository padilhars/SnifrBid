import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });
const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), 'migrations');
async function runMigrations() {
    const client = postgres(process.env.DATABASE_URL, { max: 1 });
    const db = drizzle(client);
    console.log('Ativando extensões...');
    await client `CREATE EXTENSION IF NOT EXISTS vector`;
    await client `CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    console.log('Rodando migrations...');
    await migrate(db, { migrationsFolder });
    console.log('✅ Migrations aplicadas com sucesso');
    await client.end();
}
runMigrations().catch((err) => {
    console.error('❌ Erro nas migrations:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map