## Context

Today `IPostsDatasource`/`PostsDatasourceImpl` only implement `getPosts()`. The create-post modal (`src/features/create-post/`) is wired up in the UI but its submit handler just resets the form — no request is sent. There is no post detail route, no `getPostById`, no edit/delete UI, and no confirm-dialog primitive anywhere in `src/ui/**`. `PostsList.tsx` renders posts as an inline `<li>` loop with no per-item slot for actions. `ApplicationProvider.tsx` creates the app's `QueryClient` with no `defaultOptions`. See proposal.md for motivation; this covers how the gap gets closed within the existing 8-layer architecture (architecture.md, data-fetching.md, structure.md).

## Goals / Non-Goals

**Goals:**

- Fit every new piece of behavior (create/update/delete/get-by-id) into the existing datasource → usecase → feature → view layering without introducing a new pattern.
- Define the exact slice/segment shape for the new `post-management` feature and the confirm-dialog primitive so implementation doesn't have to improvise structure.
- Decide how the 404 "not found" case is represented across layers.

**Non-Goals:**

- No toast/snackbar or other transient feedback system — the spec only requires the modal to close / navigation to occur on success, nothing else.
- No change to how `PostsList` fetches data beyond decomposing its markup — still one `useGetPosts()` query.
- No optimistic UI or manual cache patching of any kind (explicit non-goal in the source spec, A-001).

## Decisions

### 1. Datasource & usecase surface

`IPostsDatasource` gains `getPostById(id)`, `createPost(payload)`, `updatePost(id, payload)`, `deletePost(id)`. `getPostById` stays a **query** (`createDatasource`) since it's a render-time read for the detail page — data-fetching.md's own documented contract already anticipates `useGetPostById`. `createPost`/`updatePost`/`deletePost` are **use-cases** (`CreatePostCase`, `UpdatePostCase`, `DeletePostCase` in `src/domain/posts/usecases/`), one per mutation, each a thin `execute()` delegating to the datasource — matching the one-usecase-per-action shape already used by `LoginCase`/`LogoutCase`.

No new schema is needed for the single-post shape: `PostModel`/`TPost` (`src/domain/posts/models/Post.ts`) already models one post and is reused as-is for `getPostById`/`createPost`/`updatePost` responses.

_Alternative considered:_ one generic `PostMutationCase` parameterized by an action discriminant — rejected because `createUsecase` binds to a single `execute()` signature per class, and splitting by action keeps each usecase's tests and mocks trivial.

### 2. `PostNotFoundError` wraps the generic HTTP `NotFoundError`

`HttpClientImpl` already auto-throws a generic `NotFoundError` (`src/errors/http/NotFoundError.ts`) for any 404 response. `PostsDatasourceImpl.getPostById`'s error handler catches that generic error and rethrows a new domain-specific `PostNotFoundError` (`src/domain/posts/errors/PostNotFoundError.ts`), the same wrapping pattern already used by `src/domain/auth/errors/InvalidTokenError.ts`. The detail feature branches on `PostNotFoundError` to render the not-found state, never on the raw HTTP error type — keeping HTTP-layer concerns out of Features/Views (architecture.md's "domain-specific business errors belong in the Domain layer").

_Alternative considered:_ have the view catch the generic `NotFoundError` directly — rejected as a layer leak; any other datasource's 404 would look identical to the view with no way to distinguish "post not found" from an unrelated 404.

### 3. One `post-management` feature slice for create, edit, and delete

Replaces `src/features/create-post/` with `src/features/post-management/`:

