import { Redis } from 'ioredis';
let instance = null;
export function getRedis() {
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
//# sourceMappingURL=redis.js.map