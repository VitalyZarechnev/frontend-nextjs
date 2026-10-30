import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import classes from './But.module.scss';

type TProps = PropsWithChildren & {
  as?: 'span' | 'p' | 'h5' | 'h6';
  className?: string;
};

export default function But(props: TProps) {
  const { as: Tag = 'p', className, children } = props;

  return <Tag className={clsx(classes.but, className)}>{children}</Tag>;
}
