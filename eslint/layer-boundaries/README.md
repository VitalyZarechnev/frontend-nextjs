# Layer boundaries

Every import rule in this folder answers one question: **is this file allowed to import that file?**

The rules are enforced by [`import-x/no-restricted-paths`](https://github.com/un-ts/eslint-plugin-import-x) plus one local rule in
[`rules/`](./rules). They are derived from the architecture in
[`docs/agents/architecture.md`](../../docs/agents/architecture.md) — this README is the enforcement-level detail: what actually fails
`npm run lint`, and why.

**Files**

| File                       | What it holds                                                        |
| -------------------------- | -------------------------------------------------------------------- |
| [`index.mjs`](./index.mjs) | All zones and the flat-config blocks exported to `eslint.config.mjs` |
| [`rules/`](./rules)        | Local ESLint rules for constraints zones cannot express              |

---

## 1. The layer stack

Imports flow **downward**. A layer may reach for the layers below it, never the ones above.

```
                    ┌──────────────────────────────────────┐
   Next.js routes   │  app/                                │  composes Views
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
   Screens          │  src/views/                          │  composes Features
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
   Business units   │  src/features/                       │  UI + domain logic
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
   Wiring           │  src/application/                    │  DI, providers, session
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
   Dumb components  │  src/ui/                             │  no business logic
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
   Data access      │  src/data/                           │  datasources, HTTP, storage
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
   Core             │  src/domain/                         │  models, stores, use-cases
                    └──────────────────────────────────────┘
                    ┌──────────────────────────────────────┐
   Leaves           │  src/utils/        src/errors/       │  importable by (almost) everyone
                    └──────────────────────────────────────┘
```

`src/ui` sits beside `src/data`/`src/domain` rather than above them: it is a leaf of its own, allowed to import only `@utils`.

## 2. Who may import whom

Read a row as _"a file in this layer may import…"_.

✅ allowed · ❌ ESLint error · ⚠️ allowed on purpose but discouraged

| importer ↓ / target → | `@views` | `@features` | `@application` | `@ui` | `@data` | `@domain` | `@utils` | `@errors` | `@app` |
| --------------------- | -------- | ----------- | -------------- | ----- | ------- | --------- | -------- | --------- | ------ |
| **`app/`**            | ✅       | ❌ \*       | ✅             | ✅    | ❌      | ⚠️        | ✅       | ✅        | ✅     |
| **`src/views`**       | ✅       | ✅          | ✅             | ✅    | ❌      | ❌        | ✅       | ✅        | ❌     |
| **`src/features`**    | ❌       | ✅          | ✅             | ✅    | ❌ †    | ✅        | ✅       | ✅        | ❌     |
| **`src/application`** | ❌       | ❌          | ✅             | ✅    | ✅      | ✅        | ✅       | ✅        | ❌     |
| **`src/ui`**          | ❌       | ❌          | ❌             | ✅    | ❌      | ⚠️        | ✅       | ❌        | ❌     |
| **`src/data`**        | ❌       | ❌          | ❌             | ❌    | ✅      | ✅        | ✅       | ✅        | ❌     |
| **`src/domain`**      | ❌       | ❌          | ❌             | ❌    | ❌      | ✅        | ✅       | ✅        | ❌     |
| **`src/utils`**       | ❌       | ❌          | ❌             | ❌    | ❌      | ❌        | ✅       | ✅        | ❌     |
| **`src/errors`**      | ❌       | ❌          | ❌             | ❌    | ❌      | ❌        | ❌       | ✅        | ❌     |

\* See [§4 — app-shell exceptions](#4-app-shell-exceptions). † Relaxed in feature tests, see [§5](#5-per-file-relaxations).

⚠️ `app/` importing `@domain` is not blocked, but a route reaching into domain models usually means logic that belongs in a feature.
`@ui` may import Domain enums/models in rare, explicitly justified cases.

**The `@app` column is one-way.** Routes reach into `src`, never the reverse: route files are Next.js entry points, not a public API.
Nothing under `src` may import `@app/*` — not a view, not a test, not a helper. (The one place this is not enforced is `*.pixel.ts`,
which switches every cross-layer zone off; see [§5](#5-per-file-relaxations).)

`src/assets` and `pixel-perfect` are outside the layer graph and importable from anywhere.

## 3. Encapsulation: import roots, not internals

Features, UI components, and application slices each have a **public API at their root**. Anything nested deeper is private —
generated automatically for every directory present on disk, so a new feature is covered the moment you create it.

```
src/features/posts-list/
├── PostsList.tsx        ← ✅ public: @features/posts-list/PostsList
└── ui/
    └── PostListItem.tsx ← ❌ private: @features/posts-list/ui/PostListItem
```

| Area                             | Public                      | Private                                      |
| -------------------------------- | --------------------------- | -------------------------------------------- |
| `src/features/<feature>/`        | files at the feature root   | anything one level deeper (`<feature>/*/**`) |
| `src/ui/<category>/<component>/` | files at the component root | anything one level deeper                    |
| `src/application/<slice>/`       | files at the slice root     | anything one level deeper                    |

This applies to **every** importer, including sibling features and sibling UI components. Inside its own directory, a feature may
freely import its own internals.

## 4. App-shell exceptions

The baseline is: `app/` composes Views and never imports Features. Two exceptions exist so app-shell features (header, footer, nav)
don't have to be wrapped in a fake view.

| Next.js file                                                 | Role                     | May import Features?                    |
| ------------------------------------------------------------ | ------------------------ | --------------------------------------- |
| `layout.tsx`, `template.tsx`                                 | wraps its children       | ✅ freely                               |
| `page.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx` | **is** a screen          | ✅ only if the same file imports a View |
| `route.ts`, everything else under `app/`                     | request handlers, config | ❌ never                                |

✅ A shell file may be nothing but features:

```text
// app/(domain)/layout.tsx
import AppFooter from '@features/app-footer/AppFooter';
```

✅ A screen may carry a shell feature next to the view it renders:

```text
// app/(domain)/posts/page.tsx
import AppFooter from '@features/app-footer/AppFooter';

import PostsView from '@views/posts/PostsView';
```

❌ A screen assembled out of features _is_ a view — move that composition into `@views`:

```text
// app/(domain)/posts/page.tsx
import PostsHeader from '@features/posts-list/PostsHeader';
import PostsList from '@features/posts-list/PostsList';
```

The conditional case cannot be expressed as a path zone, so it lives in
[`rules/app-page-feature-requires-view.mjs`](./rules/app-page-feature-requires-view.mjs). The rule counts static imports,
re-exports, and dynamic `import()` alike; if a screen file imports at least one `@views/*` module, its feature imports are accepted.

## 5. Per-file relaxations

| Files                                            | Change                                                            | Why                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------- |
| `src/features/**/*.{test,spec}.ts(x)`            | May import `@data` (mock factories). Views still blocked.         | Tests need the Data layer's mock factories.              |
| `**/*.pixel.ts`                                  | All cross-layer zones off. Encapsulation (§3) still enforced.     | A pixel spec sits next to its view but drives mock data. |
| `app/**/layout.tsx`, `template.tsx`              | Features unblocked, see §4.                                       | Shell features have no view to live in.                  |
| `app/**/{page,error,global-error,not-found}.tsx` | Features unblocked, then re-restricted by the local rule, see §4. | A screen may carry shell features next to its view.      |

Relaxations are **replacements**, not additions: each flat-config block re-declares the full zone list it wants, so a relaxation
never silently disables a rule the block did not name.

## 6. Not a path rule, but enforced here too

`reactQueryBoundariesConfig` bans `useQuery` / `useMutation` / `useSuspenseQuery` / `useInfiniteQuery` imported straight from
`@tanstack/react-query` outside `src/utils`. Use `createDatasource` / `createUsecase` from `@utils` instead — see
[`docs/agents/data-fetching.md`](../../docs/agents/data-fetching.md).

## 7. Working on these rules

- Zones are plain data; the exported flat-config blocks in [`index.mjs`](./index.mjs) pick which zones apply to which files.
  Order matters in `eslint.config.mjs`: relaxations must come **after** `layerBoundariesConfig`.
- `target` is the **importer**, `from` is the **importee**. Easy to get backwards; the zone `message` is written from the
  importer's point of view.
- Check what a given file actually gets:

```bash
npx eslint --print-config app/\(domain\)/page.tsx
```

- To verify a change, write a throwaway file that should fail, lint it, then delete it. `npx eslint .` must stay clean.
