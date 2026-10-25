import { test, expect } from '@playwright/test';
import { createPrismaClient } from '../../src/lib/prisma-client';
import AxeBuilder from '@axe-core/playwright';
import { hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

const db = createPrismaClient();
const marker = randomUUID();
const email = `m3a-admin-${marker}@example.test`;
const password = randomUUID();
const titleText = 'Choosing aggregate materials';
const updatedTitle = 'Planning an aggregate order';
let articleId: string | null = null;

test.afterAll(async () => {
  if (process.env.CONTENT_SOURCE === 'database') {
    if (articleId) {
      await db.auditLog.deleteMany({ where: { entity: 'Post', entityId: articleId } });
      await db.post.updateMany({ where: { id: articleId }, data: { publishedRevisionId: null } });
      const media = await db.media.findMany({
        where: { articlePostId: articleId },
        select: { id: true },
      });
      await db.media.deleteMany({ where: { articlePostId: articleId } });
      await Promise.all(
        media.map((item) =>
          unlink(resolve(process.cwd(), '.local-media', 'article', `${item.id}.webp`)).catch(
            () => undefined,
          ),
        ),
      );
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

test('publication snapshots remain stable until an edited version is published', async ({
  page,
  request,
}) => {
  test.skip(process.env.CONTENT_SOURCE !== 'database', 'Requires migrated PostgreSQL.');
  await db.user.create({
    data: {
      email,
      name: 'M3A QA administrator',
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
  await title.fill(titleText);
  await page
    .getByLabel('Short introduction')
    .fill(
      'A practical introduction with enough context for our customers to understand this topic clearly.',
    );
  await page.getByLabel('Search title').fill('Choosing aggregate materials | Fullers');
  await page
    .getByLabel('Search description')
    .fill(
      'An informative description that explains the article clearly and helps readers decide whether it answers their question.',
    );
  await page.getByRole('button', { name: '＋ Paragraph' }).click();
  await page
    .getByLabel('paragraph')
    .fill('The first published explanation contains practical information and useful context.');
  await page.getByRole('button', { name: '＋ Heading' }).click();
  await page.getByLabel('heading2').fill('Plan the next step');
  await page.getByRole('button', { name: '＋ Image' }).click();
  await page
    .getByLabel('Descriptive image alt text')
    .fill('A pile of clean quarry stones ready for building work');
  const validUpload = page.waitForResponse(
    (response) =>
      response.url().includes('/api/article-media') && response.request().method() === 'POST',
  );
  await page.getByLabel('Upload a private image').setInputFiles('public/assets/bricks.webp');
  expect((await validUpload).status()).toBe(200);
  await expect(
    page.getByText('Image uploaded privately. Add descriptive alt text before publishing.'),
  ).toBeVisible();
  await page.getByRole('button', { name: '＋ Link' }).click();
  await page.getByLabel('Link text').fill('Explore Fullers products');
  const apiUrl = new URL('/api/article-media', page.url()).href;
  const fakeUpload = await page.request.post(apiUrl, {
    headers: { origin: new URL(page.url()).origin },
    multipart: {
      image: { name: 'fake.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not an image') },
      postId: articleId!,
    },
  });
  expect(fakeUpload.status()).toBe(400);
  const crossOriginUpload = await page.request.post(apiUrl, {
    headers: { origin: 'https://outside.example' },
    multipart: {
      image: { name: 'valid.webp', mimeType: 'image/webp', buffer: Buffer.from('not an image') },
      postId: articleId!,
    },
  });
  expect(crossOriginUpload.status()).toBe(403);
  const ownedMedia = await db.media.findFirstOrThrow({
    where: { articlePostId: articleId! },
    select: { storageKey: true },
  });
  expect((await request.get(ownedMedia.storageKey)).status()).toBe(404);
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(150);
  await page.screenshot({
    path: `docs/screenshots/m3a-editor-${test.info().project.name}.png`,
    fullPage: true,
  });
  const previewPopup = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Preview' }).click();
  const preview = await previewPopup;
  await expect(preview.getByRole('heading', { name: titleText })).toBeVisible();
  expect(await preview.locator('meta[name="robots"]').getAttribute('content')).toContain('noindex');
  const previewAxe = await new AxeBuilder({ page: preview })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(previewAxe.violations.map((v) => v.id)).toEqual([]);
  await preview.screenshot({
    path: `docs/screenshots/m3a-preview-${test.info().project.name}.png`,
    fullPage: true,
  });
  await preview.close();
  expect((await page.request.get(ownedMedia.storageKey)).status()).toBe(200);
  await page.route(`**/admin/posts/${articleId}`, async (route) => {
    if (route.request().method() === 'POST')
      await new Promise((resolve) => setTimeout(resolve, 600));
    await route.continue();
  });
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByLabel('Article title')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible();
  await page.unroute(`**/admin/posts/${articleId}`);
  const slugField = page.getByLabel('Public URL slug');
  const slug = await slugField.inputValue();
  await expect(page.getByLabel('Public URL slug')).toBeDisabled();
  const first = await request.get(`/blog/${slug}`);
  expect(first.status()).toBe(200);
  expect(await first.text()).toContain('The first published explanation');
  expect((await request.get(ownedMedia.storageKey)).status()).toBe(200);
  const firstRevision = await db.post.findUniqueOrThrow({
    where: { id: articleId! },
    select: { publishedRevision: { select: { version: true } } },
  });

  await title.fill(updatedTitle);
  await page.getByLabel('Search title').fill('Planning an aggregate order | Fullers');
  await expect(page.getByRole('status')).toContainText('All changes saved', { timeout: 10000 });
  const editedWorking = await db.post.findUniqueOrThrow({
    where: { id: articleId! },
    select: { version: true },
  });
  expect(editedWorking.version).toBeGreaterThan(firstRevision.publishedRevision!.version);
  const unchanged = await request.get(`/blog/${slug}`);
  expect(await unchanged.text()).toContain('Choosing aggregate materials | Fullers');
  expect(await unchanged.text()).not.toContain('Planning an aggregate order | Fullers');

  await page.getByRole('button', { name: 'Publish updates' }).click();
  await expect(page.getByRole('button', { name: 'Unpublish' })).toBeVisible();
  await expect
    .poll(async () => {
      const current = await db.post.findUniqueOrThrow({
        where: { id: articleId! },
        select: { publishedRevision: { select: { version: true } } },
      });
      return current.publishedRevision?.version;
    })
    .toBe(editedWorking.version);
  const updated = await request.get(`/blog/${slug}`);
  expect(updated.status()).toBe(200);
  expect(await updated.text()).toContain('Planning an aggregate order | Fullers');

  await page.getByRole('button', { name: 'Unpublish' }).click();
  await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible();
  await expect
    .poll(
      async () =>
        (
          await db.post.findUniqueOrThrow({
            where: { id: articleId! },
            select: { publishedRevisionId: true },
          })
        ).publishedRevisionId,
    )
    .toBeNull();
  const hidden = await request.get(`/blog/${slug}`);
  expect(hidden.status()).toBe(404);
  expect((await request.get(ownedMedia.storageKey)).status()).toBe(404);
});
