## 1. Domain layer — errors, schema reuse, usecases

- [x] 1.1 Add `PostNotFoundError` at `src/domain/posts/errors/PostNotFoundError.ts`, wrapping the generic `NotFoundError` (mirroring `src/domain/auth/errors/InvalidTokenError.ts`).
- [x] 1.2 Extend `IPostsDatasource` (`src/domain/posts/datasources/IPostsDatasource.ts`) with `getPostById(id)`, `createPost(payload)`, `updatePost(id, payload)`, `deletePost(id)`.
- [x] 1.3 Add `CreatePostCase` (`src/domain/posts/usecases/CreatePostCase.ts`), delegating to `IPostsDatasource.createPost`.
- [x] 1.4 Add `UpdatePostCase` (`src/domain/posts/usecases/UpdatePostCase.ts`), delegating to `IPostsDatasource.updatePost`.
- [x] 1.5 Add `DeletePostCase` (`src/domain/posts/usecases/DeletePostCase.ts`), delegating to `IPostsDatasource.deletePost`.
- [x] 1.6 Unit test `CreatePostCase`/`UpdatePostCase`/`DeletePostCase` — each `execute()` delegates to the corresponding datasource method with the right arguments.

## 2. Data layer — datasource implementation

- [x] 2.1 Implement `getPostById` in `PostsDatasourceImpl` (`GET /posts/{id}`), reusing `PostModel`/`TPost`; catch the generic `NotFoundError` and rethrow `PostNotFoundError`.
- [x] 2.2 Implement `createPost` in `PostsDatasourceImpl` (`POST /posts`), reusing `PostModel`/`TPost` for the response.
- [x] 2.3 Implement `updatePost` in `PostsDatasourceImpl` (`PATCH /posts/{id}`).
- [x] 2.4 Implement `deletePost` in `PostsDatasourceImpl` (`DELETE /posts/{id}`).
- [x] 2.5 Unit test `PostsDatasourceImpl`'s new methods, including the `NotFoundError` → `PostNotFoundError` mapping on `getPostById`.
- [x] 2.6 Add a single-post mock helper alongside the existing `createPost` factory in `src/data/posts/mock-factories/postsList.ts` if the current factory doesn't already cover single-post fixtures needed by the new tests. (Not needed — the existing `createPost` factory already produces single-post fixtures.)

## 3. Global QueryClient config

- [x] 3.1 Set `defaultOptions` on `ApplicationProvider.tsx`'s `QueryClient` (`staleTime: 0`, `refetchOnWindowFocus: false`). (`gcTime: 0` deliberately dropped — see design.md decision 7.)
- [x] 3.2 Run the full existing Vitest suite to confirm no test relies on the previous caching defaults.

## 4. Base confirm-dialog UI primitive

- [x] 4.1 Create `src/ui/molecules/confirm-dialog/ConfirmDialog.tsx`, built on the existing `Modal`, with `open`/`onConfirm`/`onCancel`/message props and no business logic.
- [x] 4.2 Behavior test for `ConfirmDialog`: confirm calls `onConfirm`, cancel calls `onCancel`, escape/backdrop behavior matches `Modal`'s existing contract.
- [x] 4.3 Add `isPending` to `ConfirmDialog` (disables both buttons, shows a loading spinner on confirm) and wire it up in `DeletePost` from the delete usecase's `isPending`; cover with tests in `ConfirmDialog`, `CreatePost`, `EditPost`, and `DeletePost`.

## 5. `post-management` feature (replaces `create-post`)

- [x] 5.1 Create `src/features/post-management/hooks/usePostForm.ts`, generalizing `useCreatePostForm` to accept `mode: 'create' | 'edit'`, optional default values, and call `CreatePostCase`/`UpdatePostCase` accordingly via `createUsecase`.
- [x] 5.2 Create `src/features/post-management/ui/PostFormFields.tsx` (or equivalent), extracting the shared title/body `Form`/`FormTextField` markup used by both create and edit.
- [x] 5.3 Create `src/features/post-management/CreatePost.tsx` (root), composing `usePostForm({ mode: 'create' })` + the shared fields — behavior equivalent to today's `CreatePost.tsx` but actually submitting to the backend.
- [x] 5.4 Create `src/features/post-management/EditPost.tsx` (root), composing `usePostForm({ mode: 'edit', post })` + the shared fields, pre-filled with the given post's title/body.
- [x] 5.5 Create `src/features/post-management/ui/DeletePostConfirmation.tsx` (or equivalent), wiring `ConfirmDialog` to `DeletePostCase` for a given post id. (Folded into 5.6 — `DeletePost.tsx` alone is a single-responsibility ~30-line component; a separate `ui/` wrapper would just be a pass-through with no second consumer.)
- [x] 5.6 Create `src/features/post-management/DeletePost.tsx` (root), exposing the delete-confirmation flow for one post as this slice's public delete entry point.
- [x] 5.7 Delete `src/features/create-post/` (superseded by `post-management`).
- [x] 5.8 Update `Home.tsx`'s import from `@features/create-post/CreatePost` to `@features/post-management/CreatePost`.
- [x] 5.9 Behavior test `CreatePost`: confirming valid data calls the create usecase and closes on success.
- [x] 5.10 Behavior test `EditPost`: opens pre-filled with the given post's data; confirming changes calls the update usecase and closes on success.
- [x] 5.11 Behavior test `DeletePost`: triggering delete requires confirmation; confirming calls the delete usecase; cancelling calls neither the usecase nor closes anything it shouldn't.
- [x] 5.12 Hook test for `usePostForm` covering both `create` and `edit` modes, following the `useLoginForm.test.tsx` template.

## 6. Posts list — edit/delete entry points

- [x] 6.1 Extract `src/features/posts-list/ui/PostListItem.tsx` from `PostsList.tsx`'s inline `<li>`, adding edit and delete triggers that open `post-management`'s `EditPost`/`DeletePost` for that post.
- [x] 6.2 Update `PostsList.tsx` to render `PostListItem` per post instead of the inline markup.
- [x] 6.3 Behavior test `PostListItem`: renders title/body; triggering edit opens the edit flow pre-filled with this post's data; triggering delete requires confirmation before calling the delete usecase.

## 7. Post detail route & view

- [x] 7.1 Add a `postDetail` route builder to `src/application/routes.ts` (e.g. `postDetail: (id) => \`/posts/${id}\``).
- [x] 7.2 Create `src/features/post-detail/PostDetail.tsx`, calling `useGetPostById([id])`, rendering title/body on success, a not-found state on `PostNotFoundError`, and hosting edit/delete triggers wired to `post-management`'s `EditPost`/`DeletePost`; on confirmed delete, navigate back to `routes.posts`.
- [x] 7.3 Create `src/views/posts/PostDetailView.tsx`, composing `PostDetail`.
- [x] 7.4 Create `app/(domain)/posts/[id]/page.tsx`, rendering `PostDetailView` with the route's `id` param.
- [x] 7.5 Behavior test `PostDetail`: existing post shows title/body; nonexistent post shows the not-found state instead of content; edit/delete triggers work as in tasks 5.10/5.11.

## 8. Final checks

- [x] 8.1 Run the project's full Quick Commands checklist from `AGENTS.md` (lint, typecheck, test) and fix any failures.
