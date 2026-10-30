import { CSSProperties, ElementType, ReactNode, useMemo } from 'react';
import clsx from 'clsx';

import classes from './Flex.module.scss';

type TProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  vertical?: boolean;
  wrap?: CSSProperties['flexWrap'];
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline';
  alignContent?: 'stretch' | 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  grow?: CSSProperties['flexGrow'];
};

export default function Flex(props: TProps) {
  const { children, as: Tag = 'div', className, style, vertical, wrap, justify, align, alignContent, gap, rowGap, columnGap, grow } = props;

  const classNames = useMemo<string[]>(() => {
    const classNames: string[] = [];

    if (vertical) classNames.push(classes.direction_column);

    if (wrap) classNames.push(classes[`wrap_${wrap}`]);
    if (justify) classNames.push(classes[`justify_${justify}`]);
    if (align) classNames.push(classes[`align_${align}`]);
    if (alignContent) classNames.push(classes[`align-content_${alignContent}`]);

    return classNames;
  }, [vertical, wrap, justify, align, alignContent]);

  const styleFinal = useMemo<CSSProperties>(() => {
    return {
      ...(gap && { gap }),
      ...(rowGap && { rowGap }),
      ...(columnGap && { columnGap }),
      ...(grow && { flexGrow: grow }),
      ...style,
    };
  }, [gap, rowGap, columnGap, grow, style]);

  return (
    <Tag style={styleFinal} className={clsx(classes.flex, classNames, className)}>
      {children}
    </Tag>
  );
}
