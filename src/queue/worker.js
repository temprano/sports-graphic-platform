/**
 * src/queue/worker.js
 *
 * BullMQ worker entry point. Consumes jobs from the pipeline queue
 * and dispatches to the appropriate job handler.
 *
 * Run via PM2:
 *   pm2 start ecosystem.config.cjs
 *
 * Run directly (dev):
 *   node src/queue/worker.js
 *
 * TODO: Implement job handlers when Component 2 pipeline build begins.
 * See TODO.md — Component 2 / Job Queue Setup
 */

import { Worker } from 'bullmq';
import { config } from '../config.js';

// Job type constants — match what the order state machine enqueues
export const JOB_TYPES = {
  PROCESS_PHOTOS:        'PROCESS_PHOTOS',
  RENDER_VIDEOS:         'RENDER_VIDEOS',
  RENDER_PRINTS:         'RENDER_PRINTS',
  GENERATE_PROOFS:       'GENERATE_PROOFS',
  PACKAGE_ORDER:         'PACKAGE_ORDER',
  FULFILL_PRINT:         'FULFILL_PRINT',
  GENERATE_PARENT_STORE: 'GENERATE_PARENT_STORE',
};

const connection = {
  host: config.redis.host,
  port: config.redis.port,
};

// ─── Job dispatcher ───────────────────────────────────────────────

async function processJob(job) {
  console.info(`Processing job: ${job.name}`, { jobId: job.id, orderId: job.data.orderId });

  switch (job.name) {
    case JOB_TYPES.PROCESS_PHOTOS:
      return (await import('./jobs/process-photos.js')).run(job.data);

    case JOB_TYPES.RENDER_VIDEOS:
      return (await import('./jobs/render-video.js')).run(job.data);

    case JOB_TYPES.RENDER_PRINTS:
      return (await import('./jobs/render-print.js')).run(job.data);

    case JOB_TYPES.GENERATE_PROOFS:
      // TODO: implement proof generation job
      throw new Error(`Job ${job.name}: not yet implemented`);

    case JOB_TYPES.PACKAGE_ORDER:
      return (await import('./jobs/package-order.js')).run(job.data);

    case JOB_TYPES.FULFILL_PRINT:
      // TODO: implement Prodigi/Printful fulfillment job
      throw new Error(`Job ${job.name}: not yet implemented`);

    case JOB_TYPES.GENERATE_PARENT_STORE:
      // TODO: implement parent store generation job
      throw new Error(`Job ${job.name}: not yet implemented`);

    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }
}

// ─── Worker ───────────────────────────────────────────────────────

const worker = new Worker('pipeline', processJob, {
  connection,
  concurrency: 2,        // max 2 render jobs simultaneously
  removeOnComplete: { count: 100 },
  removeOnFail:     { count: 500 },
});

worker.on('completed', job => {
  console.info(`Job completed: ${job.name}`, { jobId: job.id });
});

worker.on('failed', (job, err) => {
  console.error(`Job failed: ${job?.name}`, { jobId: job?.id, error: err.message });
});

worker.on('error', err => {
  console.error('Worker error', { error: err.message });
});

console.info('Pipeline worker started', {
  redis: `${config.redis.host}:${config.redis.port}`,
  concurrency: 2,
});