import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('public pages and sign-in have no automated WCAG A/AA violations', async ({ page }) => {
  for (const path of ['/', '/products', '/products/culverts', '/admin/login']) {
    await page.goto(path);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations,
      `${path}: ${JSON.stringify(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
    ).toEqual([]);
  }
});
