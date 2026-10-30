# Pixel-perfect testing

> Playwright screenshot tests that compare a rendered screen against the **Figma frame export** committed as its baseline. Their purpose is **appearance, not UI e2e coverage** — behaviour is Vitest's job ([testing.md](./testing.md)). Interaction appears here only to reach a state worth capturing.

## TL;DR

- Runner: **Playwright** (`npm run test:pixel`). A spec lives **next to its view**: `src/views/<view>/<ViewName>.pixel.ts`.
- **Baselines are the design, not our output** — the Figma frame export, committed as `screenshots/<view>/<state>--<width>x<height>.png`.
- Shared helpers live in **`/pixel-perfect`**, one function per file, imported via `@pixel-perfect/*`.
- **Route mocks and fixtures live in the Data layer** (`src/data/<entity>/mock-factories/`), never inline in a spec.
- Runs in **chromium, firefox and webkit**, all against the same baseline.
- Viewport and tolerances have defaults in `playwright.config.ts` and are **overridable per screen**.
- Add tests for a screen with **`/pixel-perfect-view <view-name> <state>=<figma-frame-url>…`** — one `state=url` pair per screen state; the state you pass becomes the baseline's file name.
- **Their purpose is appearance, not e2e coverage.** Behaviour is Vitest's job. Interaction is allowed here only as the _route_ to a state worth photographing — see [Reaching a state](#reaching-a-state).

## Why

A layout regression rarely breaks a unit test: the component still renders, the hook still returns, `tsc` is happy — the button is just 8px off.

Baselining against the **Figma export** rather than our own screenshot is what makes this "pixel-perfect" instead of merely "unchanged": a self-produced baseline only proves the screen still looks like it did when it was taken, even if it never matched the design. jsdom snapshots can't replace this — jsdom neither lays out nor paints.

## Layout

```
screenshots/                              # committed Figma exports, one folder per view
├── interview-success/
│   └── main--1440x1024.png               # <state>--<width>x<height>.png
└── login/
    ├── main--1440x1024.png
    └── wrong-username-or-password--1440x1024.png
pixel-perfect/                            # shared helpers, one function per file
├── screenshotPath.ts
└── waitForStableRender.ts
src/views/interview-success/
├── InterviewSuccessView.tsx
└── InterviewSuccessView.pixel.ts         # the spec, next to its view
playwright.config.ts                      # projects, default viewport + tolerances, web server
```

- **`<view>`** matches the folder in `/src/views`.
- **`<state>`** is the state captured: `main`, `empty`, `loading`, `wrong-username-or-password`.
- **`<width>x<height>`** comes from the live viewport via `screenshotPath()`, so the name can never disagree with the size it was taken at.

## Pattern

```ts
// src/views/interview-success/InterviewSuccessView.pixel.ts
import { expect, test } from '@playwright/test';

import { CURRENT_USER, mockCurrentUser } from '@data/users/mock-factories/user';

import { screenshotPath } from '@pixel-perfect/screenshotPath';
import { waitForStableRender } from '@pixel-perfect/waitForStableRender';

const VIEW = 'interview-success';

test.describe(VIEW, () => {
  test.use({ viewport: { width: 1440, height: 1024 } }); // the Figma frame size

  test('main', async ({ page }) => {
    await mockCurrentUser(page); // must be registered BEFORE goto
    await page.goto(`/${VIEW}`);

    await expect(page.getByText(CURRENT_USER.displayName)).toBeVisible();
    await waitForStableRender(page);

    await expect(page).toHaveScreenshot(screenshotPath(page, VIEW, 'main'));
  });
});
```

Four rules keep a run from flaking:

1. **Register route mocks before `page.goto`** — a request fired during hydration can't be intercepted afterwards.
2. **Assert the mocked data is visible before capturing** — that's what proves the fetch resolved; capturing earlier photographs an empty screen.
3. **Await `waitForStableRender`** (waits on `document.fonts.ready`) — otherwise a screenshot can catch fallback-font text.
4. **Never capture animations, carets or time-dependent content.** The config disables the first two; anything else must be mocked.

## Reaching a state

These specs are **not** UI e2e tests — they exist to photograph a screen, not to prove a flow works. But plenty of states can only be _reached_ through the UI: a validation error, an expanded panel, a submitted form. Driving the UI to get there is expected; what stays out is coverage of the behaviour itself.

The line: **interaction is the route, the screenshot is the assertion.** The only non-visual `expect` a pixel spec needs is the one proving the state arrived before capturing.

```ts
// src/views/login/LoginView.pixel.ts
test('wrong-username-or-password', async ({ page }) => {
  await mockLoginFailure(page); // from the Data layer, like every other mock
  await page.goto(`/${VIEW}`);

  // Interaction only to arrive at the state — not the thing under test.
  await page.getByLabel('Email').fill(CREDENTIALS.email);
  await page.getByLabel('Пароль').fill(CREDENTIALS.wrongPassword);
  await page.getByRole('button', { name: 'Войти' }).click();

  // The state has arrived; now capture it.
  await expect(page.getByText('Неверный логин или пароль')).toBeVisible();
  await waitForStableRender(page);

  await expect(page).toHaveScreenshot(screenshotPath(page, VIEW, 'wrong-username-or-password'));
});
```

