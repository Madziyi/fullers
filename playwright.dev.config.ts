import { defineConfig, devices } from '@playwright/test';
const origin = 'http://127.0.0.1:3119';
export default defineConfig({
  testDir: './tests/dev',
  workers: 1,
  timeout: 60000,
  use: { baseURL: origin, trace: 'retain-on-failure' },
  projects: [{ name: 'development', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3119',
    url: `${origin}/admin/login`,
    reuseExistingServer: false,
    timeout: 120000,
    env: { NEXT_BUILD_DIR: '.next-review', NEXTAUTH_URL: origin, NEXT_PUBLIC_SITE_URL: origin },
  },
});
