# Errors

> The error taxonomy in `/src/errors/**` (plus domain/data-local errors) — what each family means, how errors are thrown and mapped, and where they surface to the user.

## TL;DR

- Every error extends the abstract base **`ApplicationError`** (`extends Error`). Never `throw new Error(...)` or throw strings in app code.
- Three shared families live under `/src/errors/`: **`application/`** (semantic app failures), **`http/`** (one class per status code, all extending **`HttpError`**, + `AbortError`), **`websocket/`** (transport failures).
- **`HttpClientImpl` throws the exact status class** (table: `HTTP_ERROR_BY_STATUS_CODE` in the client) and puts the code the backend reported on **`error.detail`**. **Branch on `error.detail`** for business outcomes; `instanceof` for the rare status-only case.
- **Domain-/data-specific errors live in their slice, not in `/src/errors`**: `src/domain/<slice>/errors/`. `/src/errors` is only for cross-cutting errors.
- Every error class carries a `public static code` string id; HTTP ones also carry `public static statusCode`. Identify errors via `instanceof`, and correlate with servers/logs via `code`.
- Errors are **raised in the Data layer** (`HttpClientImpl`, `WebSocketClientImpl`, `createModel`) and **surface** either through React Query state or the App Router boundary [`app/error.tsx`](../../app/error.tsx). UI/Views never construct these classes.
- **Datasources and usecases may themselves `throw` business errors from `src/domain/<slice>/errors/`.** Beyond the transport errors the infra raises for them, a datasource or use-case can validate its own domain preconditions and throw a slice-specific error (e.g. `UserNotFoundError`) — that's what the per-slice `errors/` folders are for.

## Why

A typed error hierarchy lets any layer branch on failure without string-matching messages: `instanceof UnauthorizedError` is refactor-safe, `error.message === 'Unauthorized'` is not. A single abstract base (`ApplicationError`) gives one catch-all discriminator (`instanceof ApplicationError`) that separates _our_ thrown errors from unexpected runtime ones. Splitting by family keeps the catalogue navigable and mirrors the layer model in [architecture.md](./architecture.md): the Errors layer is importable everywhere **except Utils and UI**, so infrastructure and features share one vocabulary while dumb UI stays out of it.

Alternatives considered:

- **Plain `Error` + message strings** — rejected: not branchable, breaks on message edits/i18n.
- **A single flat `errors/` folder** — rejected: the http/application/websocket split signals _where_ a failure originated at a glance.
- **Error codes as an enum** — rejected: `static code` co-locates the id with the class and avoids a central enum that every new error must edit.

## Families & conventions

| Family                   | Location                      | Base                                   | Extra statics        | Examples                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ----------------------------- | -------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application**          | `src/errors/application/`     | `ApplicationError`                     | `code`               | `HttpError` (base of the HTTP family), `NetworkError`, `UnexpectedError`, `ValidationError`, `ClientValidationError`, `DependencyNotRegisteredError`                                                                                                                                                                                                        |
| **HTTP**                 | `src/errors/http/`            | **`HttpError`**                        | `code`, `statusCode` | `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `UnprocessableEntityError` (422), `InternalServerError` (500), `BadGatewayError` (502), `GatewayTimeoutError` (504). `AbortError` also lives here but extends `ApplicationError` — a cancelled request never produced a response. |
| **WebSocket**            | `src/errors/websocket/`       | `ApplicationError`                     | `code`               | `WebSocketConnectionError`, `WebSocketMessageError`, `WebSocketClosedError`                                                                                                                                                                                                                                                                                 |
| **Domain/data-specific** | `src/<layer>/<slice>/errors/` | `ApplicationError` _or_ a shared error | `code`               | `UserNotFoundError` (`domain/users/errors`), `InvalidTokenError`/`NoTokenError`/`FailedToRefreshTokenError` (`domain/auth/errors`, extend `ApplicationError`)                                                                                                                                                                                               |

Naming (see also [code-style.md](./code-style.md)):

- Class name ends in `Error`; file name matches the class.
- `public static code` — a stable string id. **PascalCase** matching the class name for purely client-side errors (`'NetworkError'`); **snake_case** when it mirrors a server contract, i.e. whenever you intend to compare it against what the backend returns (`'invalid_token'`, `'limits_exceeded'`, `'user_not_found'`).
- HTTP errors add `public static statusCode = <number>` and pass both statics to `super`, so every instance exposes `statusCode`, `code`, the response `body`, and `detail`.
- Constructors default the `message`, so `new NotFoundError()` is valid; pass a message only to add context.

> **`code` vs `detail` on an `HttpError`.** `code` is the class's own predefined id (`'ForbiddenError'`) — it is fixed by the class and cannot be passed in. `detail` is whatever code the **backend** reported on that response (its `detail` field, falling back to `code`), or `undefined` if it reported none. So `error.detail === LimitsExceededError.code` is the branch you'll write most often: "did the server name this case?".

> **Note on the HTTP family:** the client maps the response status to its class, so `catch (e) { if (e instanceof ForbiddenError) }` fires for a 403 — you do **not** need `e.statusCode === 403`. A status with no dedicated class (e.g. 429) falls back to a generic `HttpError` that still carries `statusCode`, so `instanceof HttpError` remains the catch-all for "the server answered with a failure". Adding a status class means adding the file **and** registering it in `HTTP_ERROR_BY_STATUS_CODE` in `HttpClientImpl`.

## Pattern — declaring an error

```ts
// src/errors/application/NetworkError.ts — cross-cutting → lives in /src/errors
import { ApplicationError } from '@errors/application/ApplicationError';

