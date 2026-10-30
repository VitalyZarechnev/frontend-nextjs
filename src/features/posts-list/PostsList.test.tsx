import { screen, waitFor } from '@testing-library/react';

import { renderWithQueryClient } from '@application/test/renderWithQueryClient';

import { createPostsList } from '@data/posts/mock-factories/postsList';

import PostsList from './PostsList';

const { getPostsMock } = vi.hoisted(() => ({ getPostsMock: vi.fn() }));

vi.mock('@application/di/AppRegistry', () => ({
  registry: {
    postsDatasource: {
      getPosts: getPostsMock,
    },
  },
}));

const mockPosts = createPostsList(2);

describe('Posts', () => {
  beforeAll(() => {
    getPostsMock.mockResolvedValue(mockPosts);

    renderWithQueryClient(<PostsList />);
  });

  test('renders 2 posts', async () => {
    await waitFor(() => {
      const posts = screen.queryAllByRole('listitem');
      expect(posts).toHaveLength(2);
    });
  });
});
