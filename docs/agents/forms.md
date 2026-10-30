# Forms

> The one sanctioned way to build a form: atom → molecule → `Form` → feature, with validation in Zod and the submit handler in a dedicated hook. Build every form this way, including custom ones.

## TL;DR

- **Layered chain:** a base input **atom** (`TextField`) → a **form molecule** that binds it to `react-hook-form` context (`FormTextField`) → the **`Form`** molecule (context provider + `<form>`) → a **feature** component that composes fields.
- **State lives in `react-hook-form` context.** Field molecules read/write via `useFormContext` / `useController`. Feature and atom code never touch `useFormContext` directly.
- **Validation is Zod.** One `z.object` schema per form; the form value type is `z.input<typeof schema>`.
- **Schema + defaults + resolver + submit handler live in a dedicated hook**, never in the component. Name it `use<Entity>Form` (e.g. `useLoginForm`, `useCreatePostForm`). It lives in the feature's `hooks/` segment.
- The component stays declarative: call the hook, hand `control` + `handleSubmit` to `<Form>`, list the fields.
- Server submission goes through a use-case (`createUsecase`) called inside the hook — see [data-fetching.md](./data-fetching.md).

## The layers

| Layer               | Location                         | Responsibility                                                                              |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------- |
| Input **atom**      | `src/ui/atoms/…`                 | Dumb, controlled presentational input (`value`, `onChange`, `error`, `errorText`). No RHF.  |
| Field **molecule**  | `src/ui/molecules/form/…`        | Binds one atom to RHF context via `useController`; forwards validation state to the atom.   |
| **`Form`** molecule | `src/ui/molecules/form/Form.tsx` | Wraps children in `FormProvider` and renders `<form onSubmit={…}>`. The context boundary.   |
| **Feature**         | `src/features/<feature>/…`       | Owns the schema + submit logic (in a hook) and composes `Form` + field molecules into a UI. |

Why the split: the atom stays reusable and RHF-agnostic; the binding lives in exactly one place (the field molecule); features declare _what_ fields exist, never _how_ RHF wires them.

## The molecule mechanism (base building blocks)

`Form` is the context boundary — it provides RHF state and applies `handleSubmit`:

```tsx
// src/ui/molecules/form/Form.tsx
import { PropsWithChildren } from 'react';
import { FieldValues, FormProvider, SubmitHandler, UseFormReturn } from 'react-hook-form';

type TProps<T extends FieldValues> = {
  methods: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  className?: string;
};

export default function Form<T extends FieldValues>(props: PropsWithChildren<TProps<T>>) {
  const { methods, onSubmit, children, className } = props;

  return (
    <FormProvider {...methods}>
      <form className={className} onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}
```

A field molecule binds one atom to the context — it is the **only** place `useController` / `useFormContext` appear:

```tsx
// src/ui/molecules/form/FormTextField.tsx
import { ChangeEvent } from 'react';
import { useController, useFormContext, useFormState } from 'react-hook-form';

import TextField, { TTextFieldProps } from '@ui/atoms/text-field/TextField';

type TProps = TTextFieldProps & {
  name: string;
};

export default function FormTextField(props: TProps) {
  const { name, onChange, ...rest } = props;

  const { control } = useFormContext();
  const formState = useFormState();
  const { field, fieldState } = useController({ name, control, defaultValue: '' });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    field.onChange(event.target.value);
    onChange?.(event);
  };

  return (
    <TextField
      name={name}
      value={field.value ?? ''}
      error={!!fieldState.error}
      errorText={formState.errors[name]?.message?.toString()}
      onChange={handleChange}
      onBlur={field.onBlur}
      {...rest}
    />
  );
}
```

A custom field (date picker, select, masked input) follows the same shape: wrap the atom, call `useController`, map `fieldState.error` onto the atom's `error` / `errorText`. Add it under `src/ui/molecules/form/`.

## The form hook (`use<Entity>Form`)

The hook is the single owner of schema, defaults, resolver, the mutation, and the submit handler. It lives in the feature's `hooks/` segment and is a **named** export (`export function` — nested hooks are never default exports; see [code-style.md](./code-style.md#hooks)).

Submitting is an **imperative action**, so the request is a use-case wrapped with `createUsecase` (not a `createDatasource` query — see [data-fetching.md](./data-fetching.md)). The use-case lives in the Domain layer:

