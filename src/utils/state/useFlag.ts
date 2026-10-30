import { useCallback, useState } from 'react';

type TParams = {
  initial?: boolean;
};

export function useFlag(params?: TParams) {
  const { initial = false } = params ?? {};

  const [flag, setFlag] = useState(initial);

  const enable = useCallback(() => setFlag(true), []);
  const disable = useCallback(() => setFlag(false), []);
  const toggle = useCallback(() => setFlag((prev) => !prev), []);

  return { flag, enable, disable, toggle };
}
