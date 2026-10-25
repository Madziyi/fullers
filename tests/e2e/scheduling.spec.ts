import { test, expect } from '@playwright/test';
import { createPrismaClient } from '../../src/lib/prisma-client';
import { utcToHarareLocal } from '../../src/lib/scheduling-time';
import { hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const db = createPrismaClient();
const marker = randomUUID();
const email = `m3b-admin-${marker}@example.test`;
const password = randomUUID();
let articleId: string | null = null;

function futureHarareTime(minutes: number) {
  const instant = new Date(Date.now() + minutes * 60_000);
  instant.setSeconds(0, 0);
  return utcToHarareLocal(instant);
}

test.afterAll(async () => {
  if (process.env.CONTENT_SOURCE === 'database') {
    if (articleId) {
      await db.auditLog.deleteMany({ where: { entity: 'Post', entityId: articleId } });
      await db.post.updateMany({ where: { id: articleId }, data: { publishedRevisionId: null } });
      await db.publicationJob.deleteMany({ where: { postId: articleId } });
      await db.postRevision.deleteMany({ where: { postId: articleId } });
      await db.post.deleteMany({ where: { id: articleId } });
    }
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.auditLog.deleteMany({ where: { actorId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  await db.$disconnect();
});

test('Harare schedules queue, stay private, and require review after a conflicting edit', async ({
  page,
  request,
}, info) => {
  test.skip(process.env.CONTENT_SOURCE !== 'database', 'Requires migrated PostgreSQL.');
  await db.user.create({
    data: {
      email,
      name: 'M3B QA administrator',
      role: 'ADMIN',
      passwordHash: await hash(password, 12),
    },
  });

  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL('/admin');
  await page.goto('/admin/posts');
  await page.getByRole('button', { name: 'New article +' }).click();
  await expect(page).toHaveURL(/\/admin\/posts\//);
  articleId = new URL(page.url()).pathname.split('/').at(-1) ?? null;

  const title = page.getByLabel('Article title');
  const slug = page.getByLabel('Public URL slug');
  await title.fill('Planning an aggregate delivery');
  await page
    .getByLabel('Short introduction')
    .fill('A useful guide for planning an aggregate delivery and preparing for the work ahead.');
  await page.getByLabel('Search title').fill('Planning an aggregate delivery | Fullers');
  await page
    .getByLabel('Search description')
    .fill(
      'Practical advice to plan an aggregate delivery with clear expectations and useful details.',
    );
  await page.getByRole('button', { name: '＋ Paragraph' }).click();
  await page
    .getByLabel('paragraph')
    .fill('Confirm the work area and intended use before arranging a delivery.');
  await expect(page.getByRole('status')).toContainText('All changes saved', { timeout: 10000 });

  const path = `/blog/${await slug.inputValue()}`;
  await page.getByLabel('Publish time in Zimbabwe (CAT, Africa/Harare)').fill(futureHarareTime(5));
  await page.getByRole('button', { name: 'Schedule publication' }).click();
  await expect(page.locator('.schedule-status')).toContainText('Queued');
  expect((await request.get(path)).status()).toBe(404);
  const queued = await db.publicationJob.findFirstOrThrow({
    where: { postId: articleId! },
    select: { status: true, scheduledVersion: true },
  });
  expect(queued.status).toBe('PENDING');

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({
    path: `docs/screenshots/m3b-schedule-${info.project.name}.png`,
    fullPage: true,
  });
  await title.fill('Revised planning for an aggregate delivery');
  await page
    .getByLabel('Search title')
    .fill('Revised planning for an aggregate delivery | Fullers');
  await expect(page.locator('.schedule-status')).toContainText('Needs review', { timeout: 10000 });
  const changed = await db.publicationJob.findFirstOrThrow({
    where: { postId: articleId! },
    select: { status: true },
  });
  expect(changed.status).toBe('NEEDS_REVIEW');
  expect((await request.get(path)).status()).toBe(404);
});
