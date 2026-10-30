import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import { createPost } from '@data/posts/mock-factories/postsList';

import EditPost from './EditPost';

const { updatePostMock } = vi.hoisted(() => ({ updatePostMock: vi.fn() }));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: {
      updatePost: updatePostMock,
    },
  },
}));

describe('EditPost', () => {
  const post = createPost({ id: 5, title: 'Old title', body: 'Old body' });

  beforeEach(() => {
    updatePostMock.mockClear();
    updatePostMock.mockResolvedValue({ ...post, title: 'New title', body: 'New body' });
  });

  test('opens pre-filled with the post current title and body', () => {
    renderWithQueryClient(<EditPost post={post} open onClose={vi.fn()} />);

    expect(screen.getByLabelText('Заголовок')).toHaveValue('Old title');
    expect(screen.getByLabelText('Текст')).toHaveValue('Old body');
  });

  test('confirming changes sends them to the backend and closes on success', async () => {
    const onClose = vi.fn();

    renderWithQueryClient(<EditPost post={post} open onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Заголовок'), { target: { value: 'New title' } });
    fireEvent.change(screen.getByLabelText('Текст'), { target: { value: 'New body' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(updatePostMock).toHaveBeenCalledWith(5, { title: 'New title', body: 'New body' });
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  test('shows a loading state on the submit button while the request is in flight', async () => {
    let resolveUpdatePost: (post: unknown) => void = () => {};
    updatePostMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdatePost = resolve;
        }),
    );

    renderWithQueryClient(<EditPost post={post} open onClose={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: 'Сохранить' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    resolveUpdatePost({ ...post, title: 'New title', body: 'New body' });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
