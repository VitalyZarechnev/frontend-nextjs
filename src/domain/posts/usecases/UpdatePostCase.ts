import { IPostsDatasource } from '@domain/posts/datasources/IPostsDatasource';
import { TPost } from '@domain/posts/models/Post';

export class UpdatePostCase {
  constructor(private _postsDatasource: IPostsDatasource) {}

  async execute(id: number, title: string, body: string): Promise<TPost> {
    return this._postsDatasource.updatePost(id, { title, body });
  }
}
