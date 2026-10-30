import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import { createPost } from '@data/posts/mock-factories/postsList';

import { PostNotFoundError } from '@domain/posts/errors/PostNotFoundError';

import PostDetail from './PostDetail';

const { replace, getPostByIdMock, deletePostMock } = vi.hoisted(() => ({
  replace: vi.fn(),
  getPostByIdMock: vi.fn(),
  deletePostMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: {
      getPostById: getPostByIdMock,
      deletePost: deletePostMock,
    },
  },
}));

describe('PostDetail', () => {
  beforeEach(() => {
    replace.mockClear();
    getPostByIdMock.mockClear();
    deletePostMock.mockClear();
  });

  test('shows the title and body of an existing post', async () => {
    const post = createPost({ id: 1, title: 'A post', body: 'Its body' });
    getPostByIdMock.mockResolvedValue(post);

    renderWithQueryClient(<PostDetail id='1' />);

    await waitFor(() => {
      expect(screen.getByText('A post')).toBeInTheDocument();
    });
    expect(screen.getByText('Its body')).toBeInTheDocument();
  });

  test('shows a not-found state for a nonexistent post', async () => {
    getPostByIdMock.mockRejectedValue(new PostNotFoundError());

    renderWithQueryClient(<PostDetail id='999' />);

    await waitFor(() => {
      expect(screen.getByText('Пост не найден')).toBeInTheDocument();
    });
  });

  test('triggering edit opens the edit flow pre-filled with this post', async () => {
    const post = createPost({ id: 1, title: 'A post', body: 'Its body' });
    getPostByIdMock.mockResolvedValue(post);

    renderWithQueryClient(<PostDetail id='1' />);

    await waitFor(() => {
      expect(screen.getByText('A post')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }));

    expect(screen.getByLabelText('Заголовок')).toHaveValue('A post');
    expect(screen.getByLabelText('Текст')).toHaveValue('Its body');
  });

  test('triggering delete requires confirmation, and confirming navigates back to the posts list', async () => {
    const post = createPost({ id: 1, title: 'A post', body: 'Its body' });
    getPostByIdMock.mockResolvedValue(post);
    deletePostMock.mockResolvedValue(undefined);

    renderWithQueryClient(<PostDetail id='1' />);

    await waitFor(() => {
      expect(screen.getByText('A post')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(deletePostMock).not.toHaveBeenCalled();

    const confirmButtons = screen.getAllByRole('button', { name: 'Удалить' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(deletePostMock).toHaveBeenCalledWith(1);
    });
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/posts');
    });
  });
});
