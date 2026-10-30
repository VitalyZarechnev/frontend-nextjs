import { AnchorHTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'clsx';
import LinkNext from 'next/link';

import classes from './Link.module.scss';

type TProps = PropsWithChildren & {
  href: string;
  as?: 'a' | 'LinkNext';
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  className?: string;
};

export default function Link(props: TProps) {
  const { href, as = 'a', target, className, children } = props;

  const Component = as === 'LinkNext' ? LinkNext : as;

  return (
    <Component href={href} target={target} className={clsx(classes.link, className)}>
      {children}
    </Component>
  );
}
