import { test, expect } from '@playwright/test';
import { createPrismaClient } from '../../src/lib/prisma-client';
import { hash } from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';

const db = createPrismaClient();
const token = randomUUID();
const email = `operations-qa-${token}@example.test`;
const managedEmail = `editor-${token}@example.test`;
const password = `Strong-${token}`;
const path = `/legacy-qa-${token}`;
let adminId: string | null = null;
let managedUserId: string | null = null;
let inquiryId: string | null = null;
let redirectId: string | null = null;

test.afterAll(async () => {
  if (process.env.CONTENT_SOURCE === 'database') {
    const managedUser = await db.user.findUnique({
      where: { email: managedEmail },
      select: { id: true },
    });
    const redirect = await db.redirect.findUnique({
      where: { source: path },
      select: { id: true },
    });
    const auditWhere = [
      { actorId: adminId ?? '' },
      { entityId: managedUserId ?? managedUser?.id ?? '' },
      { entityId: inquiryId ?? '' },
      { entityId: redirectId ?? redirect?.id ?? '' },
    ];
    await db.auditLog.deleteMany({ where: { OR: auditWhere } });
    if (inquiryId) await db.inquiry.deleteMany({ where: { id: inquiryId } });
    await db.redirect.deleteMany({ where: { source: path } });
    await db.user.deleteMany({ where: { email: managedEmail } });
    if (adminId) await db.user.deleteMany({ where: { id: adminId } });
    await db.loginThrottle.deleteMany({
      where: { key: createHash('sha256').update(email).digest('hex') },
    });
  }
  await db.$disconnect();
});

test('administrator operations keep enquiries private, guard accounts and resolve redirects', async ({
  page,
  request,
}) => {
  test.skip(process.env.CONTENT_SOURCE !== 'database', 'Requires migrated PostgreSQL.');
  const admin = await db.user.create({
    data: { email, name: 'Operations QA', role: 'ADMIN', passwordHash: await hash(password, 12) },
  });
  adminId = admin.id;
  const inquiry = await db.inquiry.create({
    data: {
      name: 'Private QA Contact',
      email: 'private-qa@example.test',
      phone: null,
      message: 'Private enquiry body for QA only.',
      consentAt: new Date(),
      status: 'NEW',
    },
  });
  inquiryId = inquiry.id;

  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL('/admin');

  await page.goto(`/admin/enquiries/${inquiry.id}`);
  await page.getByLabel('Enquiry status').selectOption('IN_PROGRESS');
  await page.getByRole('button', { name: 'Save status' }).click();
  await expect
    .poll(async () => (await db.inquiry.findUnique({ where: { id: inquiry.id } }))?.status)
    .toBe('IN_PROGRESS');
  const statusAudit = await db.auditLog.findFirst({
    where: { entity: 'Inquiry', entityId: inquiry.id },
  });
  expect(JSON.stringify(statusAudit?.changes)).not.toContain('Private QA Contact');
  expect(JSON.stringify(statusAudit?.changes)).not.toContain('Private enquiry body');

  await page.goto('/admin/users');
  await page.getByLabel('Name', { exact: true }).fill('QA editor');
  await page.getByLabel('Email', { exact: true }).fill(managedEmail);
  await page.getByLabel('Initial password (12–72 characters)').fill(`Editor-${token}`);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/admin\/users\?result=created$/);
  await expect(page.getByRole('status')).toContainText('Account created');
  managedUserId = (await db.user.findUnique({ where: { email: managedEmail } }))?.id ?? null;
  expect(managedUserId).toBeTruthy();
  const accountAudit = await db.auditLog.findFirst({
    where: { entity: 'User', entityId: managedUserId! },
  });
  expect(JSON.stringify(accountAudit?.changes)).not.toContain(`editor-${token}@example.test`);
  const selfRow = page.getByRole('row', { name: new RegExp(email) });
  await selfRow.getByLabel(`Role for ${email}`).selectOption('EDITOR');
  await selfRow.getByLabel(`Status for ${email}`).selectOption('false');
  await selfRow.getByLabel('Confirm access change').check();
  await selfRow.getByRole('button', { name: 'Save access' }).click();
  await expect
    .poll(async () => (await db.user.findUnique({ where: { id: admin.id } }))?.role)
    .toBe('ADMIN');
  await expect
    .poll(async () => (await db.user.findUnique({ where: { id: admin.id } }))?.active)
    .toBe(true);

  await page.goto('/admin/redirects');
  await page.getByLabel('From path').first().fill(path);
  await page.getByLabel('To path').first().fill('/products');
  await page.getByRole('button', { name: 'Add redirect' }).click();
  await expect(page).toHaveURL(/\/admin\/redirects\?result=saved$/);
  await expect(page.getByRole('status')).toContainText('Redirect saved');
  redirectId = (await db.redirect.findUnique({ where: { source: path } }))?.id ?? null;
  expect(redirectId).toBeTruthy();
  const response = await request.get(path, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toMatch(/\/products$/);
  const redirectAudit = await db.auditLog.findFirst({
    where: { entity: 'Redirect', entityId: redirectId! },
  });
  expect(redirectAudit?.action).toBe('CREATE');

  await page.goto('/admin/audit');
  await expect(page.getByRole('heading', { name: 'Audit history' })).toBeVisible();
  await expect(page.getByText('Private QA Contact')).toHaveCount(0);
  await expect(page.getByText('private-qa@example.test')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/admin/login');
});
