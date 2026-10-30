import { IPostsDatasource } from '@domain/posts/datasources/IPostsDatasource';

export class DeletePostCase {
  constructor(private _postsDatasource: IPostsDatasource) {}

  async execute(id: number): Promise<void> {
    return this._postsDatasource.deletePost(id);
  }
}
