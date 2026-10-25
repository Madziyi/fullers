import { test, expect } from '@playwright/test';
import { prepareScreenshot } from './capture';
test('homepage is crawlable, responsive and contains only approved proof', async ({
  page,
  request,
}, info) => {
  const response = await request.get('/');
  const html = await response.text();
  expect(response.status()).toBe(200);
  expect(html).toContain('Built on quality.');
  for (const value of ['30+', '700+', '100%']) expect(html).toContain(value);
  for (const excluded of ['Testimonial #1', 'Electrical Repairs', 'Logoipsum'])
    expect(html).not.toContain(excluded);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Explore our products' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await prepareScreenshot(page);
  await page.screenshot({ path: `docs/screenshots/home-${info.project.name}.png`, fullPage: true });
  await page.screenshot({ path: `docs/screenshots/home-${info.project.name}-hero.png` });
});
test('catalogue filters on the server and missing photographs are accessible', async ({
  page,
  request,
}, info) => {
  const html = await (await request.get('/products')).text();
  for (const name of [
    'Quarry Stones',
    'Bricks',
    'Half Moons',
    'Interlocking Pavers',
    'Manhole Rings',
    'Culverts',
    'Durawall',
  ])
    expect(html).toContain(name);
  await page.goto('/products');
  await expect(page.locator('.product-card')).toHaveCount(7);
  await expect(page.getByRole('img', { name: /product photograph not yet available/ })).toHaveCount(
    3,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await prepareScreenshot(page);
  await page.screenshot({
    path: `docs/screenshots/products-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Infrastructure', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Culverts', exact: true })).toBeVisible();
});
test('all seven product routes are rendered and contain unique metadata', async ({ request }) => {
  const titles = new Set<string>();
  for (const slug of [
    'quarry-stones',
    'bricks',
    'half-moons',
    'interlocking-pavers',
    'manhole-rings',
    'culverts',
    'durawall',
  ]) {
    const response = await request.get(`/products/${slug}`);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`/products/${slug}`);
    expect(html).toContain('application/ld+json');
    titles.add(html.match(/<title>(.*?)<\/title>/)?.[1] ?? '');
    expect(html).not.toContain('"price"');
    expect(html).not.toContain('"aggregateRating"');
  }
  expect(titles.size).toBe(7);
  expect((await request.get('/products/does-not-exist')).status()).toBe(404);
});
test('mobile menu, WhatsApp, sitemap and authentication boundaries work', async ({
  page,
  request,
}, info) => {
  await page.goto('/');
  if (info.project.name === 'mobile') {
    await page.getByLabel('Open navigation').click();
    await expect(
      page
        .getByRole('navigation', { name: 'Mobile navigation' })
        .getByRole('link', { name: 'Products', exact: true }),
    ).toBeVisible();
  }
  expect(
    await page.getByRole('link', { name: 'Request a quote on WhatsApp' }).getAttribute('href'),
  ).toMatch(/^https:\/\/wa.me\/263787478592/);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/products/culverts');
  expect(sitemap).not.toContain('/admin');
  expect(sitemap).not.toContain('/projects');
  expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /admin');
  await page.goto('/admin/settings');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.screenshot({
    path: `docs/screenshots/login-${info.project.name}.png`,
    fullPage: true,
  });
  const csrf = await request.post('/api/auth/callback/credentials', {
    form: { email: 'admin@example.test', password: 'bad' },
    maxRedirects: 0,
  });
  expect(csrf.headers()['location']).toContain('csrf=true');
});
