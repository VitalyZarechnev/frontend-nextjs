import { waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import { useLoginForm } from './useLoginForm';

const { replace, loginMock, getMeMock, setAccessTokenMock, setProfileMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  loginMock: vi.fn(),
  getMeMock: vi.fn(),
  setAccessTokenMock: vi.fn(),
  setProfileMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    authDatasource: {
      login: loginMock,
    },
    usersDatasource: {
      getMe: getMeMock,
    },
    tokenManager: {
      setAccessToken: setAccessTokenMock,
    },
    profileStorage: {
      setProfile: setProfileMock,
    },
  },
}));

const setupUseLoginForm = () => {
  const hookReturn = {};

  const TestComponent = () => {
    Object.assign(hookReturn, useLoginForm());
    return null;
  };

  renderWithQueryClient(<TestComponent />);

  return hookReturn as ReturnType<typeof useLoginForm>;
};

describe('useLoginForm Hook', () => {
  let hookResult: ReturnType<typeof useLoginForm>;

  beforeEach(() => {
    replace.mockClear();
    loginMock.mockResolvedValue(undefined);
    getMeMock.mockResolvedValue({ id: '1', username: 'test-user' });
    hookResult = setupUseLoginForm();
  });

  test('successfully submits', async () => {
    hookResult.handleSubmit({ email: 'email@mail.com', password: 'some-password' });

    await waitFor(
      () => {
        expect(replace).toHaveBeenCalledTimes(1);
      },
      {
        timeout: 3000,
      },
    );
  });
});
