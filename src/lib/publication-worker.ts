import 'server-only';
import { Prisma } from '@/generated/prisma-client';
import { db } from './db';
import { buildPublicationSnapshot, publicationInclude } from './article-publication';

const maxAttempts = 5;
const activeStatuses = ['PENDING', 'RETRY'] as const;
type DueJob = { id: string };
type WorkerOutcome = keyof PublicationRunSummary | 'idle' | 'cancelled' | { retryJobId: string };

export type PublicationRunSummary = {
  processed: number;
  published: number;
  needsReview: number;
  failed: number;
  retried: number;
};

function safeFailureMessage() {
  return 'A temporary publishing service error occurred. The worker will retry this schedule.';
}

async function takeOne(now: Date): Promise<WorkerOutcome> {
  let claimedJobId: string | null = null;
  try {
    return await db.$transaction(async (tx) => {
      const due = await tx.$queryRaw<DueJob[]>(Prisma.sql`
        SELECT "id" FROM "PublicationJob"
        WHERE "status" IN ('PENDING'::"PublicationJobStatus", 'RETRY'::"PublicationJobStatus")
          AND "runAt" <= ${now}
          AND "nextAttemptAt" <= ${now}
        ORDER BY "runAt" ASC, "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `);
      if (due.length === 0) return 'idle';
      const job = await tx.publicationJob.findUnique({ where: { id: due[0].id } });
      if (!job) return 'idle';
      claimedJobId = job.id;
      const post = await tx.post.findUnique({
        where: { id: job.postId },
        include: publicationInclude,
      });
      if (!post || post.deletedAt || post.status === 'ARCHIVED') {
        await tx.publicationJob.update({
          where: { id: job.id },
          data: {
            status: 'CANCELLED',
            lastError: 'The article was deleted or archived before its scheduled time.',
            finishedAt: now,
          },
        });
        return 'cancelled';
      }
      if (post.version !== job.scheduledVersion) {
        await tx.publicationJob.update({
          where: { id: job.id },
          data: {
            status: 'NEEDS_REVIEW',
            lastError: 'The saved article changed after scheduling. Review and schedule it again.',
            finishedAt: now,
          },
        });
        await tx.post.updateMany({
          where: { id: post.id, version: job.scheduledVersion, publishAt: job.runAt },
          data: {
            status: post.status === 'SCHEDULED' ? 'DRAFT' : post.status,
            publishAt: null,
          },
        });
        return 'needsReview';
      }
      if (
        post.publishAt?.getTime() !== job.runAt.getTime() ||
        (post.status !== 'SCHEDULED' && post.status !== 'PUBLISHED')
      ) {
        await tx.publicationJob.update({
          where: { id: job.id },
          data: {
            status: 'NEEDS_REVIEW',
            lastError: 'The schedule changed before delivery. Review and schedule it again.',
            finishedAt: now,
          },
        });
        await tx.post.updateMany({
          where: { id: post.id, version: job.scheduledVersion, publishAt: job.runAt },
          data: {
            status: post.status === 'SCHEDULED' ? 'DRAFT' : post.status,
            publishAt: null,
          },
        });
        return 'needsReview';
      }
      if (
        post.status === 'PUBLISHED' &&
        post.publishedRevisionId &&
        post.publishedRevision?.version === job.scheduledVersion
      ) {
        await tx.publicationJob.update({
          where: { id: job.id },
          data: { status: 'PUBLISHED', lastError: null, finishedAt: now },
        });
        await tx.post.updateMany({
          where: { id: post.id, version: job.scheduledVersion, publishAt: job.runAt },
          data: { publishAt: null },
        });
        return 'published';
      }
      const candidate = buildPublicationSnapshot(post, now);
      if (!candidate.ok) {
        await tx.publicationJob.update({
          where: { id: job.id },
          data: { status: 'NEEDS_REVIEW', lastError: candidate.error, finishedAt: now },
        });
        await tx.post.updateMany({
          where: { id: post.id, version: job.scheduledVersion, publishAt: job.runAt },
          data: {
            status: post.status === 'SCHEDULED' ? 'DRAFT' : post.status,
            publishAt: null,
          },
        });
        return 'needsReview';
      }
      const slugConflict = await tx.post.findFirst({
        where: { slug: candidate.slug, id: { not: post.id }, deletedAt: null },
        select: { id: true },
      });
      if (slugConflict) {
        await tx.publicationJob.update({
          where: { id: job.id },
          data: {
            status: 'NEEDS_REVIEW',
            lastError: 'The public article URL is now in use. Resolve the conflict and reschedule.',
            finishedAt: now,
          },
        });
        await tx.post.updateMany({
          where: { id: post.id, version: job.scheduledVersion, publishAt: job.runAt },
          data: {
            status: post.status === 'SCHEDULED' ? 'DRAFT' : post.status,
            publishAt: null,
          },
        });
        return 'needsReview';
      }
      const revision = await tx.postRevision.create({
        data: {
          postId: post.id,
          actorId: job.scheduledById,
          version: job.scheduledVersion,
          snapshot: candidate.snapshot,
        },
      });
      const update = await tx.post.updateMany({
        where: {
          id: post.id,
          version: job.scheduledVersion,
          status: post.status,
          publishedRevisionId: post.publishedRevisionId,
          publishAt: job.runAt,
        },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
          publishAt: null,
          publishedSlug: candidate.slug,
          publishedRevisionId: revision.id,
        },
      });
      if (!update.count) throw new Error('SCHEDULE_VERSION_CONFLICT');
      await tx.publicationJob.update({
        where: { id: job.id },
        data: { status: 'PUBLISHED', lastError: null, finishedAt: now },
      });
      await tx.auditLog.create({
        data: {
          actorId: job.scheduledById,
          action: 'PUBLISH_SCHEDULED',
          entity: 'Post',
          entityId: post.id,
          changes: { scheduleId: job.id, version: job.scheduledVersion },
        },
      });
      return 'published';
    });
  } catch {
    if (claimedJobId) return { retryJobId: claimedJobId };
    throw new Error('Publication worker could not claim the next due schedule.');
  }
}

