import { useMutation, UseMutationOptions } from '@tanstack/react-query';

type TUseCase<TInput extends unknown[] = unknown[], TOutput = unknown> = {
  execute(...args: TInput): Promise<TOutput>;
};

class UseCaseWrapper<TInput extends unknown[], TOutput> {
  constructor(readonly delegate: TUseCase<TInput, TOutput>) {}

  useMutation(opts?: Omit<UseMutationOptions<Awaited<TOutput>, unknown, TInput, unknown>, 'mutationFn'>) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMutation<Awaited<TOutput>, unknown, TInput, unknown>({
      ...opts,
      mutationFn: (input: TInput) => this.delegate.execute(...input) as Promise<Awaited<TOutput>>,
    });
  }
}

export function createUsecase<TInput extends unknown[], TOutput>(impl: TUseCase<TInput, TOutput>) {
  return new UseCaseWrapper<TInput, TOutput>(impl);
}
