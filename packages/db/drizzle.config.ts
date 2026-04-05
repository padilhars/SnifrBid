import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '../../.env' });

export default {
  schema: './dist/schema/index.js',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
