import { Queue } from 'bullmq';
import { getRedis } from '@snifrbid/shared';

const connection = getRedis();

export const collectionQueue = new Queue('collection', { connection });

export const matchingQueue = new Queue('matching', { connection });

export const analysisQueue = new Queue('analysis', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60_000 }, // 1min, 2min, 4min
    // DECISÃO: timeout via job option para Fastify 5 / BullMQ 5
  },
});

export const notificationQueue = new Queue('notification', { connection });

export const monitoringQueue = new Queue('monitoring', { connection });

// maintenanceQueue exportada aqui para ser acessível no scheduler e no Bull Board da API
export const maintenanceQueue = new Queue('maintenance', { connection });

// Geração de embeddings — job assíncrono separado para não bloquear a coleta
export const embeddingQueue = new Queue('embedding', { connection });
