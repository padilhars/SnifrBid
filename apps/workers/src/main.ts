import 'dotenv/config';
import { createCollectionWorker } from './workers/CollectionWorker.js';
import { createMatchingWorker } from './workers/MatchingWorker.js';
import { createAnalysisWorker } from './workers/AnalysisWorker.js';
import { createNotificationWorker } from './workers/NotificationWorker.js';
import { createMonitoringWorker, createMaintenanceWorker } from './workers/MonitoringWorker.js';
import { registerScheduledJobs } from './schedulers/index.js';

async function main() {
  console.log('Starting SnifrBid workers...');

  const workers = [
    createCollectionWorker(),
    createMatchingWorker(),
    createAnalysisWorker(),
    createNotificationWorker(),
    createMonitoringWorker(),
    createMaintenanceWorker(),
  ];

  await registerScheduledJobs();

  for (const worker of workers) {
    worker.on('completed', (job) => {
      console.log(`[${worker.name}] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[${worker.name}] Job ${job?.id} failed:`, err.message);
    });
  }

  console.log(`Workers running: ${workers.map((w) => w.name).join(', ')}`);

  // Graceful shutdown
  async function shutdown() {
    console.log('Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Fatal error starting workers:', err);
  process.exit(1);
});
