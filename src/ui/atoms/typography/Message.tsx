import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import classes from './Message.module.scss';

type TProps = PropsWithChildren & {
  as?: 'span' | 'p';
  weight?: 'normal' | 'medium';
  className?: string;
};

export default function Message(props: TProps) {
  const { as: Tag = 'p', weight = 'normal', className, children } = props;

  return (
    <Tag
      className={clsx(
        classes.message,
        {
          [classes.message__weight_medium]: weight === 'medium',
        },
        className,
      )}
    >
      {children}
    </Tag>
  );
}
