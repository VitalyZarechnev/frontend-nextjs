# Slice & segment structure

> How `/src/features/**`, `/src/ui/**`, and `/src/application/**` are organised internally: slices, segments, what's public, and how to decompose. Applies to any layer whose folders are self-contained modules.

## TL;DR

- **Slice** = one self-contained module (a feature like `create-post/`, or a UI component like `atoms/button/`). **Segment** = a role-folder inside a slice (`ui/`, `hooks/`, `utils/`).
- **Only files at the slice root are public.** Everything inside a segment is private to that slice. Enforced by ESLint (`import-x/no-restricted-paths`) — outside code importing `@features/x/hooks/…` fails lint.
- **A slice's public API is whatever sits at its root** — one or more components, a hook, exported constants, an event bus, or any mix. A feature is **not always a component** (it can be just a hook).
- **Segments don't nest.** A slice contains segments; a segment contains files, not further segments.
- **Allowed segments:** `ui/` (local components — decomposition of this slice), `hooks/`, `utils/`. Rare custom segments (`variants/`, `tabs/`) are fine when they genuinely fit. **Never** create `components/`, `lib/`, or `libs/`.
- **No `index.ts` barrels.** Import the concrete root file directly (`@features/x/CreatePost`), not a re-export hub.
- **Decompose by responsibility.** No giant files: one component / one hook = one responsibility. One component or hook per file.
- Feature-local `ui/` components **may** contain business logic; global `/src/ui/**` components may **not** (see [ui.md](./ui.md)).

## Slice layout

```
src/features/create-post/          # a slice (feature)
├── CreatePost.tsx                 # PUBLIC — root component (default export)
├── useCreatePost.ts               # PUBLIC — root hook, if the feature exposes one
├── constants.ts                   # PUBLIC — only if root-exported; else keep in utils/
├── ui/                            # PRIVATE segment — local decomposition components
│   └── PostFields.tsx
├── hooks/                         # PRIVATE segment
│   └── useCreatePostForm.ts
└── utils/                         # PRIVATE segment — slice-scoped helpers & constants
    ├── mapPostPayload.ts
    └── constants.ts
```

`src/ui/**` components follow the same idea — the root `Component.tsx` (+ `Component.module.scss`) is public; any `hooks/`, `utils/`, or local `ui/` parts are private. (`transitions/` and `icons/` are flat exceptions — see [ui.md](./ui.md).)

`src/application/**` is public at **two** levels: its own root files (`@application/routes`, `@application/SessionProvider`) **and** the root of each slice within it (`@application/di/AppRegistry`, `@application/authorization/AuthorizationWrapper`). Anything deeper — a slice's inner segments (`@application/di/server-cookies-storage/…`) — is private to that slice.

## Public API — root only

Only root-level files may be imported from outside the slice:

```ts
// ✅ Public root file
import CreatePost from '@features/create-post/CreatePost';
// ❌ Reaching into a private segment — fails import-x/no-restricted-paths
import { useCreatePostForm } from '@features/create-post/hooks/useCreatePostForm';
```

Within the same slice, importing your own segment files is expected and allowed. The rule only blocks **cross-slice** reaches. Design so other code depends on a slice's root, never its internal structure.

### A feature is not always UI

The root can expose whatever the feature's public contract needs:

- a single component (`CreatePost.tsx`);
- several components (multiple root files, one component each — still one component per file);
- just a hook (`features/geo/useGeolocation.ts` — a feature with no UI at all);
- a component **plus** a hook, or a component **plus** exported constants, or an event bus other slices import to send events (see [event-bus.md](./event-bus.md)).

Root files that are hooks (feature-hooks) or components use **`export default`**; root-exported constants use `export const`. Nested hooks stay named. See [code-style.md](./code-style.md#hooks).

## Segments

| Segment  | Holds                                                                                   |
| -------- | --------------------------------------------------------------------------------------- |
| `ui/`    | Local presentational components — decomposition of this slice's own UI.                 |
| `hooks/` | Slice-private hooks (form logic, local state machines). Named exports.                  |
| `utils/` | Slice-scoped helpers and module constants (`utils/constants.ts`, `utils/nodeTypes.ts`). |

- Custom segments (`variants/`, `tabs/`) are acceptable when a slice genuinely has that shape — keep it rare.
- Segments are flat role-folders: they don't contain nested segments.
- **Never** `components/` (use `ui/`), `lib/`, or `libs/`.

## Decomposition & single responsibility

- Keep files small. A large component or hook is a signal to split by **responsibility**, not to add comments or blank-line dividers.
- One hook = one responsibility; one component = one responsibility; one file = one component or one hook (see [code-style.md](./code-style.md)).
- Extract slice-only helpers into that slice's `utils/` segment.
- Extract logic that other slices could reuse into the **global** Utils layer, organised by domain segment (`dom/`, `keyboard/`, `network/`, …). Move it even if it's currently used once (e.g. `useLockBodyScroll`). See [architecture.md](./architecture.md#4-utils-srcutils).

## Anti-patterns

```ts
// ❌ Cross-slice reach into a private segment
import PostFields from '@features/create-post/ui/PostFields';

// ❌ Barrel file re-exporting internals (src/features/create-post/index.ts)
export * from './CreatePost';
```

Forbidden folder shapes — don't create these:

- `features/create-post/components/…` → use the `ui/` segment.
- `features/create-post/lib/…` (or `libs/`) → use the `utils/` segment.
- `features/create-post/ui/hooks/…` → segments don't nest.
- One giant file doing form + list + modal → split by responsibility.

## See also

- [architecture.md](./architecture.md) — the 8 layers and cross-layer dependency rules.
- [ui.md](./ui.md) — UI tiers; global-UI-vs-feature-UI business-logic boundary.
- [forms.md](./forms.md) — a worked example of a feature slice with a `hooks/` segment.
- [event-bus.md](./event-bus.md) — a feature exposing an event bus at its root for cross-feature signals.
- [code-style.md](./code-style.md) — export styles, naming, file/dir casing.
