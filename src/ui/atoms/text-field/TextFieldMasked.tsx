import { ChangeEvent } from 'react';
import { useIMask } from 'react-imask';

import TextField, { TTextFieldProps } from '@ui/atoms/text-field/TextField';

type TProps = TTextFieldProps & {
  mask: string;
};

export default function TextFieldMasked(props: TProps) {
  const { mask, onChange, ...rest } = props;

  const { ref } = useIMask<HTMLInputElement>(
    {
      mask,
    },
    {
      onAccept: (value) => {
        onChange?.({
          target: { value },
        } as ChangeEvent<HTMLInputElement>);
      },
    },
  );

  return <TextField inputRef={ref} onChange={onChange} {...rest} />;
}
