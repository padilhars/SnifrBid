import postgres from 'postgres';
import * as schema from './schema/index.js';
export { schema };
export * from './schema/index.js';
export declare function getDb(): import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
};
//# sourceMappingURL=index.d.ts.map