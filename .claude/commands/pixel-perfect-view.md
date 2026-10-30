---
description: Add pixel-perfect Playwright tests for one view from its Figma frames
argument-hint: <view-name> <state>=<figma-frame-url> [<state>=<figma-frame-url>...]
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Skill, mcp__plugin_figma_figma__get_metadata, mcp__plugin_figma_figma__download_assets, mcp__plugin_figma_figma__get_design_context
---

# Add pixel-perfect tests for a view

Arguments: `$ARGUMENTS` — the first token is the **view name** (a folder in `src/views`); every remaining token is a **`<state>=<figma-frame-url>`** pair. One frame = one screen state, and the `<state>` you are given becomes the baseline's file name.

```
/pixel-perfect-view login main=https://figma.com/design/KEY/File?node-id=1-2 wrong-username-or-password=https://figma.com/design/KEY/File?node-id=1-9
```

Parse each pair by splitting on the **first `=` only** — a Figma URL contains `=` in its own query string (`?node-id=1-2`). A bare URL with no `<state>=` prefix is only acceptable when it is the single frame given; treat it as `main`. If several bare URLs arrive, stop and ask which state each one is.

Keep the pairs as a **list, not a map**: the same `<state>` may legitimately repeat, pointing at the responsive variants of one state. Since the size is part of the file name, `main=<desktop-frame> main=<mobile-frame>` yields two distinct baselines:

```
/pixel-perfect-view dashboard main=<1440x1024-frame> main=<375x812-frame>
→ screenshots/dashboard/main--1440x1024.png
→ screenshots/dashboard/main--375x812.png
```

Read [docs/agents/testing-pixel-perfect.md](../../docs/agents/testing-pixel-perfect.md) before starting; it owns the conventions this command automates.

## Steps

1. **Validate the input.** The view folder `src/views/<view-name>/` must exist and be reachable on a route — find the `app/**/page.tsx` that renders it. If the view or its route does not exist, stop and say so; this command adds tests to an existing screen, it does not implement one. If a frame URL has no `node-id`, ask for a node-specific link. A repeated `<state>` is fine as long as the frames differ in size; reject only when **state _and_ size** match, since those two frames would write the same baseline file.

2. **Per frame, read the design.** Extract `fileKey` and `nodeId` from the URL, then call `get_metadata` to get the frame's **exact `width`/`height`** and its **name**. Do not guess the size — the baseline must be captured at the frame's own dimensions.

3. **Use the given state name.** The `<state>` from the argument is authoritative — do not rename it to something you consider tidier, and never fall back to the Figma layer name (they are often Russian, or `Frame 427`). Only if a state was omitted for the single-frame case do you use `main`. Reject a `<state>` that is not kebab-case, and say why.

4. **Download each frame as the baseline.** `download_assets` with `defaultFormat: 'png'` and `defaultScale: 1`, then `curl` the `export.url` to:

   ```
   screenshots/<view-name>/<state>--<width>x<height>.png
   ```

   Verify each file with `file <path>` — the reported pixel size **must** equal the frame size from step 2. These images are the design contract; never generate them from our own render.

5. **Write the spec** at `src/views/<view-name>/<ViewName>.pixel.ts` — one `test()` per state, **named exactly after the state**, so the test name, the baseline file and the Figma frame all read the same.
   - Follow the doc's pattern: register data mocks **before** `page.goto`, assert the state is on screen, `await waitForStableRender(page)`, then `toHaveScreenshot(screenshotPath(page, VIEW, state))`.
   - Add `test.use({ viewport: { width, height } })` with the frame size from step 2 — even when it matches the config default, so the spec states which frame it was written against.
   - **Group by size:** `test.use` only works at file or `describe` scope, never inside a `test()`. So one `describe` per viewport size, each holding the states captured at that size. A state that exists at two sizes appears once per `describe`, with the same test name in both — the size in the file name keeps the baselines apart.
   - **A state that only exists after interaction** (a validation error, an opened panel) must be reached by driving the UI — fill the form, click submit, wait for the state, then capture. Interaction is the route, the screenshot is the assertion; do not add behavioural assertions. See "Reaching a state" in the doc.
   - Reuse existing mocks from `src/data/**/mock-factories/`. If a needed mock does not exist, add it there (never inline a fixture in the spec).

6. **Run it and report honestly.** `npm run test:pixel`. If a state fails, open `playwright-report` and read the actual diff:
   - **Our implementation is wrong** → fix the component/styles, never the baseline.
   - **The diff is only text antialiasing** → raise that one assertion's `maxDiffPixelRatio`/`threshold` locally, and say by how much and why.
   - Never delete or overwrite a downloaded baseline to make a run green.

7. **Summarise:** every state added with its resolution, any per-state tolerance override with the measured diff that justified it, and anything that looked off in the design (missing states, colours with no token).
