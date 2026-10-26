import { test, expect } from '@playwright/test';
import { createPrismaClient } from '../../src/lib/prisma-client';
import { hash } from 'bcryptjs';
import { randomUUID, createHash } from 'node:crypto';
const db = createPrismaClient();
const token = randomUUID();
const email = `pages-projects-${token}@example.test`;
const password = randomUUID();
const pageSlug = `qa-page-${token.slice(0, 8)}`;
const projectSlug = `qa-work-${token.slice(0, 8)}`;
let pageId: string | null = null;
let projectId: string | null = null;

test.afterAll(async () => {
  if (process.env.CONTENT_SOURCE === 'database') {
    const savedPage = pageId
      ? { id: pageId }
      : await db.pageContent.findUnique({ where: { slug: pageSlug }, select: { id: true } });
    if (savedPage) pageId = savedPage.id;
    if (pageId) {
      await db.auditLog.deleteMany({ where: { entity: 'PageContent', entityId: pageId } });
      await db.pageContent.deleteMany({ where: { id: pageId } });
    }
    const savedProject = projectId
      ? { id: projectId }
      : await db.project.findUnique({ where: { slug: projectSlug }, select: { id: true } });
    if (savedProject) projectId = savedProject.id;
    if (projectId) {
      await db.auditLog.deleteMany({ where: { entity: 'Project', entityId: projectId } });
      await db.project.deleteMany({ where: { id: projectId } });
    }
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.auditLog.deleteMany({ where: { actorId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
    await db.loginThrottle.deleteMany({
      where: { key: createHash('sha256').update(email).digest('hex') },
    });
  }
  await db.$disconnect();
});

test('pages publish structured content and projects require approval and return to private draft after edits', async ({
  page,
}) => {
  test.skip(process.env.CONTENT_SOURCE !== 'database', 'Requires migrated PostgreSQL.');
  await db.user.create({
    data: {
      email,
      name: 'Pages and projects QA',
      role: 'ADMIN',
      passwordHash: await hash(password, 12),
    },
  });
  await page.goto('/admin/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in →' }).click();
  await expect(page).toHaveURL('/admin');

  const pageTitle = `QA page ${token.slice(0, 8)}`;
  await page.goto('/admin/pages/new');
  await page.getByLabel('Title', { exact: true }).fill(pageTitle);
  await page.getByLabel('URL slug').fill(pageSlug);
  await page.locator('[name="sectionHeading0"]').fill('A useful heading');
  await page
    .locator('[name="sectionBody0"]')
    .fill('A short verified content section for checking page publication.');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page).toHaveURL(/\/admin\/pages\/c[a-z0-9]{20,}$/);
  pageId = page.url().split('/').pop()!;
  await expect(page.getByRole('heading', { name: pageTitle })).toBeVisible();
  await page.getByRole('button', { name: 'Publish / approve' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Page published' })).toBeVisible();
  await page.goto(`/pages/${pageSlug}`);
  await expect(page.getByRole('heading', { name: pageTitle })).toBeVisible();

  const projectTitle = `QA work ${token.slice(0, 8)}`;
  await page.goto('/admin/projects/new');
  await page.getByLabel('Project title').fill(projectTitle);
  await page.getByLabel('URL slug').fill(projectSlug);
  await page
    .getByLabel('Challenge')
    .fill('A verified challenge description used only in this temporary browser fixture.');
  await page
    .getByLabel('Fullers’ solution')
    .fill('A verified solution description used only in this temporary browser fixture.');
  await page.getByRole('button', { name: 'Save private draft' }).click();
  await expect(page).toHaveURL(/\/admin\/projects\/c[a-z0-9]{20,}$/);
  projectId = page.url().split('/').pop()!;
  await page.getByRole('button', { name: 'Approve and publish' }).click();
  await expect(page.getByRole('status')).toContainText('Project approved and published');
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: `docs/screenshots/m3-project-editor-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.goto(`/projects/${projectSlug}`);
  await expect(page.getByRole('heading', { name: projectTitle })).toBeVisible();
  await page.goto(`/admin/projects/${projectId}`);
  await page
    .getByLabel('Fullers’ solution')
    .fill('An updated private draft that must not remain in the public project listing.');
  await page.getByRole('button', { name: 'Save private draft' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved privately' })).toBeVisible();
  await page.goto(`/projects/${projectSlug}`);
  await expect(page.getByText('We couldn’t find that page.')).toBeVisible();
});
