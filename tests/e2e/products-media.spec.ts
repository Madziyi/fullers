import { test, expect } from '@playwright/test';
import { createPrismaClient } from '../../src/lib/prisma-client';
import { hash } from 'bcryptjs';
import { randomUUID, createHash } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const db = createPrismaClient();
const run = randomUUID().replaceAll('-', '');
const email = `products-qa-${run}@example.test`;
const password = randomUUID();
let mediaId: string | null = null;
let secondMediaId: string | null = null;
test.afterAll(async () => {
  if (process.env.CONTENT_SOURCE === 'database') {
    await db.product.deleteMany({ where: { slug: `qa-product-${run}` } });
    for (const id of [mediaId, secondMediaId].filter((value): value is string => !!value)) {
      await db.auditLog.deleteMany({ where: { entity: 'Media', entityId: id } });
      await db.media.deleteMany({ where: { id } });
      await rm(resolve(process.cwd(), '.local-media', 'article', `${id}.webp`), { force: true });
      await rm(resolve(process.cwd(), '.local-media', 'article', `${id}.original`), {
        force: true,
      });
    }
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) await db.auditLog.deleteMany({ where: { actorId: user.id } });
    await db.user.deleteMany({ where: { email } });
    await db.loginThrottle.deleteMany({
      where: { key: createHash('sha256').update(email).digest('hex') },
    });
  }
  await db.$disconnect();
});

