import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import CreatePost from './CreatePost';

const { createPostMock } = vi.hoisted(() => ({ createPostMock: vi.fn() }));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: {
      createPost: createPostMock,
    },
  },
}));

describe('CreatePost', () => {
  beforeEach(() => {
    createPostMock.mockClear();
    createPostMock.mockResolvedValue({ id: 1, userId: 1, title: 'Title', body: 'Body' });
  });

  test('confirming valid data sends it to the backend and closes on success', async () => {
    const onClose = vi.fn();

    renderWithQueryClient(<CreatePost open onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Заголовок'), { target: { value: 'Title' } });
    fireEvent.change(screen.getByLabelText('Текст'), { target: { value: 'Body' } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() => {
      expect(createPostMock).toHaveBeenCalledWith({ title: 'Title', body: 'Body' });
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test('shows a loading state on the submit button while the request is in flight', async () => {
    let resolveCreatePost: (post: unknown) => void = () => {};
    createPostMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreatePost = resolve;
        }),
    );

    renderWithQueryClient(<CreatePost open onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Заголовок'), { target: { value: 'Title' } });
    fireEvent.change(screen.getByLabelText('Текст'), { target: { value: 'Body' } });

    const submitButton = screen.getByRole('button', { name: 'Создать' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    resolveCreatePost({ id: 1, userId: 1, title: 'Title', body: 'Body' });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