async function recordTransientFailure(jobId: string, now: Date) {
  const delaysMinutes = [1, 2, 4, 8, 15];
  await db.$transaction(async (tx) => {
    const job = await tx.publicationJob.findUnique({ where: { id: jobId } });
    if (!job || !activeStatuses.includes(job.status as (typeof activeStatuses)[number])) return;
    const nextAttempt = job.attempts + 1;
    await tx.publicationJob.updateMany({
      where: { id: jobId, status: { in: [...activeStatuses] }, attempts: job.attempts },
      data: {
        attempts: nextAttempt,
        status: nextAttempt >= maxAttempts ? 'FAILED' : 'RETRY',
        nextAttemptAt: new Date(now.getTime() + delaysMinutes[job.attempts] * 60_000),
        lastError:
          nextAttempt >= maxAttempts
            ? 'Publishing failed after repeated temporary errors. Review and reschedule this article.'
            : safeFailureMessage(),
        ...(nextAttempt >= maxAttempts ? { finishedAt: now } : {}),
      },
    });
  });
}

export async function processDuePublications(
  now = new Date(),
  requestedLimit = 10,
): Promise<PublicationRunSummary> {
  const limit = Math.max(1, Math.min(25, Math.trunc(requestedLimit)));
  const summary: PublicationRunSummary = {
    processed: 0,
    published: 0,
    needsReview: 0,
    failed: 0,
    retried: 0,
  };
  for (let index = 0; index < limit; index++) {
    // The worker selects and locks jobs inside a transaction. If the transaction
    // fails, a new transaction records a bounded retry without exposing the error.
    try {
      const result = await takeOne(now);
      if (result === 'idle') break;
      if (typeof result === 'object' && 'retryJobId' in result) {
        await recordTransientFailure(result.retryJobId, now);
        summary.processed++;
        const attempted = await db.publicationJob.findUnique({
          where: { id: result.retryJobId },
          select: { status: true },
        });
        if (attempted?.status === 'FAILED') summary.failed++;
        else summary.retried++;
        continue;
      }
      summary.processed++;
      if (result === 'published') summary.published++;
      else if (result === 'needsReview') summary.needsReview++;
      else if (result === 'failed') summary.failed++;
    } catch {
      // If the database itself is unavailable, leave the due row untouched and
      // return an error so the external scheduler can retry the worker request.
      throw new Error('Publication worker could not connect to process due schedules.');
    }
  }
  return summary;
}
