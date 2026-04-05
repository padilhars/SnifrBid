import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';
export { schema };
export * from './schema/index.js';
// DECISÃO: singleton lazy para evitar conexão ao importar o pacote sem banco disponível
let db = null;
export function getDb() {
    if (!db) {
        const client = postgres(process.env.DATABASE_URL, {
            max: 20,
            idle_timeout: 30,
        });
        db = drizzle(client, { schema });
    }
    return db;
}
//# sourceMappingURL=index.js.map