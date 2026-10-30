import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';

import { createTestQueryClient } from '@application/test/createTestQueryClient';

type TRenderWithQueryClientOptions = Omit<RenderOptions, 'wrapper'> & {
  queryClient?: QueryClient;
};

export function renderWithQueryClient(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: TRenderWithQueryClientOptions = {},
) {
  function Wrapper(props: { children: ReactNode }) {
    const { children } = props;

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
