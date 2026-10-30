import { IHttpClient } from '@data/network/http/IHttpClient';

import { IUsersDatasource } from '@domain/users/datasources/IUsersDatasource';
import { UserNotFoundError } from '@domain/users/errors/UserNotFoundError';
import { TUser, UserModel } from '@domain/users/models/UserModel';

import { HttpError } from '@errors/application/HttpError';
import { UnexpectedError } from '@errors/application/UnexpectedError';
import { NotFoundError } from '@errors/http/NotFoundError';

import { createModel } from '@utils/model';

export class UsersDatasourceImpl implements IUsersDatasource {
  constructor(private _httpClient: IHttpClient) {}

  async getMe(): Promise<TUser> {
    try {
      const response = await this._httpClient.get({ resource: '/users/me' });

      return createModel(UserModel, response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown) {
    if (error instanceof HttpError) {
      switch (error.detail) {
        case UserNotFoundError.code:
          return new UserNotFoundError();
      }
    }

    if (error instanceof NotFoundError) return error;

    return new UnexpectedError();
  }
}
