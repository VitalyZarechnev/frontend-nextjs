# Data Fetching

> How server state reaches components — queries via `createDatasource`, mutations via `createUsecase`. **Components must never import `useQuery`/`useMutation` directly from `@tanstack/react-query`.**

## TL;DR

- **The choice is _when the request runs_.** Runs on render → `createDatasource` (query). Runs imperatively, on an action → `createUsecase` (mutation). See [Choosing](#choosing-render-time-vs-imperative).
- **Render-time reads → `createDatasource`:** wrap a datasource at module top-level, then call the generated `use<Method>()` in the component. Fires automatically on render; cached and reactive.
- **Imperative actions → `createUsecase`:** wrap a use-case at module top-level, then call `.useMutation(opts?)` and fire `mutate(...)` from an event/handler. Runs only when you call it.
- **Dependencies:** resolve datasources (and other infra) from `registry` (`@application/di/AppRegistry`) — never `new PostsDatasourceImpl(httpClient)` in features.
- Both wrappers must be instantiated **once, at module top-level** — never inside a component.
- Query keys are derived automatically as `[<ClassName>.<methodName>, ...args]`. No manual key juggling.
- Anti-patterns are caught by ESLint (`react-compiler/react-compiler`, `@tanstack/query/exhaustive-deps`).

## Why

The wrappers give React Compiler stable, top-level hook references it can statically verify ("hooks must be the same function on every render"). Calling `useQuery(...)` inline inside a component is fine in isolation but:

- Bypasses the data layer abstraction — the component now knows about HTTP details.
- Skews query key conventions across the codebase.
- Mixes "what data" with "how to fetch it", making mocks in tests harder.

Alternatives considered:

- **Direct `useQuery` everywhere** — rejected: see above.
- **Custom `useXxx` hook per feature** — rejected: hand-rolled boilerplate per endpoint; the auto-generated wrapper subsumes it.
- **Suspense queries** — orthogonal; could be added on top of `createDatasource` later, but not currently used.

## Choosing: render-time vs imperative

Pick by **when the request fires**, not merely by read-vs-write:

| The request…                                                           | Use                        | How it fires                                         |
| ---------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| Runs **on render** — data the component needs to display as it mounts  | `createDatasource` (query) | Automatically, when the `use<Method>()` hook renders |
| Runs **imperatively** — triggered by an action (submit, click, delete) | `createUsecase` (mutation) | Only when you call `mutate(...)` from a handler      |

- **On render → query.** If a component must show data the moment it appears (a list, a detail page, the current profile), read it with a `createDatasource` query. React Query fetches on render, caches, and re-renders as state changes — you never call it manually.
- **Imperatively → use-case.** If a request must fire in response to something the user does — and must **not** run just because the component rendered — wrap it in a use-case and call `mutate(...)` from the event handler.

This usually lines up with **reads on render** vs **writes on action**, but the deciding question is _when it fires_. Anything you need to invoke on demand belongs in a use-case, even if it's technically a read.

## Dependency injection (`registry`)

Datasources and shared infra (`httpClient`, `tokenManager`, …) are registered once in `AppRegistry` and bootstrapped via `AppBootstrap` (client vs server storage strategy). Features import the singleton:

```ts
import { registry } from '@application/di/AppRegistry';
```

Use `registry.<datasource>` when wiring `createDatasource` / use-case constructors at module top-level. Registration lives in `src/application/di/` — features do not construct `*DatasourceImpl` or `HttpClientImpl` themselves.

## Pattern — Render-time reads (`createDatasource`)

1. Datasource class in `/src/data/<domain>/datasources/`. Methods return `Promise<DomainModel>` / `Promise<DomainModel[]>`.
2. `AppBootstrap` instantiates the impl and registers it on `registry` (features never do this).
3. At module top-level in the feature file, wrap the registered datasource with `createDatasource(registry.<datasource>)`.
4. In the component, call the generated `use<Method>()` hook.

```ts
// 2. Module-level wiring (Feature layer)
import { registry } from '@application/di/AppRegistry';

import { createDatasource } from '@utils/datasource';

// 1. Datasource (Data layer) — registered in AppBootstrap, not in features
export class PostsDatasourceImpl implements IPostsDatasource {
  constructor(private _httpClient: IHttpClient) {}

  async getPosts(): Promise<TPostsList> {
    const response = await this._httpClient.get({ resource: '/posts' });
    return createModel(PostsListSchema, response);
  }
}

const postsData = createDatasource(registry.postsDatasource);
//    ^? { useGetPosts: (args?, opts?) => ..., useGetPostById: (args?, opts?) => ... }

// 3. Component usage
export default function PostsList() {
  const { data: posts, isPending, error } = postsData.useGetPosts();
  // For methods with args, pass them as a tuple:
  // const { data: post } = postsData.useGetPostById([id]);
}
```

**Auto-derived contract:**

- Hook name: `getFoo` → `useGetFoo` (capitalize + `use` prefix).
- Hook signature: `(args?: Parameters<method>, opts?: UseQueryOptions) => UseQueryResult`.
- Query key: `[<ClassName>.<methodName>, ...args]` (different args → different cache entries).
- Underscore-prefixed methods (`_helper`) are skipped — keep them effectively private.

## Pattern — Imperative actions (`createUsecase`)

1. Use-case class in `/src/domain/<domain>/usecases/` with a single `execute(...)` method returning `Promise<Result>`.
2. Wire it once at module top-level via `createUsecase(new XxxCase(registry....))` — pass registry deps into the constructor.
3. In the component / custom hook, call `.useMutation(opts?)`.

```ts
// 2. Module-level wiring (Feature layer)
import { registry } from '@application/di/AppRegistry';
import { routes } from '@application/routes';

import { LoginCase } from '@domain/auth/usecases/LoginCase';

import { createUsecase } from '@utils/usecase';

// 1. Use-case (Domain layer)
export class LoginCase {
  constructor(
    private _authDatasource: IAuthDatasource,
    private _usersDatasource: IUsersDatasource,
    private _tokenManager: ITokenManager,
  ) {}

  async execute(email: string, password: string): Promise<TUser> {
    await this._authDatasource.login(email, password);
    const profile = await this._usersDatasource.getMe();
    this._tokenManager.setAccessToken('access-token-value');
    return profile;
  }
}

const loginCase = createUsecase(new LoginCase(registry.authDatasource, registry.usersDatasource, registry.tokenManager));

// 3. Component / hook usage
const { mutate: mutateLogin, isPending } = loginCase.useMutation();

mutateLogin([email, password], {
  onSuccess: () => replace(routes.home),
}); // args of execute() passed as a tuple
```

`createUsecase` infers the `execute()` signature, so `mutate(...)` is fully typed: argument tuple matches `Parameters<execute>`, success callback receives `Awaited<ReturnType<execute>>`.

## Anti-patterns

```ts
// ❌ Direct hook from the library
import { useQuery } from '@tanstack/react-query';
const { data } = useQuery({ queryKey: [...], queryFn: () => api.getPosts() });

// ❌ Calling createDatasource inside a component (new ref every render)
function PostsList() {
  const postsData = createDatasource(registry.postsDatasource);
  return ...;
}

// ❌ Fetching render-time data imperatively — use a createDatasource query
useEffect(() => {
  loadPostsCase.mutate([]); // data shown on mount belongs in useGetPosts()
}, []);

// ❌ Constructing datasources in features — bypasses DI and duplicates bootstrap wiring
const postsData = createDatasource(new PostsDatasourceImpl(new HttpClientImpl(apiUrl)));

// ❌ Bypassing the wrapper for "just this one place"
const result = await postsDatasource.getPosts(); // not reactive, no caching, untyped key

// ❌ Custom queryKey overriding the auto one
postsData.useGetPosts([], { queryKey: ['posts'] }); // breaks invalidation conventions
```

## Testing

Feature and hook tests mock **`registry`** from `@application/di/AppRegistry` (hoisted `vi.fn()` per datasource method), not `*DatasourceImpl` constructors. Use mock factories under `src/data/**/mock-factories/` for response payloads. Full patterns: [testing.md](./testing.md).

```ts
const { getPostsMock } = vi.hoisted(() => ({ getPostsMock: vi.fn() }));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: { getPosts: getPostsMock },
  },
}));

getPostsMock.mockResolvedValue(createPostsList(2));
```

## See also

- [architecture.md](./architecture.md) — where datasources and use-cases live in the layer model.
- [testing.md](./testing.md) — mocking patterns for Vitest 4.
- DI: `src/application/di/AppRegistry.ts`, `src/application/di/AppBootstrap.ts`.
- Wrappers: `src/utils/datasource.ts`, `src/utils/usecase.ts`.
