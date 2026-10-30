import { IHttpClient } from '@data/network/http/IHttpClient';
import { createPost } from '@data/posts/mock-factories/postsList';

import { PostNotFoundError } from '@domain/posts/errors/PostNotFoundError';

import { UnexpectedError } from '@errors/application/UnexpectedError';
import { NotFoundError } from '@errors/http/NotFoundError';

import { PostsDatasourceImpl } from './PostsDatasourceImpl';

function createHttpClientMock(): IHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as IHttpClient;
}

describe('PostsDatasourceImpl', () => {
  test('getPostById requests /posts/{id} and returns the post', async () => {
    const httpClient = createHttpClientMock();
    const post = createPost({ id: 1 });
    vi.mocked(httpClient.get).mockResolvedValue(post);

    const result = await new PostsDatasourceImpl(httpClient).getPostById(1);

    expect(httpClient.get).toHaveBeenCalledWith({ resource: '/posts/1' });
    expect(result).toEqual(post);
  });

  test('getPostById maps a NotFoundError to PostNotFoundError', async () => {
    const httpClient = createHttpClientMock();
    vi.mocked(httpClient.get).mockRejectedValue(new NotFoundError());

    await expect(new PostsDatasourceImpl(httpClient).getPostById(999)).rejects.toBeInstanceOf(PostNotFoundError);
  });

  test('getPostById maps any other error to UnexpectedError', async () => {
    const httpClient = createHttpClientMock();
    vi.mocked(httpClient.get).mockRejectedValue(new Error('boom'));

    await expect(new PostsDatasourceImpl(httpClient).getPostById(1)).rejects.toBeInstanceOf(UnexpectedError);
  });

  test('createPost posts to /posts with the payload and returns the created post', async () => {
    const httpClient = createHttpClientMock();
    const post = createPost({ title: 'Title', body: 'Body' });
    vi.mocked(httpClient.post).mockResolvedValue(post);

    const result = await new PostsDatasourceImpl(httpClient).createPost({ title: 'Title', body: 'Body' });

    expect(httpClient.post).toHaveBeenCalledWith({ resource: '/posts', payload: { title: 'Title', body: 'Body' } });
    expect(result).toEqual(post);
  });

  test('updatePost patches /posts/{id} with the payload and returns the updated post', async () => {
    const httpClient = createHttpClientMock();
    const post = createPost({ id: 1, title: 'Updated', body: 'Updated body' });
    vi.mocked(httpClient.patch).mockResolvedValue(post);

    const result = await new PostsDatasourceImpl(httpClient).updatePost(1, { title: 'Updated', body: 'Updated body' });

    expect(httpClient.patch).toHaveBeenCalledWith({ resource: '/posts/1', payload: { title: 'Updated', body: 'Updated body' } });
    expect(result).toEqual(post);
  });

  test('deletePost sends a delete request to /posts/{id}', async () => {
    const httpClient = createHttpClientMock();
    vi.mocked(httpClient.delete).mockResolvedValue(undefined);

    await new PostsDatasourceImpl(httpClient).deletePost(1);

    expect(httpClient.delete).toHaveBeenCalledWith({ resource: '/posts/1' });
  });
});
