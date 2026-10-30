# Testing

> Vitest 4 + jsdom + `@testing-library/react`. How to test features/hooks, mock dependencies, and build domain-shaped test data. This is the **UI / behaviour** suite; how a screen _looks_ is checked separately by Playwright — see [testing-pixel-perfect.md](./testing-pixel-perfect.md).

## TL;DR

- Runner: **Vitest 4** (`npm test` = `vitest run`, `npm run test:watch` = watch mode). Environment: **jsdom**; globals enabled (`describe`, `test`, `expect`, `vi` in scope).
- Tests live next to code: `Foo.tsx` → `Foo.test.tsx`. Glob: `src/**/*.{test,spec}.{ts,tsx}`.
- **UI tests belong here, appearance does not.** jsdom neither lays out nor paints, so it cannot catch a visual shift — never try to assert spacing, size or colour here. That is Playwright's job, in `*.pixel.ts` files ([testing-pixel-perfect.md](./testing-pixel-perfect.md)); the two suites never overlap.
- Wrap React Query UI/hooks with **`renderWithQueryClient`** from `@application/test/renderWithQueryClient` (uses `createTestQueryClient` — queries/mutations **retry: false**).
- **Mock datasources at the registry:** `vi.mock('@application/di/AppRegistry', () => ({ registry: { postsDatasource: { getPosts: getPostsMock }, ... } }))`. Features resolve deps via `registry`, not `new PostsDatasourceImpl(...)`.
- **Test data:** import factories from `src/data/<entity>/mock-factories/` built with `createSchemaFactory` — never hand-roll objects that duplicate domain shapes.
- Outer-scope refs inside `vi.mock`: **`vi.hoisted`**. If you must mock a **class** constructor (rare here), return a `class` literal — Vitest 4 rejects `vi.fn().mockImplementation(() => ({ ... }))`.

## Why

- **Registry mocks** match production wiring: features and hooks use `registry.authDatasource`, `registry.postsDatasource`, etc. Mocking `*DatasourceImpl` classes bypasses the DI boundary and breaks when imports move to the registry.
- **`renderWithQueryClient`** avoids duplicating `QueryClientProvider` setup and keeps retry behavior deterministic in async tests.
- **Mock factories in `/src/data/**`\*\* keep Zod-valid domain objects in one place; tests stay focused on behavior, not field lists.

## Config and helpers

| File                                             | Role                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| `vitest.config.ts`                               | jsdom, globals, `setupFiles`, `include` glob; `resolve.tsconfigPaths: true` |
| `vitest.setup.ts`                                | `@testing-library/jest-dom/vitest` matchers                                 |
| `src/application/test/createTestQueryClient.ts`  | `QueryClient` with `retry: false` for queries and mutations                 |
| `src/application/test/renderWithQueryClient.tsx` | `render()` + provider wrapper; optional `queryClient` override              |

## Mocking `AppRegistry`

Use **`vi.hoisted`** for `vi.fn()` refs, then expose them on a minimal `registry` object. Only stub methods the code under test calls.

```tsx
const { getPostsMock } = vi.hoisted(() => ({ getPostsMock: vi.fn() }));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: {
      getPosts: getPostsMock,
    },
  },
}));

beforeAll(() => {
  getPostsMock.mockResolvedValue(mockPosts);
});
```

Hook / use-case tests may need several datasources (see `useLoginForm.test.tsx`):

```tsx
const { replace, loginMock, getMeMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  loginMock: vi.fn(),
  getMeMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    authDatasource: { login: loginMock },
    usersDatasource: { getMe: getMeMock },
  },
}));
```

Reset mocks in `beforeEach` (`mockClear` / `mockReset`) when tests share setup.

## Mock factories (test data)

**Location:** `src/data/<feature-area>/mock-factories/<entity>.ts` (e.g. `postsList.ts`, `user.ts`).

**Builder:** `createSchemaFactory` from `@utils/testing/createSchemaFactory` — uses **Zod schema** + **`zod-schema-faker`** (with `@faker-js/faker` for overrides).

### Rules

1. **Import the domain Zod schema** (`PostModel`, `UserModel`) — factories produce **`TEntity` / inferred types**, not parallel interfaces.
2. **Export `create<Entity>`** via `createSchemaFactory(Schema)`; optional second arg maps **specific keys** to faker generators when schema-faker output is weak or you need a format (see `createUser`).
3. **Always support overrides:** `createPost({ id: 1, title: 'Fixed' })` — implemented by the helper (`overrides` merged last).
4. **Lists:** add `create<Entity>List(count, overrides?)` that returns a typed array (e.g. `TPostsList`), using stable ids (`index + 1`) when tests assert on count/order.
5. **Use in tests** — import from `@data/.../mock-factories/...`; do not inline large fixture objects or obsolete model classes.
6. **Do not** put factories in `@domain` (no faker/faker deps) or `@features` (not reusable across tests).

### Examples

**Schema only** — zod-schema-faker fills all fields:

