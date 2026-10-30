import { ButtonHTMLAttributes, forwardRef, PropsWithChildren } from 'react';
import clsx from 'clsx';

import classes from './GhostButton.module.scss';

type THoverMode = 'color' | 'opacity';

type TProps = PropsWithChildren &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    hoverMode?: THoverMode;
  };

const GhostButton = forwardRef<HTMLButtonElement, TProps>((props, ref) => {
  const { hoverMode = 'color', type = 'button', className, children, ...rest } = props;

  return (
    <button
      ref={ref}
      type={type}
      className={clsx(classes.ghost_button, classes[`ghost_button__hover_mode_${hoverMode}`], className)}
      {...rest}
    >
      {children}
    </button>
  );
});

GhostButton.displayName = 'GhostButton';

export default GhostButton;
