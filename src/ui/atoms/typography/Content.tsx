import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import classes from './Content.module.scss';

type TProps = PropsWithChildren & {
  as?: 'span' | 'p' | 'h5' | 'h6';
  size?: 'normal' | 'mini';
  className?: string;
};

export default function Content(props: TProps) {
  const { as: Tag = 'p', size = 'normal', className, children } = props;

  return <Tag className={clsx(classes.content, classes[`content__size_${size}`], className)}>{children}</Tag>;
}
