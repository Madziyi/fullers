import { test, expect } from '@playwright/test';
import { createPrismaClient } from '../../src/lib/prisma-client';
import { hash } from 'bcryptjs';
import { randomUUID, createHash } from 'node:crypto';
const db = createPrismaClient();
const email = `settings-qa-${randomUUID()}@example.test`;
const password = randomUUID();
test.afterAll(async () => {
  if (process.env.CONTENT_SOURCE === 'database') {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) await db.auditLog.deleteMany({ where: { actorId: user.id } });
    await db.user.deleteMany({ where: { email } });
    await db.loginThrottle.deleteMany({
      where: { key: createHash('sha256').update(email).digest('hex') },
    });
  }
  await db.$disconnect();
});
test('database-backed sign-in and settings edit update public statistics', async ({
  page,
}, info) => {
  test.skip(
    process.env.CONTENT_SOURCE !== 'database',
    'Requires migrated PostgreSQL and seeded administrator; covered in CI.',
  );
  await db.user.create({
    data: {
      email,
      name: 'QA administrator',
      role: 'ADMIN',
      passwordHash: await hash(password, 12),
    },
  });
  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL('/admin');
  await expect(page.getByRole('heading', { name: 'Let’s build on what’s here.' })).toBeVisible();
  await page.screenshot({
    path: `docs/screenshots/admin-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto('/admin/settings');
  await page.getByLabel('Jobs done — value').fill('701+');
  await page.getByRole('button', { name: 'Save site settings →' }).click();
  await expect(page.getByRole('status')).toContainText('Settings saved');
  await page.goto('/');
  await expect(page.locator('.stat strong').filter({ hasText: '701+' })).toBeVisible();
  await page.goto('/admin/settings');
  await page.getByLabel('Jobs done — value').fill('700+');
  await page.getByRole('button', { name: 'Save site settings →' }).click();
  await expect(page.getByRole('status')).toContainText('Settings saved');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/admin/login');
  await page.goto('/admin/settings');
  await expect(page).toHaveURL('/admin/login');
});
