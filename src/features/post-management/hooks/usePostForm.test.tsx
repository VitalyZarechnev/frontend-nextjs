import { waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import { createPost } from '@data/posts/mock-factories/postsList';

import { usePostForm } from './usePostForm';

const { createPostMock, updatePostMock } = vi.hoisted(() => ({
  createPostMock: vi.fn(),
  updatePostMock: vi.fn(),
}));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: {
      createPost: createPostMock,
      updatePost: updatePostMock,
    },
  },
}));

const setupUsePostForm = (params: Parameters<typeof usePostForm>[0]) => {
  const hookReturn = {};

  const TestComponent = () => {
    Object.assign(hookReturn, usePostForm(params));
    return null;
  };

  renderWithQueryClient(<TestComponent />);

  return hookReturn as ReturnType<typeof usePostForm>;
};

describe('usePostForm Hook', () => {
  beforeEach(() => {
    createPostMock.mockClear();
    updatePostMock.mockClear();
  });

  test('create mode submits title and body to createPost', async () => {
    const onSuccess = vi.fn();
    createPostMock.mockResolvedValue({ id: 1, userId: 1, title: 'Title', body: 'Body' });

    const hookResult = setupUsePostForm({ mode: 'create', onSuccess });

    hookResult.handleSubmit({ title: 'Title', body: 'Body' });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(createPostMock).toHaveBeenCalledWith({ title: 'Title', body: 'Body' });
  });

  test('edit mode submits id, title and body to updatePost', async () => {
    const onSuccess = vi.fn();
    const post = createPost({ id: 7, title: 'Old', body: 'Old body' });
    updatePostMock.mockResolvedValue({ ...post, title: 'New', body: 'New body' });

    const hookResult = setupUsePostForm({ mode: 'edit', post, onSuccess });

    hookResult.handleSubmit({ title: 'New', body: 'New body' });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(updatePostMock).toHaveBeenCalledWith(7, { title: 'New', body: 'New body' });
  });
});
