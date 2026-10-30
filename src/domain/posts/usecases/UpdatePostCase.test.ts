import { IPostsDatasource } from '@domain/posts/datasources/IPostsDatasource';

import { UpdatePostCase } from './UpdatePostCase';

describe('UpdatePostCase', () => {
  test('delegates to updatePost with id, title, and body', async () => {
    const updatePost = vi.fn().mockResolvedValue({ id: 1, userId: 1, title: 'Title', body: 'Body' });
    const postsDatasource = { updatePost } as unknown as IPostsDatasource;

    const result = await new UpdatePostCase(postsDatasource).execute(1, 'Title', 'Body');

    expect(updatePost).toHaveBeenCalledWith(1, { title: 'Title', body: 'Body' });
    expect(result).toEqual({ id: 1, userId: 1, title: 'Title', body: 'Body' });
  });
});