export class NetworkError extends ApplicationError {
  public static code = 'NetworkError';

  constructor(message = 'Network Error') {
    super(message);
  }
}
```

```ts
// src/domain/users/errors/UserNotFoundError.ts — domain-specific → lives in the slice
import { ApplicationError } from '@errors/application/ApplicationError';

export class UserNotFoundError extends ApplicationError {
  public static code = 'user_not_found'; // snake_case — compared against the API's `detail`

  constructor(message = 'User Not Found') {
    super(message);
  }
}
```

An HTTP status error extends `HttpError` and feeds its own statics into `super`, so the instance is self-describing:

```ts
// src/errors/http/NotFoundError.ts
import { HttpError } from '@errors/application/HttpError';

export class NotFoundError extends HttpError {
  public static code = 'NotFoundError';
  public static statusCode = 404;

  // `code` and `statusCode` are the class's own identity — never constructor arguments.
  // Only per-response data (`message`, `body`, `detail`) is passed in.
  constructor(message = 'Not Found Error', body = '', detail?: string) {
    super(message, body, NotFoundError.statusCode, NotFoundError.code, detail);
  }
}
```

## Pattern — where errors are raised (Data layer)

`HttpClientImpl` translates transport/HTTP outcomes into typed errors; features never see a raw `fetch` rejection:

```ts
// src/data/network/http/HttpClientImpl.ts (abridged)
try {
  response = await fetch(resourceUrl, { ...options, headers, signal: signal?.signal });
} catch (e) {
  if (e instanceof Error && e.name === AbortError.code) throw new AbortError();
  throw new NetworkError();
}

if (!response.ok) {
  const json = await response.json();
  const detail = this.getResponseErrorDetail(json); // `detail`, falling back to `code`

  // Server contract: token problems come back in `detail` → typed auth error drives refresh/retry
  if (detail !== undefined && [InvalidTokenError.code, NoTokenError.code].includes(detail)) {
    throw new InvalidTokenError();
  }
  // 404 → NotFoundError, 403 → ForbiddenError, … unmapped status → generic HttpError.
  // The backend's code rides along as `detail` for datasources to branch on.
  throw this.createHttpError(response, json, detail);
}
```

The token check deliberately runs **before** the status mapping: a 401 carrying `detail: 'invalid_token'` must reject with `InvalidTokenError` (which drives the refresh-and-retry queue), not `UnauthorizedError`.

Schema validation failures become a `ValidationError` via `createModel` — so any datasource mapping a payload through a Zod model raises a typed error automatically. This is a **client-side** failure (the backend's payload didn't match our Zod model), so `ValidationError` lives in `application/` and is _not_ an `HttpError`:

```ts
// src/utils/model.ts (abridged)
export function createModel<T extends z.Schema>(model: T, data: unknown): z.infer<T> {
  try {
    return model.parse(data);
  } catch (error) {
    // ...collect ZodError issues...
    throw new ValidationError('Validation error' + ...);
  }
}
```

## Pattern — datasources & usecases raising business errors

The infra above raises _transport_ errors on your behalf, already typed per status. Turning those into the **business** error a case needs is still yours: a **datasource** or **use-case** can `catch` and re-`throw` a slice-specific error in a private `handleError`, or throw directly when a domain precondition fails — rather than letting a transport error leak to the caller. These errors are **domain-specific**, so they live in the slice (`src/domain/<slice>/errors/`) — see [Families & conventions](#families--conventions) and [data-fetching.md](./data-fetching.md).

**Branch on the code the backend sent, not on the HTTP status.** In practice a status rarely identifies a business case on its own — the same 400 or 422 covers a dozen different outcomes, and the API distinguishes them with a `detail`/`code` field. That value arrives on `HttpError.code`, and each business error's `static code` mirrors it. Status classes (`instanceof ForbiddenError`) are for the handful of cases the status really does say everything about.

An LLM completion endpoint is the typical shape — one status, many outcomes:

```ts
// src/domain/llm/errors/LimitsExceededError.ts — one file per business outcome, snake_case code
export class LimitsExceededError extends ApplicationError {
  public static code = 'limits_exceeded'; // matches the API's `detail` value

