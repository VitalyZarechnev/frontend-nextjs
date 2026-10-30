import { IPostsDatasource } from '@domain/posts/datasources/IPostsDatasource';

import { DeletePostCase } from './DeletePostCase';

describe('DeletePostCase', () => {
  test('delegates to deletePost with id', async () => {
    const deletePost = vi.fn().mockResolvedValue(undefined);
    const postsDatasource = { deletePost } as unknown as IPostsDatasource;

    await new DeletePostCase(postsDatasource).execute(1);

    expect(deletePost).toHaveBeenCalledWith(1);
  });
});
