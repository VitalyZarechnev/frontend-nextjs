import { PropsWithChildren } from 'react';
import { FieldValues, FormProvider, SubmitHandler, UseFormReturn } from 'react-hook-form';

type TProps<T extends FieldValues> = {
  methods: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  className?: string;
};

export default function Form<T extends FieldValues>(props: PropsWithChildren<TProps<T>>) {
  const { methods, onSubmit, children, className } = props;

  const { handleSubmit } = methods;

  return (
    <FormProvider {...methods}>
      <form className={className} onSubmit={handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}
