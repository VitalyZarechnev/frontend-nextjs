import { IHttpClient } from '@data/network/http/IHttpClient';

import { IPostsDatasource, TPostPayload } from '@domain/posts/datasources/IPostsDatasource';
import { PostNotFoundError } from '@domain/posts/errors/PostNotFoundError';
import { PostModel, TPost } from '@domain/posts/models/Post';
import { PostsListSchema, TPostsList } from '@domain/posts/schemas/PostsList';

import { UnexpectedError } from '@errors/application/UnexpectedError';
import { NotFoundError } from '@errors/http/NotFoundError';
import { UnauthorizedError } from '@errors/http/UnauthorizedError';

import { createModel } from '@utils/model';

export class PostsDatasourceImpl implements IPostsDatasource {
  constructor(private _httpClient: IHttpClient) {}

  async getPosts(): Promise<TPostsList> {
    try {
      const response = await this._httpClient.get({ resource: '/posts' });

      return createModel(PostsListSchema, response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPostById(id: number): Promise<TPost> {
    try {
      const response = await this._httpClient.get({ resource: `/posts/${id}` });

      return createModel(PostModel, response);
    } catch (error) {
      throw this.handleGetPostByIdError(error);
    }
  }

  async createPost(payload: TPostPayload): Promise<TPost> {
    try {
      const response = await this._httpClient.post({ resource: '/posts', payload });

      return createModel(PostModel, response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePost(id: number, payload: TPostPayload): Promise<TPost> {
    try {
      const response = await this._httpClient.patch({ resource: `/posts/${id}`, payload });

      return createModel(PostModel, response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deletePost(id: number): Promise<void> {
    try {
      await this._httpClient.delete({ resource: `/posts/${id}` });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleGetPostByIdError(error: unknown) {
    if (error instanceof NotFoundError) return new PostNotFoundError();

    return this.handleError(error);
  }

  private handleError(error: unknown) {
    if (error instanceof UnauthorizedError) return error;

    return new UnexpectedError();
  }
}
