import {
  collectionQueue,
  monitoringQueue,
  maintenanceQueue,
} from '../queues/index.js';

export async function registerScheduledJobs() {
  // Coleta a cada 4 horas — um job por ciclo
  await collectionQueue.add('collect-all', {}, {
    repeat: { pattern: '0 */4 * * *' },
    jobId: 'collect-all-recurring',
  });

  // Monitoramento de mudanças a cada 30 minutos
  await monitoringQueue.add('monitor-changes', {}, {
    repeat: { pattern: '*/30 * * * *' },
    jobId: 'monitor-changes-recurring',
  });

  // Reset de contador de análises no início de cada mês
  await maintenanceQueue.add('reset-analyses-counter', {}, {
    repeat: { pattern: '0 0 1 * *' },
    jobId: 'reset-analyses-recurring',
  });

  console.log('Scheduled jobs registered');
}
