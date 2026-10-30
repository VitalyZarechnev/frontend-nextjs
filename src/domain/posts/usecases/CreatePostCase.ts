import { IPostsDatasource } from '@domain/posts/datasources/IPostsDatasource';
import { TPost } from '@domain/posts/models/Post';

export class CreatePostCase {
  constructor(private _postsDatasource: IPostsDatasource) {}

  async execute(title: string, body: string): Promise<TPost> {
    return this._postsDatasource.createPost({ title, body });
  }
}
