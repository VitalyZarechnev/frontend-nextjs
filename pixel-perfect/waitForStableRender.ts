import { Page } from '@playwright/test';

export async function waitForStableRender(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
}
