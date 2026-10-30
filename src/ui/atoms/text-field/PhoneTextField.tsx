import { TTextFieldProps } from '@ui/atoms/text-field/TextField';
import TextFieldMasked from '@ui/atoms/text-field/TextFieldMasked';

import classes from './PhoneTextField.module.scss';

export default function PhoneTextField(props: TTextFieldProps) {
  return (
    <TextFieldMasked
      mask='(000) 000-00-00'
      boxSize='large'
      classNameInput={classes.input_inner}
      prefix={<span className={classes.prefix}>+7</span>}
      placeholder='(000) 000-00-00'
      clearable
      {...props}
    />
  );
}
