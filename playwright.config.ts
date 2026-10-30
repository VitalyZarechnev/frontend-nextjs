import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// Default size every screen is captured at. A view whose design frame differs overrides it with
// `test.use({ viewport })` in its own spec — the baseline file name follows automatically.
const DEFAULT_VIEWPORT = { width: 1440, height: 1024 };

export default defineConfig({
  testDir: './src/views',
  testMatch: '**/*.pixel.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  outputDir: './playwright-test-results',
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: './playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]],

  // Baselines are the Figma exports, shared by every browser project, so the path must not
  // include {projectName}.
  snapshotPathTemplate: 'screenshots/{arg}{ext}',

  // Defaults for every screen. Override per screen in its spec:
  //   await expect(page).toHaveScreenshot(screenshotPath(...), { maxDiffPixelRatio: 0.01 });
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.005,
      threshold: 0.1,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  // `viewport` and `deviceScaleFactor` must come after the device preset — the presets carry
  // their own 1280x720 viewport and would otherwise silently replace the design size.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: DEFAULT_VIEWPORT, deviceScaleFactor: 1 } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: DEFAULT_VIEWPORT, deviceScaleFactor: 1 } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: DEFAULT_VIEWPORT, deviceScaleFactor: 1 } },
  ],

  // A production build, on its own port: `next dev` renders a dev-indicator badge that would
  // land in every screenshot, and reusing the developer's :3000 server would do the same.
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
