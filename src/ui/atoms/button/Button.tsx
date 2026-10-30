import { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

import Spinner from '@ui/atoms/spinner/Spinner';
import But from '@ui/atoms/typography/But';
import Subscript from '@ui/atoms/typography/Subscript';

import classes from './Button.module.scss';

type TVariant = 'core' | 'main' | 'secondary' | 'no-bg' | 'outlined';
type TSize = 'medium' | 'small';

type TProps = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant: TVariant;
    size?: TSize;
    loading?: boolean;
    icon?: ReactNode;
  };

export default function Button(props: TProps) {
  const { variant, type = 'button', size = 'medium', loading = false, icon, disabled = false, className, children, ...rest } = props;

  const TextTag = size === 'medium' ? But : Subscript;

  return (
    <button
      className={clsx(classes.button, classes[`button_variant_${variant}`], { [classes[`button_size_${size}`]]: size }, className)}
      type={type}
      disabled={disabled || loading}
      {...rest}
    >
      {!loading ? icon : <Spinner className={classes.button_spinner} size={24} />}
      <TextTag as='span'>{children}</TextTag>
    </button>
  );
}
