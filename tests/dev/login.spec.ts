import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomUUID, createHash } from 'node:crypto';
const db = new PrismaClient();
const email = `dev-qa-${randomUUID()}@example.test`;
const password = randomUUID();
test.afterAll(async () => {
  await db.user.deleteMany({ where: { email } });
  await db.loginThrottle.deleteMany({
    where: { key: createHash('sha256').update(email).digest('hex') },
  });
  await db.$disconnect();
});
test('development login hydrates, submits credentials by POST and opens the private inbox', async ({
  page,
}) => {
  await db.user.create({
    data: {
      email,
      name: 'Disposable dev administrator',
      role: 'ADMIN',
      passwordHash: await hash(password, 12),
    },
  });
  const response = await page.goto('/admin/login');
  expect(response?.headers()['content-security-policy']).toContain("'unsafe-eval'");
  const submittedMethods: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/callback/credentials'))
      submittedMethods.push(request.method());
    expect(request.url()).not.toContain('password=');
  });
  await expect(page.getByRole('button', { name: 'Sign in →' })).toBeEnabled();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL('/admin', { timeout: 30000 });
  expect(submittedMethods).toEqual(['POST']);
  await page.goto('/admin/enquiries');
  await expect(page.getByRole('heading', { name: 'The next conversation.' })).toBeVisible();
});
test('unhydrated sign-in cannot send credentials through a GET URL', async ({
  browser,
  request,
}) => {
  const legacy = await request.get('/admin/login?password=disposable-test-value', {
    maxRedirects: 0,
  });
  expect(legacy.status()).toBe(307);
  expect(legacy.headers().location).toBe('/admin/login');
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3119/admin/login');
    await expect(page.locator('form')).toHaveAttribute('method', 'post');
    await expect(page.getByRole('button', { name: 'Sign in →' })).toBeDisabled();
    await expect(page.getByText('Enable JavaScript to sign in securely.')).toBeVisible();
  } finally {
    await context.close();
  }
});
