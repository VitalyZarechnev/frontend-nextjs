import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import DeletePost from './DeletePost';

const { deletePostMock } = vi.hoisted(() => ({ deletePostMock: vi.fn() }));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: {
      deletePost: deletePostMock,
    },
  },
}));

describe('DeletePost', () => {
  beforeEach(() => {
    deletePostMock.mockClear();
    deletePostMock.mockResolvedValue(undefined);
  });

  test('confirming deletion sends a delete request and closes', async () => {
    const onClose = vi.fn();
    const onDeleted = vi.fn();

    renderWithQueryClient(<DeletePost postId={1} open onClose={onClose} onDeleted={onDeleted} />);

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => {
      expect(deletePostMock).toHaveBeenCalledWith(1);
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onDeleted).toHaveBeenCalledTimes(1);
    });
  });

  test('shows a loading state on the confirm button while the request is in flight', async () => {
    let resolveDeletePost: (value: unknown) => void = () => {};
    deletePostMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDeletePost = resolve;
        }),
    );

    const onClose = vi.fn();

    renderWithQueryClient(<DeletePost postId={1} open onClose={onClose} onDeleted={vi.fn()} />);

    const confirmButton = screen.getByRole('button', { name: 'Удалить' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(confirmButton).toBeDisabled();
    });
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();

    resolveDeletePost(undefined);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(confirmButton).not.toBeDisabled();
  });

  test('cancelling closes without deleting', () => {
    const onClose = vi.fn();
    const onDeleted = vi.fn();

    renderWithQueryClient(<DeletePost postId={1} open onClose={onClose} onDeleted={onDeleted} />);

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(deletePostMock).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