```ts
// src/data/posts/mock-factories/postsList.ts
export const createPost = createSchemaFactory(PostModel);

export function createPostsList(count: number, overrides?: Partial<TPost>): TPostsList {
  return Array.from({ length: count }, (_, index) => createPost({ id: index + 1, ...overrides }));
}
```

**Selected faker fields** — override noisy or generic schema-faker values:

```ts
// src/data/users/mock-factories/user.ts
export const createUser = createSchemaFactory(UserModel, {
  id: () => faker.number.int({ min: 1, max: 1_000_000 }),
  email: () => faker.internet.email(),
  phone: () => faker.phone.number({ style: 'international' }),
  username: () => faker.internet.username(),
  displayName: () => faker.person.fullName(),
});
```

In tests: `const mockPosts = createPostsList(2);` then `getPostsMock.mockResolvedValue(mockPosts)`.

## Component test template

Canonical example: `src/features/posts-list/PostsList.test.tsx`.

```tsx
import { screen, waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import { createPostsList } from '@data/posts/mock-factories/postsList';

import PostsList from './PostsList';

const { getPostsMock } = vi.hoisted(() => ({ getPostsMock: vi.fn() }));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: {
      getPosts: getPostsMock,
    },
  },
}));

const mockPosts = createPostsList(2);

describe('Posts', () => {
  beforeAll(() => {
    getPostsMock.mockResolvedValue(mockPosts);
    renderWithQueryClient(<PostsList />);
  });

  test('renders 2 posts', async () => {
    await waitFor(() => {
      expect(screen.queryAllByRole('listitem')).toHaveLength(2);
    });
  });
});
```

**Selector priority:** **role/name** queries (`getByRole`, `queryAllByRole`, `getByLabelText`) first — they assert accessibility too. A `data-test-id` is a **last resort**, only when no meaningful role/name exists. **Never** select by class name or `container.querySelector`.

```tsx
// ✅ role/name
screen.getByRole('button', { name: 'Create' });

// ⚠️ last resort — no usable role/name
screen.getByTestId('chart-canvas');

// ❌ class names / querySelector
container.querySelector('.button_primary');
```

## Hook test template

Write a hook test that renders the hook and asserts on its observable behavior; wrap with `renderWithQueryClient` when it touches React Query.

```tsx
import { waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import { useLoginForm } from './useLoginForm';

const { replace, loginMock, getMeMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  loginMock: vi.fn(),
  getMeMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    authDatasource: { login: loginMock },
    usersDatasource: { getMe: getMeMock },
  },
}));

const setupUseLoginForm = () => {
  const hookReturn = {};

  const TestComponent = () => {
    Object.assign(hookReturn, useLoginForm());
    return null;
  };

  renderWithQueryClient(<TestComponent />);

  return hookReturn as ReturnType<typeof useLoginForm>;
};

describe('useLoginForm Hook', () => {
  let hookResult: ReturnType<typeof useLoginForm>;

  beforeEach(() => {
    replace.mockClear();
    loginMock.mockResolvedValue(undefined);
    hookResult = setupUseLoginForm();
  });

  test('successfully submits', async () => {
    hookResult.handleSubmit({ email: 'email@mail.com', password: 'some-password' });

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });
});
```

## Other `vi.mock` patterns

| Scenario                                             | How                                                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Outer-scope ref in `vi.mock` factory                 | `vi.hoisted(() => ({ ref: vi.fn() }))`                                                              |
| Next.js router                                       | `vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }))`                            |
| Mock a **class** module (legacy / unit test of impl) | `vi.mock('mod', () => ({ Impl: class { method = vi.fn(); } }))` — not the default for feature tests |
| Partial mock                                         | `vi.mock('mod', async (orig) => ({ ...(await orig()), fn: vi.fn() }))`                              |

## Anti-patterns

```ts
// ❌ Jest APIs
jest.fn(); jest.mock('mod');

// ❌ Mocking *DatasourceImpl in feature tests while production uses registry
vi.mock('@data/posts/datasources/PostsDatasourceImpl', () => ({ ... }));

// ❌ Hand-built fixtures diverging from Zod models
const mockPosts = [{ id: 1, userId: 2, title: 'x', body: 'y' }];

// ❌ Inline QueryClientProvider in every test file
render(<QueryClientProvider client={new QueryClient()}>...</QueryClientProvider>);

// ❌ Class mock via vi.fn().mockImplementation — Vitest 4 runtime error
Impl: vi.fn().mockImplementation(() => ({ method: vi.fn() }));

// ❌ Outer-scope variable in vi.mock without vi.hoisted
const data = [...];
vi.mock('mod', () => ({ get: () => data }));

// ❌ Implementation-detail assertions
expect(container.querySelector('.button_variant_main')).toBeInTheDocument();
```

## See also

- [testing-pixel-perfect.md](./testing-pixel-perfect.md) — the Playwright screenshot suite (appearance, not behaviour).
- [data-fetching.md](./data-fetching.md) — `createDatasource` / `createUsecase`; registry wiring in features.
- `src/utils/testing/createSchemaFactory.ts` — factory implementation.
- `vitest.config.ts`, `vitest.setup.ts` — runner wiring.
