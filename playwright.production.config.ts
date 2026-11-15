import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.production.spec.ts',
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 20000 },
  reporter: [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/production.xml' }]],
  use: {
    baseURL: 'https://www.escolaveli.com',
    actionTimeout: 20000,
    navigationTimeout: 30000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
  },
  projects: [
    { name: 'production-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'production-mobile', use: { ...devices['Pixel 7'] } },
  ],
});
