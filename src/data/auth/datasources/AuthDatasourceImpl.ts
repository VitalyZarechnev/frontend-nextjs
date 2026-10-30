import { IHttpClient } from '@data/network/http/IHttpClient';

import { IAuthDatasource } from '@domain/auth/datasources/IAuthDatasource';

import { UnexpectedError } from '@errors/application/UnexpectedError';
import { UnauthorizedError } from '@errors/http/UnauthorizedError';

import { sleep } from '@utils/runtime';

export class AuthDatasourceImpl implements IAuthDatasource {
  constructor(private _httpClient: IHttpClient) {}

  async login(_email: string, _password: string): Promise<void> {
    try {
      await sleep(1000);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await sleep(1000);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown) {
    if (error instanceof UnauthorizedError) return error;

    return new UnexpectedError();
  }
}
