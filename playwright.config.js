import { defineConfig } from '@playwright/test';

const testPort = process.env.ADMIN_PERF_PORT || '4174';
const testUrl = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: testUrl,
    channel: process.env.ADMIN_BROWSER_CHANNEL || 'msedge',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: process.env.ADMIN_PERF_PRODUCTION_UI === 'true'
      ? `npm run build -- --mode test && npm run preview -- --host 127.0.0.1 --port ${testPort}`
      : 'npm run dev:test',
    url: testUrl,
    reuseExistingServer: process.env.ADMIN_PERF_PRODUCTION_UI !== 'true',
  },
});