  constructor(message = 'Limits Exceeded') {
    super(message);
  }
}
```

```ts
// src/data/llm/datasources/CompletionDatasourceImpl.ts
async complete(prompt: string): Promise<TCompletion> {
  try {
    const response = await this._httpClient.post({ resource: '/completion', payload: { prompt } });
    return createModel(CompletionModel, response); // ValidationError raised here by infra
  } catch (error) {
    throw this.handleError(error);
  }
}

private handleError(error: unknown) {
  // The usual case: the backend named the failure. All three may arrive as the same status.
  if (error instanceof HttpError) {
    switch (error.detail) {
      case LimitsExceededError.code:
        return new LimitsExceededError();
      case NotSafeForWorkError.code:
        return new NotSafeForWorkError();
      case ModelNotExistError.code:
        return new ModelNotExistError();
    }
  }

  // The exception: a status that speaks for itself, with no code to read (529 in this case).
  if (error instanceof ServiceIsOverloadedError) {
    return new ServiceIsOverloadedError();
  }

  return new UnexpectedError();
}
```

Keep the switch to the codes this endpoint actually documents — don't pre-map an error per status "just in case". Anything unrecognised becomes `UnexpectedError`, which is the honest answer.

```ts
// src/domain/auth/usecases/LoginCase.ts — use-case throws when a business rule is violated
async execute(email: string, password: string): Promise<TUser> {
  await this._authDatasource.login(email, password);
  const profile = await this._usersDatasource.getMe();
  if (!profile.isActive) throw new AccountDisabledError(); // domain rule, not a transport failure
  return profile;
}
```

The thrown class surfaces the same way as any other: through React Query state at the call site, or the App Router boundary. Callers branch on it with `instanceof` (`error instanceof UserNotFoundError`) to recover in place. Prefer throwing a typed error over returning a sentinel value — it keeps the failure branchable and self-documenting.

WebSocket failures are **delivered to the listener** (`onError`), not thrown, because there is no call stack to catch them — `WebSocketClientImpl` reports `WebSocketConnectionError` (open failed), `WebSocketMessageError` (malformed frame), and `WebSocketClosedError` (reconnect attempts exhausted). See [data-fetching.md](./data-fetching.md) for the streaming pattern.

Query/mutation errors surface through React Query state (`error` / `isError`) at the call site — branch on the typed class there rather than at the boundary when you can recover in place.

## Anti-patterns

```ts
// ❌ Untyped throw — not branchable, breaks on message/i18n edits
throw new Error('Unauthorized');
// ✅ throw new UnauthorizedError();

// ❌ Cross-cutting error dumped into a feature/slice, or a domain error put in /src/errors
// UserNotFoundError belongs in src/domain/users/errors, NOT src/errors/*

// ❌ Constructing/handling infra errors in UI or Views (Errors layer is off-limits there)
// src/ui/atoms/... or src/views/...
if (error instanceof HttpError) { ... } // move to a feature/data layer

// ❌ Message string-matching instead of instanceof / code
if (error.message.includes('token')) refresh(); // use `error instanceof InvalidTokenError`

// ❌ Swallowing errors silently (violates common/coding-style error-handling rule)
try { await save(); } catch { /* nothing */ }

// ❌ Reading a business outcome off the status — one status covers many cases
if (e instanceof UnprocessableEntityError) return new LimitsExceededError();
// ✅ if (e.detail === LimitsExceededError.code) return new LimitsExceededError();

// ❌ Comparing status numbers when a class already exists for it
if (e instanceof HttpError && e.statusCode === 403) ...
// ✅ if (e instanceof ForbiddenError) ...   ← the client throws the exact class

// ❌ A business error whose static code doesn't match the API's value
export class LimitsExceededError { public static code = 'LimitsExceededError'; } // never matches
// ✅ public static code = 'limits_exceeded';

// ❌ Adding a status class without registering it in HTTP_ERROR_BY_STATUS_CODE
// The file alone changes nothing — the client will keep throwing a generic HttpError for that status.

// ❌ Treating a cancelled request or a Zod mismatch as an HTTP failure
// AbortError and ValidationError are NOT HttpError — they never had a failing response.
```

## See also

- [architecture.md](./architecture.md) — the Errors layer and its dependency rule (accessible everywhere except Utils and UI).
- [data-fetching.md](./data-fetching.md) — where `HttpClientImpl` / `WebSocketClientImpl` sit and how failures reach components.
- [code-style.md](./code-style.md) — class/`static code` naming conventions.
- Source: `src/errors/**`, `src/data/network/http/HttpClientImpl.ts` (status→class table + `code` extraction), `src/data/network/websocket/WebSocketClientImpl.ts`, `src/utils/model.ts`, `app/error.tsx`.
