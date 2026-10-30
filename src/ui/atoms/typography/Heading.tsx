import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import classes from './Heading.module.scss';

type TProps = PropsWithChildren & {
  variant: 'h1' | 'h2' | 'h3';
  className?: string;
};

export default function Heading(props: TProps) {
  const { variant, className, children } = props;

  const Tag = variant;

  return <Tag className={clsx(classes.heading, classes[`heading__${variant}`], className)}>{children}</Tag>;
}
