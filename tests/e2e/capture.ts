import type { Page } from '@playwright/test';
export async function prepareScreenshot(page: Page) {
  for (const img of await page.locator('img').all()) {
    if (!(await img.isVisible())) continue;
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((image: HTMLImageElement) => image.decode().catch(() => undefined));
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}
