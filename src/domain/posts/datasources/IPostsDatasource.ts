import { TPost } from '@domain/posts/models/Post';
import { TPostsList } from '@domain/posts/schemas/PostsList';

export type TPostPayload = Pick<TPost, 'title' | 'body'>;

export interface IPostsDatasource {
  getPosts(): Promise<TPostsList>;
  getPostById(id: number): Promise<TPost>;
  createPost(payload: TPostPayload): Promise<TPost>;
  updatePost(id: number, payload: TPostPayload): Promise<TPost>;
  deletePost(id: number): Promise<void>;
}
