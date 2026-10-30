import { Page } from '@playwright/test';

export function screenshotPath(page: Page, view: string, state: string): string[] {
  const viewport = page.viewportSize();

  if (!viewport) {
    throw new Error('Pixel-perfect tests require a fixed viewport');
  }

  return [view, `${state}--${viewport.width}x${viewport.height}.png`];
}
