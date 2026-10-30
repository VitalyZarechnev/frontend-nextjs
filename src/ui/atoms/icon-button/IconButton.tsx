import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

import Spinner from '@ui/atoms/spinner/Spinner';

import classes from './IconButton.module.scss';

type TButtonType = 'button' | 'reset' | 'submit';
type TVariant = 'core' | 'main' | 'secondary' | 'ghost' | 'outlined';
type TSize = 'small' | 'medium';

type TProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: TVariant;
  type?: TButtonType;
  size?: TSize;
  loading?: boolean;
  icon?: ReactNode;
};

export default function IconButton(props: TProps) {
  const { variant, type = 'button', size, loading = false, disabled = false, icon, className, ...rest } = props;

  return (
    <button
      className={clsx(
        classes.icon_button,
        classes[`icon_button_variant_${variant}`],
        { [classes[`icon_button_size_${size}`]]: size },
        className,
      )}
      type={type}
      disabled={disabled || loading}
      {...rest}
    >
      {!loading ? icon : <Spinner className={classes.iconButton_spinner} size={24} />}
    </button>
  );
}
