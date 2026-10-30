# Code style

> How we name and declare TypeScript in every `*.{ts,tsx}` file — components, features, data, domain, utils, tests, and app routes.

## TL;DR

- Destructure the React import — never `React.ChangeEvent`; import `ChangeEvent` (or other types) directly from `'react'`.
- Props order: **required values → optional values → required callbacks → optional callbacks** (`className` last among values). Same order in the type declaration and in JSX. `TProps` names component props, `TParams` names a hook's param object — both destructured at the top of the body.
- **`function`** for components, hooks, `/src/utils` exports, and class methods; **arrow functions** only for callbacks, closures, and helpers defined inside another function.
- **Exports:** components `export default function`; utils `export function`; constants `export const`; classes `export class`. Only components and slice-root hooks use `default`.
- **Hooks:** camelCase `use` prefix; **named** `export function useXxx` — except a hook at a slice **root** (feature/ui-component public API), which uses `export default function useXxx`.
- **One file = one component or one hook.** Prop types prefixed with `T`; `className` last on the root element via `clsx`; BEM-like SCSS class names.
- **Enums:** PascalCase enum name; `SCREAMING_SNAKE_CASE` members; runtime values in `snake_case` strings.
- **Constants:** `SCREAMING_SNAKE_CASE`, `export const` (never `default`); file-private constants stay unexported.
- **Domain models:** Zod schema as `EntityModel`; inferred type as `TEntity` via `z.infer<typeof EntityModel>`.
- **Files:** PascalCase when the main export is a component/class/enum/model/interface, camelCase otherwise; **directories** are kebab-case.
- **Zero comments by default** — the bar is high and most code clears it without one (see [Comments](#comments)). **No blank lines inside JSX**; use blank lines to group logic in function bodies.

## Component template

```tsx
import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import classes from './MyAtom.module.scss';

type TVariant = 'primary' | 'secondary';

type TProps = PropsWithChildren & {
  variant: TVariant;
  className?: string;
};

export default function MyAtom(props: TProps) {
  const { variant, className, children } = props;

  return <div className={clsx(classes.my_atom, classes[`my_atom_variant_${variant}`], className)}>{children}</div>;
}
```

Conventions in the template:

- Prop type prefixed with `T` (`TProps`, `TVariant`).
- Default export, name matches the file.
- `className` is always last; passed through to the root element via `clsx`.
- BEM-like SCSS class naming (`my_atom`, `my_atom_variant_primary`).

## React import destructuring

Always destructure named imports from `'react'`. Do not use the default `React` namespace for types or APIs.

```tsx
// ✅
import { ChangeEvent, PropsWithChildren } from 'react';

function onChange(event: ChangeEvent<HTMLInputElement>) { ... }

// ❌
import React from 'react';

function onChange(event: React.ChangeEvent<HTMLInputElement>) { ... }
```

## Props order

Order props in four buckets: **required values → optional values → required callbacks → optional callbacks** ("values" = data/attributes, "callbacks" = operations/handlers). This applies to prop type declarations, JSX prop passing, and a hook's `TParams` object alike.

`className` is an optional value and stays **last among the values**, before any callback.

```tsx
type TProps = {
  id: string; // required attribute
  label: string; // required attribute
  className?: string; // optional attribute
  onClick: () => void; // required operation
  onBlur?: () => void; // optional operation
};

<MyAtom id='x' label='Save' className={classes.root} onClick={handleClick} onBlur={handleBlur} />;
```

`className` stays last among attributes when present.

## Function usage

1. **`function` keyword** — React component declarations, custom hooks, global utilities in `/src/utils`, and class methods.
2. **Arrow functions** (`const myFunc = () => {}`) — local helpers, callbacks, and closures defined inside another component or function.

```tsx
// ✅ Component and util
export default function Button(props: TProps) { ... }

export function formatLabel(value: string) { ... }

// ✅ Local callback inside a component
export default function Form(props: TProps) {
  const handleSubmit = () => { ... };
  return <form onSubmit={handleSubmit}>...</form>;
}

// ❌ Arrow for a top-level component or util
const Button = (props: TProps) => { ... };
```

## Classes

Domain use-cases, datasource implementations, and storages are classes.

- **Export:** `export class Foo` — **never** `export default`.
- **Methods:** declared with the method/`function` form — **never** arrow-function class fields.

```ts
// ✅
export class LoginCase {
  constructor(private _authDatasource: IAuthDatasource) {}

  async execute(email: string, password: string): Promise<TUser> { ... }
}

// ❌ default export
export default class LoginCase { ... }

// ❌ arrow-function method (loses prototype method; unnecessary binding)
export class LoginCase {
  execute = async (email: string, password: string): Promise<TUser> => { ... };
}
```

## Hooks

Nested hooks live under a slice's `hooks/` segment (e.g. `src/features/<feature>/hooks/useXxxForm.ts`). A hook that is a slice's public entry (a feature-hook, or a hook exposed at a UI-component root) lives at the slice **root**.

- **Name:** camelCase with a `use` prefix (`useVoiceInput`). Must match the file name.
- **Export:** **named** `export function useXxx` — never a top-level arrow. **Exception:** a hook at a slice **root** (its public API) uses `export default function useXxx`, following the component rule. Nested hooks in a `hooks/` segment are always named.
- **Parameters:** a single object argument `params: TParams` when the hook accepts input; type named `TParams`. Hooks with no inputs omit the parameter.
- **Body:** destructure `params` immediately after the signature; follow [props order](#props-order) inside `TParams`.

```tsx
// ✅ Nested hook — named export
type TParams = {
  updateTextPrompt: (text: string) => void;
};

export function useVoiceInput(params: TParams) {
  const { updateTextPrompt } = params;

  // hook logic

  return { ... };
}

// ✅ Nested hook with no parameters
export function useSession() {
  // ...
}

// ✅ Slice-root hook (feature's public API) — default export
export default function useGeolocation() {
  // ...
}
```

```tsx
// ❌ Arrow declaration
export const useVoiceInput = (params: TParams) => { ... };

// ❌ Default export for a nested (hooks/ segment) hook
export default function useVoiceInput(params: TParams) { ... }

// ❌ Positional parameters instead of a params object
export function useVoiceInput(updateTextPrompt: (text: string) => void) { ... }
```

## Naming

### Enums

- Enum **name**: PascalCase (`ToolName`).
- Enum **members**: `SCREAMING_SNAKE_CASE` (`MANAGE_USER_MEMORY`).
- Enum **values** (when strings): `snake_case` literals matching the member semantics (`'manage_user_memory'`).

```ts
export enum ToolName {
  MANAGE_USER_MEMORY = 'manage_user_memory',
}
```

### Constants

All module-level constant literals use `SCREAMING_SNAKE_CASE` and, when exported, `export const` (never `default`). Three scopes by where they're consumed:

1. **Local** — declared at the top of a component/hook file and used only there. Keep it **unexported**.
2. **Slice-scoped** — shared within one slice; put it in that slice's `utils/` segment (`utils/constants.ts`, or a purpose file like `utils/nodeTypes.ts`) and **export** it.
3. **Global** — reusable across slices; lives in `@utils` or `@application` and is **exported**.

```ts
// ✅ Local, file-private (top of a component/hook file)
const MAX_TITLE_LENGTH = 100;

// ✅ Slice-scoped or global — exported
export const DEFAULT_DELAY = 1000;

// ❌ default export for a constant
export default DEFAULT_DELAY;
```

### File and directory naming

- **Directories:** always `kebab-case` (`create-post/`, `text-field/`, `mock-factories/`).
- **Files:** `PascalCase` when the file's main export is a **component, class, enum, model, or interface** (`Button.tsx`, `LoginCase.ts`, `PostModel.ts`). Everything else is `camelCase` (`useCreatePostForm.ts`, `formatLabel.ts`, `constants.ts`, `nodeTypes.ts`).
- A `*.module.scss` mirrors its component's name (`Button.module.scss`); a test mirrors its subject (`Button.test.tsx`).
- Hook files are `camelCase` (`useX.ts`) — the `use` prefix, not PascalCase, even though a slice-root hook is a default export.

### Domain models (`/src/domain/**`)

- Zod object schemas: PascalCase with a **`Model` suffix** (`PostModel`, `PostsListSchema` for non-entity collections).
- Inferred TypeScript types: **`T` prefix** + entity name (`TPost`, `TPostsList`), derived with `z.infer<typeof …>`.
- Colocate schema and type in the same file under `models/` or `schemas/` inside the domain slice.

```ts
import z from 'zod';

export const PostModel = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  body: z.string(),
});

export type TPost = z.infer<typeof PostModel>;
```

```ts
// ❌ Type name without T prefix
export type Post = z.infer<typeof PostModel>;

// ❌ Schema name without Model suffix (for entity objects)
export const Post = z.object({ ... });

// ❌ Duplicating fields by hand instead of inferring
export type TPost = { id: number; userId: number; title: string; body: string };
```

UI prop types (`TProps`, `TVariant`) follow the same **`T` prefix** rule; domain entity types use `T` + entity (`TPost`), not `T` + `Props`.

## One export per file

One component **or** one hook per file — never several in the same file. Split them into their own files (a slice can hold many root files; see [structure.md](./structure.md)). Types, a colocated Zod schema, and file-private constants may sit alongside the thing they describe.

```tsx
// ❌ Two components in one file
export default function Card() { ... }
export function CardHeader() { ... }

// ❌ Two hooks in one file
export function useOpen() { ... }
export function useClose() { ... }
```

## Blank lines

- **No blank lines inside JSX.** If a return block feels like it needs blank-line dividers, that's a signal to decompose the component (see [structure.md](./structure.md)), not to space it out.
- **Blank lines in logic are encouraged.** In a function body, separate semantic blocks with a blank line so it reads in steps — don't stack every statement together.

```tsx
// ❌ Blank lines inside JSX
return (
  <Flex vertical gap={16}>
    <Heading>Title</Heading>

    <Button>Save</Button>
  </Flex>
);

// ✅ Blank lines grouping steps in logic
export function useThing(params: TParams) {
  const { id } = params;

  const control = useForm({ ... });

  const handleSubmit = async () => { ... };

  return { control, handleSubmit };
}
```

## Comments

**The default is zero.** Not "few" — zero. A file with no comments is the normal, expected outcome; a comment is an exception you have to earn.

### The test

> Could a reader who **fully understands this code** still change it wrongly?

Only "yes" earns a comment. That's a high bar, and it is deliberately not about how the code reads — if the code is hard to follow, the fix is a better name, a smaller function, or an extracted constant, never an annotation. A comment that explains your own code is a bug report against the code.

Things that pass the test:

- A workaround for a third-party or browser bug — the code looks pointless, and deleting it silently breaks something. Link the issue if you have it.
- A contract the types don't carry: a server sending a value in an unexpected shape, a field that looks optional but never is, an ordering the API requires.
- An invariant enforced elsewhere — this code is only correct because of something in another file.
- A rejected alternative: the obvious simpler version was tried and doesn't work, and the next person will otherwise "simplify" it back.

Note what these have in common: the danger comes from **knowledge that isn't in the file**. Reading harder wouldn't have saved the reader.

### Never write

- **JSDoc / docblocks** on components, hooks, utils, types, or props. The signature and the types are the documentation. `@param`, `@returns`, and a one-line summary of the function name are pure noise.
- **Restating the line below** — `// fetch the user`, `// increment counter`, `// early return`.
- **Label or divider comments** — `// state`, `// handlers`, `// --- helpers ---`. Use a blank line, or split the file (see [structure.md](./structure.md)).
- **"This is clever / tricky / non-obvious."** That's a signal to rename, extract, or simplify. A comment freezes the confusing version in place and makes it permanent.
- **`TODO` / `FIXME`.** Do it, or open an issue. A TODO in the codebase is a note nobody will ever read.
- **Commented-out code.** Delete it — git remembers.
- **Narrating a decision you just made** — `// using useMemo here for performance`, `// client component because of the click handler`. That's a PR description, not a comment.
- **Bare `// eslint-disable-*`.** Disabling a rule without saying why is the one place a comment is mandatory — `// eslint-disable-next-line <rule> -- <reason>`.

### Before you finish

**Re-read your own diff and delete comments.** For each one you added, say why it passes [the test](#the-test); if you can't, remove the line. Comments are easiest to write while you're reasoning about the code and easiest to see as noise a minute later — this pass is where most of them should die.

If you were **explicitly asked** for a comment, write it. That's the only other case.

```tsx
// ❌ Docblock restating the signature
/**
 * Formats a price.
 * @param value - the price
 * @returns the formatted price
 */
export function formatPrice(value: number): string { ... }

// ❌ Restates the line
// increment the counter
counter += 1;

// ❌ Justifies a clever expression instead of naming it
// bit shift is faster than Math.floor here
const page = offset >> 4;

// ✅ Name it instead — no comment needed
const page = Math.floor(offset / ITEMS_PER_PAGE);

// ✅ Knowledge that genuinely lives outside the file
// Safari fires `change` before the file list settles: https://bugs.webkit.org/show_bug.cgi?id=123456
await waitForNextFrame();
```

## See also

- [structure.md](./structure.md) — slice/segment layout, public API, decomposition.
- [ui.md](./ui.md) — UI layer layout, tiers, and anti-patterns.
- [styling.md](./styling.md) — SCSS module conventions, `@assets/*` aliases.
- [forms.md](./forms.md) — the form hook (`use<Entity>Form`) and field molecules.
- [architecture.md](./architecture.md) — where domain models and enums live in the layer map.
