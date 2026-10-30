import { fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import { createPost } from '@data/posts/mock-factories/postsList';

import PostListItem from './PostListItem';

const { updatePostMock, deletePostMock } = vi.hoisted(() => ({
  updatePostMock: vi.fn(),
  deletePostMock: vi.fn(),
}));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: {
      updatePost: updatePostMock,
      deletePost: deletePostMock,
    },
  },
}));

describe('PostListItem', () => {
  const post = createPost({ id: 3, title: 'A post', body: 'Its body' });

  beforeEach(() => {
    updatePostMock.mockClear();
    deletePostMock.mockClear();
    deletePostMock.mockResolvedValue(undefined);
  });

  test('renders the post title and body', () => {
    renderWithQueryClient(<PostListItem post={post} />);

    expect(screen.getByText('A post')).toBeInTheDocument();
    expect(screen.getByText('Its body')).toBeInTheDocument();
  });

  test('triggering edit opens the edit flow pre-filled with this post', () => {
    renderWithQueryClient(<PostListItem post={post} />);

    fireEvent.click(screen.getByRole('button', { name: 'Редактировать' }));

    expect(screen.getByLabelText('Заголовок')).toHaveValue('A post');
    expect(screen.getByLabelText('Текст')).toHaveValue('Its body');
  });

  test('triggering delete requires confirmation before calling the delete usecase', () => {
    renderWithQueryClient(<PostListItem post={post} />);

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(screen.getByText('Удалить пост?')).toBeInTheDocument();
    expect(deletePostMock).not.toHaveBeenCalled();
  });

  test('confirming delete sends a delete request for this post', async () => {
    renderWithQueryClient(<PostListItem post={post} />);

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    const confirmButtons = screen.getAllByRole('button', { name: 'Удалить' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(deletePostMock).toHaveBeenCalledWith(3);
    });
  });
});
