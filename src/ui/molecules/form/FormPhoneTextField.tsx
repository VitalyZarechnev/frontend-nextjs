import { ChangeEvent } from 'react';
import { useController, useFormContext, useFormState } from 'react-hook-form';

import PhoneTextField from '@ui/atoms/text-field/PhoneTextField';
import { TTextFieldProps } from '@ui/atoms/text-field/TextField';

type TProps = TTextFieldProps & {
  name: string;
};

export default function FormPhoneTextField(props: TProps) {
  const { name, onChange, ...rest } = props;

  const { control } = useFormContext();
  const formState = useFormState();
  const { field, fieldState } = useController({
    name,
    control,
    defaultValue: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    field.onChange(e.target.value);
    onChange?.(e);
  };

  return (
    <PhoneTextField
      name={name}
      value={field.value}
      onChange={handleChange}
      error={!!fieldState?.error}
      errorText={formState.errors[name]?.message?.toString()}
      {...rest}
    />
  );
}
