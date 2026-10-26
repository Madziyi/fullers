import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createPrismaClient } from '../../src/lib/prisma-client';
import { hash } from 'bcryptjs';
import { randomUUID, createHash } from 'node:crypto';
const db = createPrismaClient();
const email = `studio-qa-${randomUUID()}@example.test`;
const password = randomUUID();
test.afterAll(async () => {
  if (process.env.CONTENT_SOURCE === 'database') {
    await db.user.deleteMany({ where: { email } });
    await db.loginThrottle.deleteMany({
      where: { key: createHash('sha256').update(email).digest('hex') },
    });
  }
  await db.$disconnect();
});
test('CMS navigation, responsive layout and selected accessibility checks', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  test.skip(process.env.CONTENT_SOURCE !== 'database', 'Requires disposable PostgreSQL.');
  await db.user.create({
    data: { email, name: 'Studio QA', role: 'ADMIN', passwordHash: await hash(password, 12) },
  });
  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL('/admin');
  for (const path of [
    '/admin',
    '/admin/products',
    '/admin/media',
    '/admin/pages',
    '/admin/projects',
    '/admin/enquiries',
    '/admin/redirects',
    '/admin/users',
    '/admin/audit',
  ]) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    expect(
      await page.locator('nav[aria-label="Administration"] a[aria-current="page"]').count(),
    ).toBe(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      `${path} fits viewport`,
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      path,
    ).toEqual([]);
    if (['/admin', '/admin/media', '/admin/products'].includes(path))
      await page.screenshot({
        path: `docs/screenshots/m3-studio-${path.split('/').at(-1)}-${info.project.name}.png`,
        fullPage: true,
      });
  }
});