```ts
// src/domain/posts/usecases/CreatePostCase.ts
export class CreatePostCase {
  constructor(private _postsDatasource: IPostsDatasource) {}

  async execute(title: string, body: string): Promise<TPost> {
    return this._postsDatasource.createPost({ title, body });
  }
}
```

The hook wires that use-case at module top-level, then calls `mutate(...)` from the submit handler:

```ts
// src/features/create-post/hooks/useCreatePostForm.ts
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { registry } from '@application/di/AppRegistry';

import { CreatePostCase } from '@domain/posts/usecases/CreatePostCase';

import { createUsecase } from '@utils/usecase';

const createPostCase = createUsecase(new CreatePostCase(registry.postsDatasource));

const schema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(100),
  body: z.string().trim().min(1, 'Enter some text').max(1000),
});

export type TCreatePostForm = z.input<typeof schema>;

type TParams = {
  onSuccess?: () => void;
};

export function useCreatePostForm(params?: TParams) {
  const { onSuccess } = params ?? {};

  const { mutate: createPost, isPending } = createPostCase.useMutation();

  const control = useForm<TCreatePostForm>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      body: '',
    },
    resolver: zodResolver(schema),
  });

  const handleSubmit = async (values: TCreatePostForm): Promise<void> => {
    createPost([values.title, values.body], {
      onSuccess: () => {
        control.reset();
        onSuccess?.();
      },
    });
  };

  return {
    control,
    isPending,
    handleSubmit,
  };
}
```

Conventions:

- **Hook name:** `use<Entity>Form` — matches the file name; `use` prefix; camelCase.
- **Value type:** `T<Entity>Form = z.input<typeof schema>` — derived from the schema, never hand-written.
- **Schema colocated** in the same file, module-scoped `const schema` (not exported unless another module needs it).
- **Request = use-case.** Wire `createUsecase(...)` once at module top-level; call `mutate(...)` inside the handler. Expose `isPending` so the component can disable/spin the submit button.
- **`handleSubmit`** here is the _on-valid-values_ callback. `Form` applies RHF's own `handleSubmit(onSubmit)` internally, so validation runs before this fires; reset/notify on the mutation's `onSuccess`.

## The feature component

Declarative: call the hook, pass `control` + `handleSubmit` to `Form`, list the fields. No schema, no `useForm`, no `useFormContext`.

```tsx
// src/features/create-post/CreatePost.tsx
'use client';

import { TCreatePostForm, useCreatePostForm } from '@features/create-post/hooks/useCreatePostForm';

import Button from '@ui/atoms/button/Button';
import Flex from '@ui/atoms/flex/Flex';
import Form from '@ui/molecules/form/Form';
import FormTextField from '@ui/molecules/form/FormTextField';

type TProps = {
  onSuccess?: () => void;
};

export default function CreatePost(props: TProps) {
  const { onSuccess } = props;
  const { control, isPending, handleSubmit } = useCreatePostForm({ onSuccess });

  return (
    <Form<TCreatePostForm> methods={control} onSubmit={handleSubmit}>
      <Flex vertical gap={16}>
        <FormTextField name='title' label='Title' placeholder='Title' />
        <FormTextField name='body' label='Text' placeholder='Text' />
        <Button variant='main' type='submit' disabled={isPending} loading={isPending}>
          Create
        </Button>
      </Flex>
    </Form>
  );
}
```

## Anti-patterns

```tsx
// ❌ useForm / schema / submit handler inside the component — move them to use<Entity>Form
export default function CreatePost() {
  const control = useForm({ resolver: zodResolver(schema) });
  const onSubmit = (values) => { ... };
}

// ❌ Reaching into RHF context outside a field molecule
function TitleField() {
  const { register } = useFormContext(); // couples feature/atom to react-hook-form
}

// ❌ Manual validation instead of a Zod schema
if (!values.title) setError('title', 'required'); // use z.object + zodResolver

// ❌ Hand-written form value type
type TCreatePostForm = { title: string; body: string }; // use z.input<typeof schema>

// ❌ Raw <form> / raw <input> in a feature — always go through Form + field molecules
<form onSubmit={...}><input name='title' /></form>;

// ❌ Default-exporting a nested form hook
export default function useCreatePostForm() { ... } // nested hooks are named exports
```

## See also

- [code-style.md](./code-style.md) — hook export rules, `TParams`, naming.
- [ui.md](./ui.md) — where atoms and form molecules live in the tier model.
- [data-fetching.md](./data-fetching.md) — calling a use-case from the submit handler.
- [structure.md](./structure.md) — feature slice/segment layout (`hooks/` segment, public root).
