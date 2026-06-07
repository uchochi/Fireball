/**
 * Background worker entrypoint.
 * Run separately from the API server for batch processing and scheduled tasks.
 *
 * Usage: npx tsx src/worker.ts [command]
 * Commands:
 *   batch        Run daily content generation batch (500 items)
 *   auto-publish Process due auto-publish jobs
 *   process-job  <jobId>  Process a single custom generation job
 */

import { config } from 'dotenv';
config();

const command = process.argv[2];

async function main() {
  switch (command) {
    case 'batch': {
      const { runDailyBatch } = await import('./services/content-pipeline.js');
      console.log('[Worker] Starting daily batch generation...');
      const count = await runDailyBatch(500);
      console.log(`[Worker] Batch complete: ${count} items generated`);
      break;
    }
    case 'auto-publish': {
      const { processAutoPublishQueue } = await import('./services/auto-publish.js');
      console.log('[Worker] Processing auto-publish queue...');
      await processAutoPublishQueue();
      console.log('[Worker] Auto-publish queue processed');
      break;
    }
    case 'process-job': {
      const jobId = process.argv[3];
      if (!jobId) {
        console.error('[Worker] Usage: npx tsx src/worker.ts process-job <jobId>');
        process.exit(1);
      }
      const { processGenerationJob } = await import('./services/content-pipeline.js');
      console.log(`[Worker] Processing job ${jobId}...`);
      const result = await processGenerationJob(jobId);
      console.log(`[Worker] Job complete: ${result.id}`);
      break;
    }
    default:
      console.log(`
Usage: npx tsx src/worker.ts [command]

Commands:
  batch                  Run daily content generation batch (500 items)
  auto-publish           Process due auto-publish jobs
  process-job <jobId>    Process a single custom generation job
      `);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