- **Root (public):** `CreatePost.tsx`, `EditPost.tsx`, `DeletePost.tsx` — three components, one per user-facing action, each wired to its own usecase via `createUsecase` at module top-level.
- **`ui/` (private):** the shared form fields (today's title/body `Form`/`FormTextField` markup) used by both `CreatePost` and `EditPost` (`PostFormFields.tsx`).
- **`hooks/` (private):** `usePostForm({ mode: 'create' | 'edit', post?, onSuccess? })` generalizing today's `useCreatePostForm` to cover both create and edit (edit passes `defaultValues` from the current post and calls `updatePost` instead of `createPost`).

`DeletePost.tsx` wires the base `ConfirmDialog` primitive (decision 4) directly to `DeletePostCase` at its root, rather than through a separate `ui/` composition — at ~30 lines with a single responsibility, a dedicated `ui/` wrapper would just be a pass-through with no second consumer. It's reused as-is by both trigger points (list card, detail page).

This is a valid slice shape per structure.md ("root can expose whatever the feature's public contract needs... several components, multiple root files, one component each") — three root components stay single-responsibility individually while sharing internals through segments, rather than duplicating form/dialog logic across separate slices.

_Alternative considered (from earlier discussion):_ split into a `post-form` slice (create+edit) and a separate `post`/delete-only slice — superseded by consolidating all three actions into one slice, since they share the same post and largely the same tests/mocks.

### 4. Base confirm-dialog UI primitive

New `src/ui/molecules/confirm-dialog/ConfirmDialog.tsx`, built on the existing generic `Modal` (reusing its portal/backdrop/escape/focus behavior), exposing `open`, `onConfirm`, `onCancel`, and message/label props only — no business logic, per ui.md's rule for global `/src/ui/**`. `post-management`'s `ui/` segment owns the actual "which post, which mutation" wiring on top of it; the primitive itself is reusable for any future confirm-before-action need.

### 5. Post detail route & view

New route `app/(domain)/posts/[id]/page.tsx` → `PostDetailView` (`src/views/posts/PostDetailView.tsx`), following the same "page imports view, view composes feature" split as the existing `/posts` route. A new `src/features/post-detail/PostDetail.tsx` feature calls `createDatasource(registry.postsDatasource).useGetPostById([id])`, renders title/body on success, renders the not-found state when the resolved error is `PostNotFoundError`, and hosts the edit/delete triggers that open `post-management`'s `EditPost`/`DeletePost`. `routes.ts`'s static `posts: '/posts'` gets a sibling route-builder (e.g. `postDetail: (id) => \`/posts/${id}\``) since the detail route needs interpolation.

### 6. Posts list decomposition

Extract the inline `<li>` in `PostsList.tsx` into `src/features/posts-list/ui/PostListItem.tsx` (private `ui/` segment), rendering title/body plus edit/delete triggers that open `post-management`'s `EditPost`/`DeletePost` for that post's id/current values.

### 7. Global QueryClient cache disable

`ApplicationProvider.tsx`'s `new QueryClient()` gets `defaultOptions: { queries: { staleTime: 0, refetchOnWindowFocus: false } }`. Every `useGet*` query always refetches instead of serving cached data, so no mutation needs `invalidateQueries`. This is a deliberate, explicitly global change — not scoped to posts — per direct instruction.

`gcTime` is deliberately **not** set to `0`: `staleTime: 0` alone already guarantees every mount triggers a fresh network request, which is the actual goal; `gcTime: 0` would additionally force-evict the cache the instant a query has zero observers, a documented TanStack Query anti-pattern that can thrash retry/observer state without adding anything `staleTime: 0` doesn't already provide.

### 8. Test coverage

Every new or changed component gets a Vitest + RTL behavior test per testing.md's canonical pattern (registry mocked at `@application/di/AppRegistry`, mock factories from `src/data/posts/mock-factories/`, role/name selectors): `CreatePost`/`EditPost`/`DeletePost` (post-management), `PostDetail` (including its not-found state), `PostListItem` (posts-list), and `ConfirmDialog` (ui/molecules). The shared `usePostForm` hook gets a hook test following the `useLoginForm.test.tsx` template. `CreatePostCase`/`UpdatePostCase`/`DeletePostCase` and the `PostNotFoundError` wrapping in `PostsDatasourceImpl.getPostById` get unit tests where their behavior isn't already exercised through a component test (the error-mapping branch is easiest to verify directly on the datasource). The QueryClient `defaultOptions` change (decision 7) needs no new test — it's exercised implicitly by every existing query/mutation test continuing to pass. No Playwright pixel fixtures are added for this change.

## Risks / Trade-offs

- **Global cache disable touches every existing and future query, not just posts** → Accepted deliberately; recorded here and in proposal.md rather than left as an incidental side effect. A future feature that needs caching back can override `staleTime` per-query via `createDatasource`'s `opts` parameter.
- **Replacing `create-post` breaks its one current caller** → `Home.tsx`'s "Создать пост" button import moves from `@features/create-post/CreatePost` to `@features/post-management/CreatePost`; confirmed to be the only current caller.
- **Backend never persists changes (A-001)** → Not a design risk to mitigate; explicitly out of scope to compensate for (no toasts, no optimistic UI, no manual cache writes).
- **Three root components in one slice is a less common shape** → Explicitly permitted by structure.md; each root file stays single-responsibility by delegating shared logic to `ui/`/`hooks/` segments.