What belongs in a Vitest UI test instead: that the resolver rejects a malformed email, that submit fires the use-case once, that the field clears on retry. If a pixel spec starts asserting those, the flow is being covered twice — and the slower, flakier copy is this one.

## Mocks live in the Data layer

A screen reads server data through the data layer ([data-fetching.md](./data-fetching.md)), so its test double belongs beside the factory that builds the entity:

```ts
// src/data/users/mock-factories/user.ts
export const createUser = createSchemaFactory(UserModel, { ... });

// Reuse the factory; pin only the field the screenshot renders.
export const CURRENT_USER: TUser = createUser({ displayName: 'Иван Иванов' });

export async function mockCurrentUser(page: Page): Promise<void> {
  await page.route('**/users/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CURRENT_USER) }),
  );
}
```

The payload must satisfy the Zod model the datasource parses it with, or `createModel` throws and the screen never renders. The spec asserts against the **same exported fixture** it mocked with, so expected text and mock can't drift apart.

## Per-screen overrides

`playwright.config.ts` holds the defaults — viewport `1440x1024`, `maxDiffPixelRatio: 0.005`, `threshold: 0.1`. Override either per screen:

```ts
// size: the name follows automatically → screenshots/dashboard/main--1920x1080.png
test.use({ viewport: { width: 1920, height: 1080 } });

// tolerance: nearest wins
await expect(page).toHaveScreenshot(screenshotPath(page, VIEW, 'main'), {
  maxDiffPixelRatio: 0.01, // a text-dense screen rasterizes further from Figma
});
```

- **`threshold`** — how different one pixel's colour must be to count (0–1); absorbs antialiasing.
- **`maxDiffPixelRatio`** — what share of the image may differ before failing.

**One state, several sizes.** `test.use` only works at file or `describe` scope — never inside a `test()` — so group by size: one `describe` per viewport, holding the states captured at it. The same state can appear in each; the size in the file name keeps the baselines apart.

```ts
const VIEW = 'dashboard';
const captureMain = async (page: Page) => {
  await page.goto(`/${VIEW}`);
  await waitForStableRender(page);
  await expect(page).toHaveScreenshot(screenshotPath(page, VIEW, 'main'));
};

test.describe(`${VIEW} desktop`, () => {
  test.use({ viewport: { width: 1440, height: 1024 } });
  test('main', ({ page }) => captureMain(page)); // → main--1440x1024.png
});

test.describe(`${VIEW} mobile`, () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test('main', ({ page }) => captureMain(page)); // → main--375x812.png
});
```

Only loosen after looking at the diff in `playwright-report` and confirming it's rasterization, not a real mismatch — and say what you measured. To get the true number, temporarily set `maxDiffPixelRatio: 0` and read the count Playwright reports.

## Anti-patterns

```ts
// ❌ Screenshotting against `next dev` (dev-indicator badge) or the developer's :3000 (stale build)

// ❌ Overwriting a Figma baseline with our own render to make a run pass

// ❌ Capturing before the mocked data lands, or mocking after navigation
await page.goto('/interview-success');
await mockCurrentUser(page);

// ❌ Turning a pixel spec into an e2e test: asserting the request payload, that submit fired once,
//    that a field cleared. Interacting to REACH a state is fine; re-covering the flow is not.

// ❌ A fixture inlined in the spec instead of the Data layer
const user = { id: 1, displayName: 'Иван Иванов' }; // use @data/users/mock-factories/user

// ❌ Hardcoding the size in the name — it silently lies when the viewport changes
await expect(page).toHaveScreenshot(['interview-success', 'main--1440x1024.png']);
// ✅ screenshotPath(page, VIEW, 'main')
```

## Notes

- Output folders are `playwright`-prefixed and gitignored (`playwright-report/`, `playwright-test-results/`). The `/screenshots` baselines **are** committed.
- `npm run test:pixel` prints `"next start" does not work with "output: standalone"` — benign; the build is served correctly.
- The web server is reused between local runs; if a diff looks impossibly clean after a code change, stop the leftover server on :3100 so the next run rebuilds.
- Browsers are installed per machine: `npx playwright install chromium firefox webkit`.

## See also

- [testing.md](./testing.md) — the Vitest suite and the mock-factory rules.
- [figma.md](./figma.md) — transferring a design precisely enough to pass a pixel test.
- [.claude/commands/pixel-perfect-view.md](../../.claude/commands/pixel-perfect-view.md) — what the command does.
- Source: `playwright.config.ts`, `/pixel-perfect`, `/screenshots`, `src/views/**/*.pixel.ts`.
