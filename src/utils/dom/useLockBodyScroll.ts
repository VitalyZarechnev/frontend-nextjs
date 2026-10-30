import { useEffect } from 'react';

type TParams = {
  locked?: boolean;
};

export function useLockBodyScroll(params?: TParams) {
  const { locked = true } = params ?? {};

  useEffect(() => {
    if (!locked) return;

    const initialOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = initialOverflow;
    };
  }, [locked]);
}
