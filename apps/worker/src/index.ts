import 'dotenv/config';
import { Worker, Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@bounty/database';

const connection = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const db = new PrismaClient();

// ============================================================
// Queue definitions
// ============================================================
export const QUEUES = {
  AI_MATCHING: 'ai-matching',
  PR_SYNC: 'pr-sync',
  REPO_ANALYSIS: 'repo-analysis',
  CONTRIBUTOR_SYNC: 'contributor-sync',
  BOUNTY_EXPIRY: 'bounty-expiry',
  NOTIFICATION: 'notification',
} as const;

// ============================================================
// AI Matching Worker
// ============================================================
const aiMatchingWorker = new Worker(
  QUEUES.AI_MATCHING,
  async (job) => {
    const { bountyId } = job.data as { bountyId: string };
    console.log(`[AI Matching] Processing bounty: ${bountyId}`);

    // In production this would call the AI service directly
    // Here we just mark the job as processed
    await job.updateProgress(100);
    return { bountyId, status: 'computed' };
  },
  {
    connection,
    concurrency: parseInt(process.env['WORKER_CONCURRENCY'] ?? '5'),
  },
);

// ============================================================
// PR Sync Worker — polls GitHub for PR status updates
// ============================================================
const prSyncWorker = new Worker(
  QUEUES.PR_SYNC,
  async (job) => {
    const { prId } = job.data as { prId: string };
    console.log(`[PR Sync] Syncing PR: ${prId}`);

    const pr = await db.pullRequest.findUnique({
      where: { id: prId },
      include: { bounty: { include: { repository: true } } },
    });

    if (!pr) return { skipped: true };

    // Would call GitHub API here
    await job.updateProgress(100);
    return { prId, synced: true };
  },
  { connection, concurrency: 10 },
);

// ============================================================
// Bounty Expiry Worker — marks expired bounties
// ============================================================
const bountyExpiryWorker = new Worker(
  QUEUES.BOUNTY_EXPIRY,
  async (job) => {
    console.log('[Bounty Expiry] Checking for expired bounties...');

    const expired = await db.bounty.updateMany({
      where: {
        status: { in: ['OPEN', 'DRAFT'] },
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    console.log(`[Bounty Expiry] Marked ${expired.count} bounties as expired`);
    return { count: expired.count };
  },
  { connection, concurrency: 1 },
);

// ============================================================
// Error handling
// ============================================================
[aiMatchingWorker, prSyncWorker, bountyExpiryWorker].forEach((worker) => {
  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });
});

// ============================================================
// Graceful shutdown
// ============================================================
async function shutdown() {
  console.log('Shutting down workers...');
  await Promise.all([
    aiMatchingWorker.close(),
    prSyncWorker.close(),
    bountyExpiryWorker.close(),
  ]);
  await db.$disconnect();
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('🔧 Workers started');
console.log(`   AI Matching: ${QUEUES.AI_MATCHING}`);
console.log(`   PR Sync: ${QUEUES.PR_SYNC}`);
console.log(`   Bounty Expiry: ${QUEUES.BOUNTY_EXPIRY}`);
