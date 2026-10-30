import { ComponentPropsWithoutRef, ElementType } from 'react';
import clsx from 'clsx';

import classes from './Subscript.module.scss';

type AllowedTags = 'span' | 'p' | 'label';

type TProps<T extends AllowedTags> = {
  as?: T;
  weight?: 'normal' | 'medium';
  className?: string;
} & ComponentPropsWithoutRef<T>;

export default function Subscript<T extends AllowedTags = 'p'>(props: TProps<T>) {
  const { as, weight = 'normal', className, children, ...restProps } = props;

  const Tag = (as || 'p') as ElementType;

  return (
    <Tag
      className={clsx(
        classes.subscript,
        {
          [classes.subscript__weight_medium]: weight === 'medium',
        },
        className,
      )}
      {...(restProps as ComponentPropsWithoutRef<AllowedTags>)}
    >
      {children}
    </Tag>
  );
}
