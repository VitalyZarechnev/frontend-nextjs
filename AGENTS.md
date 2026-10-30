# Project Spec — frontend-nextjs

Spec for humans and AI agents working in this repo. **Read all of this file before making changes.** Topic-scoped deep references live in [`docs/agents/`](./docs/agents/).

## Critical rules (apply everywhere)

- **No direct `useQuery` / `useMutation` from `@tanstack/react-query`** in components — always go through `createDatasource(...)` (queries) and `createUsecase(...)` (mutations). Details: [docs/agents/data-fetching.md](./docs/agents/data-fetching.md).
- **No business logic in `/src/ui/**`\*\* — UI is dumb atoms/molecules. Details: [docs/agents/ui.md](./docs/agents/ui.md).
- **Dependency direction is one-way** (Domain ← Data ← Application/Features). Domain imports from nothing. Details: [docs/agents/architecture.md](./docs/agents/architecture.md).
- **SCSS modules only, `@use` not `@import`** — shared partials live in `/src/assets/` and resolve via the `@assets/*` alias. Details: [docs/agents/styling.md](./docs/agents/styling.md).
- **`'use client'` only when needed** (interactivity, browser APIs, hooks). Default to React Server Components.
- **Import only a slice's root** — never reach into the inner segments (`hooks/`, `ui/`, `utils/`, …) of a feature, UI component, or application slice. Public surface is: a feature/UI-component root, plus the application root and its slice roots. Enforced by ESLint. Details: [docs/agents/structure.md](./docs/agents/structure.md).
- **Zero comments by default** — code speaks for itself. No JSDoc, no TODOs, no label/divider comments, no restating the line below. Write one only when a reader who fully understands the code could still break it, or when asked. **Re-read your diff before finishing and delete every comment that doesn't clear that bar.** Details: [docs/agents/code-style.md](./docs/agents/code-style.md).
- **Path aliases everywhere:** `@app`, `@application`, `@assets`, `@data`, `@domain`, `@errors`, `@features`, `@pixel-perfect`, `@ui`, `@utils`, `@views`. Defined in `tsconfig.json` + `next.config.ts`. Never use deep relative imports (`../../../`).

## Architecture at a glance

8 layers in `/src`: **Domain → Data → Application / Utils / UI / Features / Views / Errors**. Dependencies flow inward toward Domain. Use-cases orchestrate datasources; components invoke use-cases via `createUsecase`. App routes compose **views**; views compose **features**.

Full rules and data-flow diagram: [docs/agents/architecture.md](./docs/agents/architecture.md).

## When you're touching X, also read Y

| Touching…                                      | Required reading                                                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Any `*.{ts,tsx}`                               | [code-style.md](./docs/agents/code-style.md)                                                                                                         |
| `/src/data/**` or `/src/domain/**/usecases/**` | [data-fetching.md](./docs/agents/data-fetching.md), [architecture.md](./docs/agents/architecture.md)                                                 |
| `/src/ui/**`                                   | [ui.md](./docs/agents/ui.md), [structure.md](./docs/agents/structure.md), [styling.md](./docs/agents/styling.md), [icons.md](./docs/agents/icons.md) |
| `/src/features/**`                             | [architecture.md](./docs/agents/architecture.md), [structure.md](./docs/agents/structure.md), [data-fetching.md](./docs/agents/data-fetching.md)     |
| `/src/views/**` or `/app/**/page.tsx`          | [architecture.md](./docs/agents/architecture.md)                                                                                                     |
| Adding a slice/segment or deciding public API  | [structure.md](./docs/agents/structure.md)                                                                                                           |
| Building or changing a form                    | [forms.md](./docs/agents/forms.md), [ui.md](./docs/agents/ui.md)                                                                                     |
| Cross-feature communication / events           | [event-bus.md](./docs/agents/event-bus.md), [structure.md](./docs/agents/structure.md)                                                               |
| Implementing a design / from Figma             | [figma.md](./docs/agents/figma.md), [ui.md](./docs/agents/ui.md), [styling.md](./docs/agents/styling.md)                                             |
| `/src/errors/**`, or throwing/handling errors  | [errors.md](./docs/agents/errors.md)                                                                                                                 |
| Any `*.scss`                                   | [styling.md](./docs/agents/styling.md)                                                                                                               |
| Any `*.svg` in `/src/ui/icons`                 | [icons.md](./docs/agents/icons.md)                                                                                                                   |
| Any `*.test.{ts,tsx}`                          | [testing.md](./docs/agents/testing.md)                                                                                                               |
| `*.pixel.ts`, `/screenshots`, `/pixel-perfect` | [testing-pixel-perfect.md](./docs/agents/testing-pixel-perfect.md)                                                                                   |
| `next.config.ts`, alias resolution             | [styling.md](./docs/agents/styling.md) (webpack + Turbopack alias mirroring)                                                                         |

## Quick commands

```
npm run dev            # local dev (Turbopack)
npm run tsc            # type check (no emit)
npm run eslint:check   # lint (must be clean)
npm run eslint         # lint with --fix
npm run prettier:check # formatting check
npm test               # vitest run (CI mode)
npm run test:watch     # vitest watch
npm run test:pixel     # playwright screenshot tests (chromium, firefox, webkit)
npm run build          # production build
```

CI gate: `tsc` + `eslint:check` + `test` + `build` must all be green.

## Stack snapshot (verify against `package.json`)

- **Framework:** Next.js 16 (App Router, Turbopack).
- **React:** 19 + React Compiler (`eslint-plugin-react-compiler` enforces stability rules).
- **Server state:** `@tanstack/react-query` v5, wrapped by `createDatasource` / `createUsecase`.
- **Forms:** `react-hook-form` + Zod resolvers, wrapped by form molecules under `src/ui/molecules/form/`. Pattern: [docs/agents/forms.md](./docs/agents/forms.md).
- **Local domain state:** MobX (pure stores, see [architecture.md](./docs/agents/architecture.md)).
- **Styling:** SCSS modules + shared partials under `@assets/*`. No CSS-in-JS, no MUI/Chakra.
- **Testing:** Vitest 4 + jsdom + `@testing-library/react`.
- **Lint:** ESLint 10 (flat config in `eslint.config.mjs`).
- **Node:** ≥ 22.22.3 (enforced via `engines`).

## How to update this spec

- Critical rules + the trigger→reading table + the quick commands go in **this file**.
- Anything deeper goes in [`docs/agents/<topic>.md`](./docs/agents/) following the template documented in [docs/agents/README.md](./docs/agents/README.md).
- Keep this file ≤ 200 lines. If it grows past that, promote sections into new topic files.
