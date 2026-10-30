# Architecture

> Clean-architecture layering for `/src/**` — what depends on what, and how data flows.

## TL;DR

- 8 layers: **Domain → Data → Application / Utils / UI / Features / Views / Errors**.
- Dependencies flow strictly **inward toward Domain**. Outer layers may import from Domain; Domain imports from nothing.
- Use-cases (`/src/domain/**/usecases/`) orchestrate datasources. Components invoke use-cases via `createUsecase`, never call datasources directly for mutations.
- Server state in components only via `createDatasource(...)` (queries) and `createUsecase(...)` (mutations). See [data-fetching.md](./data-fetching.md).

## Layers

### 1. Domain (`/src/domain`)

- Contains domain models (declared and validated via `zod`), enums, use-cases, domain errors, datasource interfaces, and local domain global stores (managed via `MobX`).
- MobX stores exclusively contain pure functions for storing and retrieving data, with no side effects allowed.
- Consists of isolated domain slices representing core business entities.
- **Dependency Rule:** Does not depend on any other layer. This is the core of the application.

### 2. Data (`/src/data`)

- Contains datasource implementations (fetching data, formatting payloads).
- Manages storages (interfaces and their implementations, e.g., LocalStorage wrappers).
- Defines clients for network protocols (interfaces and implementations).
- **Dependency Rule:** Depends directly on the Domain layer to implement its interfaces and return its models.

### 3. Application (`/src/application`)

- Manages global setup: routes, context providers, Dependency Injection (DI) containers, analytics, and global configuration.
- **Dependency Rule:** All other layers can access the Application layer (e.g., for resolving dependencies or triggering analytics).

### 4. Utils (`/src/utils`)

- Contains utility functions, custom React hooks, formatting helpers, etc.
- **Organised by domain segment** — one folder per concern (`dom/`, `keyboard/`, `network/`, `environment/`, …). Put a new util in the segment it belongs to; create a new segment when none fits.
- **DRY / reuse first.** Before writing logic, check whether a util already exists. Extract reusable logic here **even if it's used only once** for now instead of inlining it in a feature.
- **Strict Rule:** Must _not_ contain any business logic. Only strictly pure utilities that are reusable across different projects. Named exports only (no default).
- **Dependency Rule:** Does not depend on any other layer.

### 5. UI (`/src/ui`)

- Contains reusable, "dumb" UI components (buttons, inputs, modals).
- **Strict Rule:** Must _not_ contain any business logic. Stick to atomic design principles.
- **Dependency Rule:** Can depend exclusively on the Utils layer (and Domain enums/models only in rare, explicitly justified cases).

### 6. Features (`/src/features`)

- Contains reusable business units that combine UI with domain logic — forms, widgets, interactive blocks. A feature is **not always UI**: it can be a single component, several components, just a hook, or a component plus a hook / constants / an event bus.
- Internal layout (slices, segments, root-only public API) is governed by [structure.md](./structure.md).
- Connects to the Domain layer (MobX stores, use-cases) and accesses datasources via the DI container.
- **Dependency Rule:** Connects the UI, Domain, and Application layers together. Must not import from Views.

### 7. Views (`/src/views`)

- Contains page-level views — one view per route/screen (e.g. `LoginView` for `/login`).
- Composes features together; owns page layout, headings, and route-specific presentation.
- **Strict Rule:** No direct datasource or use-case calls — delegate business logic to features.
- **Dependency Rule:** May import Features, UI, Utils, and Application. App Router pages (`/app/**`) import views, not features directly.

#### App Router files (`/app`) and Features

The `app` folder composes Views. Two exceptions exist for app-shell features (header, footer, nav, error banner):

- **Shell files** — `layout.tsx`, `template.tsx` — may import features freely. They only wrap their children instead of being a screen, so there is no view for the feature to live in.
- **Screen files** — `page.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx` — may import a feature **only if the same file also imports a View**. A screen made of features with no view has become a view — move that composition into `@views`.
- **`route.ts` handlers and everything else in `/app`** stay restricted: features are UI/business units, not request handlers.
- **The dependency is one-way:** nothing under `/src` may import `@app/*`. Route files are Next.js entry points, not a public API.

Feature encapsulation is unchanged everywhere: only feature roots are importable, never internals.

The full enforced import matrix — every layer, every relaxation, and how the ESLint zones are wired — lives in
[eslint/layer-boundaries/README.md](../../eslint/layer-boundaries/README.md).

### 8. Errors (`/src/errors`)

- Contains common application-level errors (e.g., network failures, routing errors). _Note: Domain-specific business errors belong in the Domain layer._
- **Dependency Rule:** Can be accessed by any other layer except Utils and UI.

## Data Flow

Data flows in a strictly unidirectional pattern, maintaining separation of concerns and ensuring the UI remains reactive to the core business state.

1. **User Interaction:** A user interacts with a component in the **Views**, **Features**, or **UI** layer (e.g., clicking a "Submit" button on a page).
2. **Action Dispatch:** The Feature component triggers an action on a local or global store, or calls a datasource method/use-case from the **Domain** layer.
3. **Data Execution (DI):** The DI container resolves the interface to its concrete implementation in the **Data** layer. The Data layer executes the external request (e.g., an API call) and maps the raw response into a **Domain Model** (validated via `zod`).
4. **State Mutation:** The Data layer returns the parsed model to the Feature layer. The Feature layer processes any remaining business rules and updates its local state or **MobX State**.

## Anti-patterns

```ts
// ❌ UI atom importing from /src/features or /src/data
// (atoms must stay reusable across features)
import { useSession } from '@application/SessionProvider'; // in src/ui/atoms/...

// ❌ Domain layer importing from anywhere else
// /src/domain/users/models/User.ts
import { httpClient } from '@data/network/...'; // Domain must stay pure

// ✅ Shell feature in a layout — no view to put it in
// app/(domain)/layout.tsx
import AppFooter from '@features/app-footer/AppFooter';
// ✅ Shell feature next to the route's view
// app/(domain)/posts/page.tsx
import AppFooter from '@features/app-footer/AppFooter';
// ❌ Page built out of features with no view — compose via a view instead
// app/(auth)/login/page.tsx
import LoginForm from '@features/login/LoginForm'; // use LoginView from @views

import PostsView from '@views/posts/PostsView';

// ❌ Feature directly newing a datasource inside a render path
function PostList() {
  const data = new PostsDatasourceImpl(httpClient).getPosts(); // breaks DI, no caching
}

// ❌ View calling a use-case or datasource — belongs in a feature
function LoginView() {
  const { mutate } = loginCase.useMutation(); // move to LoginForm feature
}
```

## See also

- [structure.md](./structure.md) — slice/segment layout and encapsulation inside a layer.
- [data-fetching.md](./data-fetching.md) — concrete `createDatasource` / `createUsecase` patterns.
- [ui.md](./ui.md) — atomic design inside `/src/ui`.
