import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createPrismaClient } from '../src/lib/prisma-client';
import { processDuePublications } from '../src/lib/publication-worker';
import { getPublishedArticle } from '../src/lib/articles';

const db = createPrismaClient();
const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.test';
const suffix = randomUUID();
const publishedSlug = `scheduled-${suffix}`;
const conflictSlug = `conflict-${suffix}`;
const fixtureIds: string[] = [];
const jobIds: string[] = [];

beforeAll(() => {
  if (process.env.CONTENT_SOURCE !== 'database') throw new Error('Use the migrated QA database.');
});

afterAll(async () => {
  if (fixtureIds.length) {
    await db.auditLog.deleteMany({ where: { entity: 'Post', entityId: { in: fixtureIds } } });
    await db.post.updateMany({
      where: { id: { in: fixtureIds } },
      data: { publishedRevisionId: null },
    });
  }
  if (jobIds.length) await db.publicationJob.deleteMany({ where: { id: { in: jobIds } } });
  if (fixtureIds.length) {
    await db.postRevision.deleteMany({ where: { postId: { in: fixtureIds } } });
    await db.post.deleteMany({ where: { id: { in: fixtureIds } } });
  }
  await db.$disconnect();
});

async function scheduledFixture(slug: string, version: number, status: 'SCHEDULED' | 'DRAFT') {
  const admin = await db.user.findUniqueOrThrow({
    where: { email: adminEmail },
    select: { id: true },
  });
  const runAt = new Date(Date.now() - 2_000);
  const post = await db.post.create({
    data: {
      title: 'A scheduled article with useful guidance',
      slug,
      excerpt: 'Guidance for people planning a building and aggregate project.',
      body: {
        type: 'doc',
        blocks: [{ type: 'paragraph', text: 'This saved version is ready to publish.' }],
      },
      seo: {
        title: 'Planning an aggregate project',
        description: 'Guidance for choosing materials for a building project in Zimbabwe.',
        authorName: 'Fullers Aggregate',
        coverSrc: null,
        coverAlt: '',
      },
      status,
      version,
      publishAt: runAt,
      authorId: admin.id,
    },
  });
  fixtureIds.push(post.id);
  const job = await db.publicationJob.create({
    data: {
      postId: post.id,
      scheduledById: admin.id,
      scheduledVersion: 2,
      runAt,
      nextAttemptAt: runAt,
    },
  });
  jobIds.push(job.id);
  return { post, job, runAt };
}

describe('scheduled article delivery', () => {
  it('is safe across repeated and concurrent worker calls', async () => {
    const { post, job, runAt } = await scheduledFixture(publishedSlug, 2, 'SCHEDULED');
    const results = await Promise.all([
      processDuePublications(new Date(), 1),
      processDuePublications(new Date(), 1),
    ]);
    expect(results.reduce((sum, item) => sum + item.published, 0)).toBe(1);
    expect(await db.postRevision.count({ where: { postId: post.id } })).toBe(1);
    expect((await db.publicationJob.findUniqueOrThrow({ where: { id: job.id } })).status).toBe(
      'PUBLISHED',
    );
    expect(
      (await db.post.findUniqueOrThrow({ where: { id: post.id } })).publishedRevisionId,
    ).not.toBeNull();
    expect((await getPublishedArticle(publishedSlug))?.title).toBe(post.title);
    expect(runAt.getTime()).toBeLessThan(Date.now());
    expect((await processDuePublications(new Date(), 1)).processed).toBe(0);
  });

  it('holds a stale scheduled version for review without exposing it publicly', async () => {
    const { post, job } = await scheduledFixture(conflictSlug, 3, 'DRAFT');
    const result = await processDuePublications(new Date(), 1);
    expect(result.needsReview).toBe(1);
    const updated = await db.post.findUniqueOrThrow({ where: { id: post.id } });
    expect(updated.publishedRevisionId).toBeNull();
    expect((await db.publicationJob.findUniqueOrThrow({ where: { id: job.id } })).status).toBe(
      'NEEDS_REVIEW',
    );
    expect(await getPublishedArticle(conflictSlug)).toBeNull();
  });
});
