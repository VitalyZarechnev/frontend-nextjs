import { IPostsDatasource } from '@domain/posts/datasources/IPostsDatasource';

import { CreatePostCase } from './CreatePostCase';

describe('CreatePostCase', () => {
  test('delegates to createPost with title and body', async () => {
    const createPost = vi.fn().mockResolvedValue({ id: 1, userId: 1, title: 'Title', body: 'Body' });
    const postsDatasource = { createPost } as unknown as IPostsDatasource;

    const result = await new CreatePostCase(postsDatasource).execute('Title', 'Body');

    expect(createPost).toHaveBeenCalledWith({ title: 'Title', body: 'Body' });
    expect(result).toEqual({ id: 1, userId: 1, title: 'Title', body: 'Body' });
  });
});