test('administrator edits and publishes a product, manages media metadata, and archives it', async ({
  page,
  browser,
}) => {
  test.skip(
    process.env.CONTENT_SOURCE !== 'database',
    'Requires migrated PostgreSQL and is covered in CI.',
  );
  await db.user.create({
    data: {
      email,
      name: 'Product QA administrator',
      role: 'ADMIN',
      passwordHash: await hash(password, 12),
    },
  });
  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL('/admin');

  await page.goto('/admin/media');
  const uploadForm = page.locator('.media-upload');
  await uploadForm.locator('input[type=file]').setInputFiles('public/assets/bricks.webp');
  await uploadForm.getByLabel('Source or attribution').fill('Fullers source asset, QA run');
  const uploadResponse = page.waitForResponse(
    (response) => response.url().includes('/api/media') && response.request().method() === 'POST',
  );
  await uploadForm.getByRole('button', { name: 'Upload image' }).click();
  expect((await uploadResponse).ok()).toBeTruthy();
  const mediaCard = page.locator('.media-card').first();
  await expect(mediaCard.getByLabel('Source')).toHaveValue('Fullers source asset, QA run');
  const imageSrc = await mediaCard.locator('img').getAttribute('src');
  const storedImageUrl = imageSrc
    ? new URL(imageSrc, 'http://localhost').searchParams.get('url')
    : null;
  mediaId =
    decodeURIComponent(storedImageUrl ?? imageSrc ?? '')
      .split('/')
      .pop() ?? null;
  const sourceResponse = await page.request.get(`/api/media/${mediaId}/source`);
  expect(sourceResponse.status()).toBe(200);
  expect(sourceResponse.headers()['content-type']).toBe('image/webp');
  expect(
    Buffer.compare(await sourceResponse.body(), await readFile('public/assets/bricks.webp')),
  ).toBe(0);
  const guest = await browser.newContext({ baseURL: new URL(page.url()).origin });
  expect((await guest.request.get(`/api/media/${mediaId}/source`)).status()).toBe(401);
  await guest.close();
  await expect(mediaCard).toBeVisible();
  await mediaCard.getByLabel('Alt text').fill('Bricks at Fullers Aggregate');
  await mediaCard.getByRole('button', { name: 'Save details' }).click();
  await expect(mediaCard.getByRole('status')).toContainText('Saved');

  await page.goto('/admin/products');
  await page.getByRole('button', { name: 'New product +' }).click();
  await expect(page).toHaveURL(/\/admin\/products\/[a-z0-9]+$/);
  await page.getByLabel('Product name').fill('QA concrete product');
  await page.getByLabel('URL slug').fill(`qa-product-${run}`);
  await page.getByLabel('Summary').fill('A source-backed product summary for QA.');
  await page.getByLabel(/Product details/).fill('Details entered by an administrator for a test.');
  await page.getByLabel('Product image').selectOption(String(mediaId));
  await page.getByLabel('Image alt text').fill('Bricks at Fullers Aggregate');
  await page.getByRole('button', { name: 'Add specification' }).click();
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByRole('status')).toContainText('Complete or remove');
  const specRow = page.locator('.product-row').first();
  await specRow.getByLabel('Specification label').fill('Material');
  await specRow.getByLabel('Value').fill('Concrete');
  await page.getByRole('button', { name: 'Add question' }).click();
  const faqRow = page.locator('.product-row').nth(1);
  await faqRow.getByLabel('Question').fill('How do I confirm sizes?');
  await faqRow.getByLabel('Answer').fill('Contact the Fullers team with your requirements.');
  const editorUrl = page.url();
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `docs/screenshots/m3-product-editor-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.goto(`/products/qa-product-${run}`);
  await expect(page.getByText('We couldn’t find that page.')).toBeVisible();
  await page.goto(editorUrl);
  await page.getByLabel('Status').selectOption('PUBLISHED');
  await page.getByRole('button', { name: 'Publish product changes' }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  await page.goto(`/products/qa-product-${run}`);
  await expect(page.getByRole('heading', { level: 1, name: 'QA concrete product' })).toBeVisible();
  await expect(page.getByText('Details entered by an administrator for a test.')).toBeVisible();
  await expect(page.locator('.spec-note').getByText('Concrete', { exact: true })).toBeVisible();
  await expect(page.getByText('How do I confirm sizes?', { exact: true })).toBeVisible();
  await expect(page.getByText('Contact the Fullers team with your requirements.')).toBeVisible();
  await expect(
    page.locator('.product-detail img[alt="Bricks at Fullers Aggregate"]'),
  ).toBeVisible();

  await page.goto('/admin/media');
  const replacementForm = page.locator('.media-upload');
  await replacementForm.locator('input[type=file]').setInputFiles('public/assets/bricks.webp');
  await replacementForm.getByLabel('Source or attribution').fill('Fullers replacement QA asset');
  const replacementResponse = page.waitForResponse(
    (response) => response.url().includes('/api/media') && response.request().method() === 'POST',
  );
  await replacementForm.getByRole('button', { name: 'Upload image' }).click();
  expect((await replacementResponse).ok()).toBeTruthy();
  const replacementCard = page.locator('.media-card').first();
  await expect(replacementCard.getByLabel('Source')).toHaveValue('Fullers replacement QA asset');
  const replacementSrc = await replacementCard.locator('img').getAttribute('src');
  const replacementUrl = replacementSrc
    ? new URL(replacementSrc, 'http://localhost').searchParams.get('url')
    : null;
  secondMediaId =
    decodeURIComponent(replacementUrl ?? replacementSrc ?? '')
      .split('/')
      .pop() ?? null;
  expect(secondMediaId).toBeTruthy();
  expect(secondMediaId).not.toBe(mediaId);
  await page.goto('/admin/products');
  await page.getByRole('link', { name: 'QA concrete product' }).click();
  await page.getByLabel('Product image').selectOption(String(secondMediaId));
  await page.getByRole('button', { name: 'Publish product changes' }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  const original = await db.media.findUnique({
    where: { id: mediaId! },
    select: { id: true, deletedAt: true },
  });
  expect(original).toMatchObject({ id: mediaId, deletedAt: null });

  await page.goto('/admin/products');
  await page.getByRole('link', { name: 'QA concrete product' }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Archive product' }).click();
  await expect(page).toHaveURL('/admin/products');
  await page.goto(`/products/qa-product-${run}`);
  await expect(page.getByText('We couldn’t find that page.')).toBeVisible();
});
