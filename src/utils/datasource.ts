import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

import { AnyFunction } from '@utils/types';

/**
 * Maps each async method on `T` to a paired React Query hook:
 *
 *   class FooImpl { async getBar(id: number): Promise<Bar> { ... } }
 *
 *   → DataHooks<FooImpl> = {
 *       useGetBar(args?: [number], opts?: ...): UseQueryResult<Bar>
 *     }
 *
 * Each hook is a stable, top-level function reference (created once at
 * `createDatasource` call), satisfying React Compiler's "hooks must be the
 * same function on every render" rule.
 */
export type DataHooks<T> = {
  [K in keyof T as K extends string ? (T[K] extends AnyFunction ? `use${Capitalize<K>}` : never) : never]: T[K] extends AnyFunction
    ? (
        args?: Parameters<T[K]>,
        opts?: Omit<UseQueryOptions<Awaited<ReturnType<T[K]>>>, 'queryKey' | 'queryFn'>,
      ) => UseQueryResult<Awaited<ReturnType<T[K]>>>
    : never;
};

function collectMethodNames(source: object): string[] {
  const names = new Set<string>();

  // Own properties (covers class fields assigned to functions).
  for (const key of Object.getOwnPropertyNames(source)) {
    if (key.startsWith('_')) continue;
    if (typeof (source as Record<string, unknown>)[key] === 'function') names.add(key);
  }

  // Prototype chain (covers regular class methods).
  let proto = Object.getPrototypeOf(source);
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor' || key.startsWith('_')) continue;
      if (typeof (source as Record<string, unknown>)[key] === 'function') names.add(key);
    }
    proto = Object.getPrototypeOf(proto);
  }

  return Array.from(names);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Wraps a datasource instance so each of its async methods is exposed as a
 * `use<Method>` React Query hook with auto-derived query keys.
 *
 * Hook signature: `(args?: Parameters<method>, opts?: UseQueryOptions): UseQueryResult`
 * Query key: `[<ClassName>.<methodName>, ...args]`.
 */
export function createDatasource<T extends object>(source: T): DataHooks<T> {
  const className = source.constructor.name;
  const hooks: Record<string, AnyFunction> = {};

  for (const methodName of collectMethodNames(source)) {
    const method = (source as Record<string, AnyFunction>)[methodName];
    const hookName = `use${capitalize(methodName)}`;

    hooks[hookName] = function useDataHook(
      args: unknown[] = [],
      opts: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'> = {},
    ): UseQueryResult<unknown> {
      // `source` and `method` are captured from createDatasource's closure
      // and are stable module-level references — they identify the data
      // source and don't belong in queryKey (className already identifies them).
      // eslint-disable-next-line @tanstack/query/exhaustive-deps
      return useQuery({
        ...opts,
        queryKey: [`${className}.${methodName}`, ...args],
        queryFn: () => method.apply(source, args) as Promise<unknown>,
      });
    };
  }

  return hooks as DataHooks<T>;
}
