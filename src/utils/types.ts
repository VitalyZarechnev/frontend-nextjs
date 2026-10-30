type ArrayOfLength<N extends number, A extends unknown[] = []> = A['length'] extends N ? A : ArrayOfLength<N, [...A, unknown]>;

export type Inc<N extends number> = number & [...ArrayOfLength<N>, unknown]['length'];

export type Dec<N extends number> = number & (ArrayOfLength<N> extends [...infer A, unknown] ? A['length'] : -1);

export type Range<Start extends number, End extends number> = number & (Start extends End ? never : Start | Range<Inc<Start>, End>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => unknown;
