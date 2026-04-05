import fp from 'fastify-plugin';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { Queue } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import { getRedis } from '@snifrbid/shared';

export const bullBoardPlugin = fp(async (app: FastifyInstance) => {
  const connection = getRedis();

  // Queue instances apenas para Bull Board — mesmas filas do workers
  const queues = [
    new Queue('collection', { connection }),
    new Queue('matching', { connection }),
    new Queue('analysis', { connection }),
    new Queue('notification', { connection }),
    new Queue('monitoring', { connection }),
    new Queue('maintenance', { connection }),
  ];

  const serverAdapter = new FastifyAdapter();

  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });

  serverAdapter.setBasePath('/admin/queues');

  await app.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' });
});
