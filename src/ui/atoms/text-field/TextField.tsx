import { ChangeEvent, InputHTMLAttributes, ReactNode, Ref, useRef, useState } from 'react';
import clsx from 'clsx';

import Flex from '@ui/atoms/flex/Flex';
import GhostButton from '@ui/atoms/ghost-button/GhostButton';
import Subscript from '@ui/atoms/typography/Subscript';
import CrossSmallIcon from '@ui/icons/cross-small.svg';
import LookOffIcon from '@ui/icons/look-off.svg';
import LookOnIcon from '@ui/icons/look-on.svg';
import Collapse from '@ui/transitions/Collapse';

import classes from './TextField.module.scss';

type TVariant = 'white' | 'beige';

export type TTextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> & {
  label?: string;
  boxSize?: 'medium' | 'large';
  clearable?: boolean;
  error?: boolean;
  errorText?: string;
  variant?: TVariant;
  prefix?: ReactNode;
  hideButton?: boolean;
  classNameInput?: string;
  inputRef?: Ref<HTMLInputElement>;
};

export default function TextField(props: TTextFieldProps) {
  const {
    id,
    value,
    type = 'text',
    disabled = false,
    className,
    label,
    boxSize,
    clearable = false,
    error = false,
    errorText,
    variant = 'white',
    prefix,
    hideButton = false,
    classNameInput,
    inputRef: externalInputRef,
    onChange,
    onFocus,
    onBlur,
    ...rest
  } = props;

  const localInputRef = useRef<HTMLInputElement>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleInputRef = (node: HTMLInputElement) => {
    localInputRef.current = node as HTMLInputElement;

    if (typeof externalInputRef === 'function') {
      externalInputRef(node);
    } else if (externalInputRef) {
      // eslint-disable-next-line react-compiler/react-compiler, react-hooks/immutability
      externalInputRef.current = node;
    }
  };

  const isPasswordType = type === 'password';

  const actualInputType = isPasswordVisible ? 'text' : type;

  const valueLength = String(value ?? '').length;
  const showClearButton = clearable && valueLength > 0 && !isPasswordType;

  const handleClear = () => {
    onChange?.({
      target: { value: '' },
    } as ChangeEvent<HTMLInputElement>);

    localInputRef.current?.focus();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <Flex vertical className={className}>
      {label && (
        <Subscript
          as='label'
          htmlFor={id}
          className={clsx(classes.text_field__label, {
            [classes.text_field__label_hidden]: !valueLength,
          })}
        >
          {label}
        </Subscript>
      )}
      <div className={classes.text_field__container}>
        {prefix}
        <input
          {...rest}
          id={id}
          // Merging a forwarded ref requires assigning to `.current`, which the
          // rule treats as a render-time mutation through `handleInputRef`.
          // eslint-disable-next-line react-hooks/immutability
          ref={handleInputRef}
          value={value}
          type={actualInputType}
          disabled={disabled}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          className={clsx(
            classes.text_field__input,
            classes[`text_field__input_variant_${variant}`],
            {
              [classes.text_field__input_size_large]: boxSize === 'large',
              [classes.text_field__input_clearable]: showClearButton || isPasswordType,
              [classes.text_field__input_error]: error,
            },
            classNameInput,
          )}
        />
        {showClearButton && (
          <GhostButton type='button' disabled={disabled} className={classes.text_field__clear} onClick={handleClear} aria-label='Очистить'>
            <CrossSmallIcon />
          </GhostButton>
        )}
        {isPasswordType && !hideButton && (
          <GhostButton
            type='button'
            disabled={disabled}
            className={classes.text_field__password_toggle}
            onClick={togglePasswordVisibility}
            aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Отобразить пароль'}
          >
            {isPasswordVisible ? <LookOnIcon /> : <LookOffIcon />}
          </GhostButton>
        )}
      </div>
      <Collapse isVisible={error && !!errorText}>
        <Subscript as='span' className={classes.text_field__error}>
          {errorText}
        </Subscript>
      </Collapse>
    </Flex>
  );
}
