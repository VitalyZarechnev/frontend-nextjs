import { expect, test } from '@playwright/test';

import { CURRENT_USER, mockCurrentUser } from '@data/users/mock-factories/user';

import { screenshotPath } from '@pixel-perfect/screenshotPath';
import { waitForStableRender } from '@pixel-perfect/waitForStableRender';

const VIEW = 'interview-success';

test.describe(VIEW, () => {
  // The Figma frame size for this screen — it decides the `--1440x1024` in the baseline name.
  test.use({ viewport: { width: 1440, height: 1024 } });

  test('main', async ({ page }) => {
    await mockCurrentUser(page);
    await page.goto(`/${VIEW}`);

    await expect(page.getByText(CURRENT_USER.displayName)).toBeVisible();
    await waitForStableRender(page);

    await expect(page).toHaveScreenshot(screenshotPath(page, VIEW, 'main'));
  });
});
