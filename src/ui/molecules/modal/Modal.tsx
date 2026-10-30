'use client';

import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

import IconButton from '@ui/atoms/icon-button/IconButton';
import CrossSmallIcon from '@ui/icons/cross-small.svg';
import Fade from '@ui/transitions/Fade';

import { useLockBodyScroll } from '@utils/dom/useLockBodyScroll';
import { isBrowser } from '@utils/environment/isBrowser';
import { useKeyDown } from '@utils/keyboard/useKeyDown';

import classes from './Modal.module.scss';

type TProps = PropsWithChildren<{
  open: boolean;
  className?: string;
  onClose: () => void;
}>;

export default function Modal(props: TProps) {
  const { open, className, children, onClose } = props;

  useKeyDown('Escape', onClose, open);
  useLockBodyScroll({ locked: open });

  if (!isBrowser()) return null;

  return createPortal(
    <Fade isVisible={open} className={classes.modal__overlay}>
      <div className={classes.modal__backdrop} onClick={onClose} />
      <div className={clsx(classes.modal__container, className)} role='dialog' aria-modal='true'>
        <IconButton variant='ghost' className={classes.modal__close} onClick={onClose} aria-label='Закрыть' icon={<CrossSmallIcon />} />
        {children}
      </div>
    </Fade>,
    document.body,
  );
}
