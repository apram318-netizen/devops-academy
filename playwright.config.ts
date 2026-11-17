import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const html = pathToFileURL(path.resolve('dist/DevOps-Academy.html')).href;

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  metadata: { html },
});

export { html };
