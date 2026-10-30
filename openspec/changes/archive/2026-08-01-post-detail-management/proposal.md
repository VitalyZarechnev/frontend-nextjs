## Why

The posts list is currently read-only: the existing create-post modal doesn't send anything to the backend, and there's no way to open a single post, edit it, or delete it. This closes the full CRUD loop for posts (US-011 / SPEC-011-FE).

## What Changes

- Wire the existing create-post modal to actually `POST` to the backend on submit instead of a no-op reset.
- Add a new `post-management` feature that owns create, edit, and delete flows for a post as one cohesive slice (replacing the current stub `create-post` feature), sharing form UI and a base confirmation-dialog primitive internally.
- Add a post detail page at `/posts/:id` showing title and body, with a "not found" state when the post doesn't exist (backend 404).
- Add `createPost`, `updatePost` (PATCH), `deletePost`, and `getPostById` to the posts datasource/usecase layer (today only `getPosts` exists).
- Add a custom domain error (`PostNotFoundError`) to represent the 404 case distinctly from generic unexpected errors.
- Add a base confirm-dialog UI primitive (none exists today) and reuse it for delete confirmation from both the posts list card and the detail page.
- Decompose the posts list's inline `<li>` markup into a list-item/card component so edit and delete triggers have somewhere to attach.
- Disable caching globally in the QueryClient config (`staleTime`/`gcTime` → 0, `refetchOnWindowFocus: false`) so mutations don't need manual cache invalidation. **Note:** this is a global config change affecting every existing query in the app, not just posts.
- Per source spec (A-001): success of create/edit/delete is defined solely by a successful backend response; the UI is not required to immediately reflect the change in the list or detail page afterward.

## Capabilities

### New Capabilities

- `post-detail-management`: Creating, viewing (single post + not-found state), editing, and deleting a post, including delete confirmation from both the posts list and the post detail page.

### Modified Capabilities

_None — no existing `openspec/specs/` capabilities exist yet in this repo._

## Impact

- `src/domain/posts/` — new `usecases/` (create/update/delete post), extended `IPostsDatasource` (`createPost`, `updatePost`, `deletePost`, `getPostById`), new single-post schema.
- `src/data/posts/` — `PostsDatasourceImpl` gains the new methods; mock factories extended for single-post fetch/mutations.
- `src/errors/` — new `PostNotFoundError`.
- `src/features/create-post/` — replaced by `src/features/post-management/` (root: create/edit/delete entry points; shared form fields and confirm-dialog wiring live in that slice's `ui/` segment).
- `src/features/posts-list/` — decomposed to add a list-item/card component with edit/delete actions.
- `src/ui/molecules/` — new base confirm-dialog primitive.
- `src/views/posts/` — new post detail view; `app/(domain)/posts/[id]/page.tsx` new route.
- `src/application/` — QueryClient default options (global cache disable), route helper for post detail.
- Test coverage across the above per `docs/agents/testing.md` conventions: a Vitest/RTL behavior test is required for every new or changed component and flow (create/edit/delete modals, detail page, not-found state, list-item actions, confirm dialog); unit tests are required for the new domain logic (usecases, `PostNotFoundError` mapping) where behavior isn't already covered by a component test. No new Playwright pixel fixtures required by this spec.
