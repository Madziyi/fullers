import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { prepareScreenshot } from './capture';
const db = new PrismaClient();
const marker = randomUUID();
const customer = `m2-customer-${marker}@example.test`;
const admin = `m2-admin-${marker}@example.test`;
const editor = `m2-editor-${marker}@example.test`;
const password = 'disposable-m2-test-password-only';
test.afterAll(async () => {
  if (process.env.CONTENT_SOURCE === 'database') {
    await db.inquiry.deleteMany({ where: { email: customer } });
    await db.user.deleteMany({ where: { email: { in: [admin, editor] } } });
  }
  await db.$disconnect();
});
test('M2 pages are crawlable, connected, responsive and accessible', async ({
  page,
  request,
}, info) => {
  for (const [path, heading] of [
    ['/about', 'Rooted in Bindura.'],
    ['/services', 'More than materials.'],
    ['/contact', 'Every project starts'],
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(heading);
    expect(html).toContain(`rel="canonical" href="${new URL(path, response.url()).href}"`);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      axe.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    await prepareScreenshot(page);
    await page.screenshot({
      path: `docs/screenshots/m2-${path.slice(1)}-${info.project.name}.png`,
      fullPage: true,
    });
  }
  await page.goto('/products/bricks');
  await page.getByRole('link', { name: 'Request a quote using our form' }).click();
  await expect(page.getByLabel('Product of interest')).toHaveValue('bricks');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const path of ['/about', '/services', '/contact']) expect(sitemap).toContain(path);
  expect(sitemap).not.toContain('enquiry-notice');
  await page.goto('/contact/enquiry-notice');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  if (info.project.name === 'mobile') {
    await page.getByLabel('Open navigation').click();
    await page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link', { name: 'About', exact: true })
      .click();
    await expect(page).toHaveURL('/about');
    await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
    await page.getByLabel('Open navigation').click();
    await page.getByLabel('Open navigation').press('Escape');
    await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open');
  }
});
test('quote form validates, preserves input, saves privately and permits admin review only', async ({
  page,
  request,
}, info) => {
  test.skip(process.env.CONTENT_SOURCE !== 'database', 'Requires disposable PostgreSQL.');
  await db.user.createMany({
    data: [
      {
        email: admin,
        name: 'M2 QA administrator',
        role: 'ADMIN',
        passwordHash: await hash(password, 12),
      },
      {
        email: editor,
        name: 'M2 QA editor',
        role: 'EDITOR',
        passwordHash: await hash(password, 12),
      },
    ],
  });
  await page.goto('/contact?product=bricks');
  await page.getByLabel('Your name', { exact: true }).fill('M2 QA visitor');
  await page.getByLabel('Email address', { exact: true }).fill(customer);
  await page.getByRole('button', { name: 'Send your enquiry' }).click();
  await expect(page.locator('.enquiry-form').getByRole('alert')).toContainText('highlighted');
  await expect(page.getByLabel('Your name', { exact: true })).toHaveValue('M2 QA visitor');
  const message =
    '<script>window.enquiryInjected=true</script> Please discuss bricks for our next building project.';
  await page.getByLabel('Tell us about your project').fill(message);
  await page.getByLabel('Fullers may use my contact details').check();
  await page.getByRole('button', { name: 'Send your enquiry' }).click();
  await expect(page.getByRole('status')).toContainText('Your enquiry has been saved');
  const enquiry = await db.inquiry.findFirstOrThrow({ where: { email: customer } });
  expect(await db.inquiry.count({ where: { email: customer } })).toBe(1);
  expect(enquiry.productSlug).toBe('bricks');
  const anonymous = await request.get(`/admin/enquiries/${enquiry.id}`, { maxRedirects: 0 });
  expect([303, 307]).toContain(anonymous.status());
  expect(await anonymous.text()).not.toContain(customer);
  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(admin);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL('/admin');
  await page
    .getByRole('navigation', { name: 'Administration' })
    .getByRole('link', { name: 'Enquiries', exact: true })
    .click();
  await page.getByRole('link', { name: 'M2 QA visitor', exact: true }).click();
  await expect(page.locator('.enquiry-message')).toHaveText(message);
  expect(
    await page.evaluate(() => Object.prototype.hasOwnProperty.call(window, 'enquiryInjected')),
  ).toBe(false);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.screenshot({
    path: `docs/screenshots/m2-enquiry-${info.project.name}.png`,
    fullPage: true,
  });
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/admin/login');
  await page.getByLabel('Email address').fill(editor);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL('/admin');
  await expect(page.getByRole('link', { name: 'Enquiries', exact: true })).toHaveCount(0);
  const denied = await page.goto(`/admin/enquiries/${enquiry.id}`);
  expect(denied?.status()).toBe(404);
  await expect(page.getByText(customer, { exact: true })).toHaveCount(0);
});
