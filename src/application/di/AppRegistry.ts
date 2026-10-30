import { clientBootstrap, serverBootstrap } from '@application/di/AppBootstrap';

import { IHttpClient } from '@data/network/http/IHttpClient';

import { IAuthDatasource } from '@domain/auth/datasources/IAuthDatasource';
import { ITokenManager } from '@domain/auth/storages/ITokenManager';
import { IPostsDatasource } from '@domain/posts/datasources/IPostsDatasource';
import { IUsersDatasource } from '@domain/users/datasources/IUsersDatasource';
import { IProfileStorage } from '@domain/users/storages/IProfileStorage';

import { DependencyNotRegisteredError } from '@errors/application/DependencyNotRegisteredError';

import { isBrowser } from '@utils/environment/isBrowser';

export class AppRegistry {
  private static instance: AppRegistry;

  private _httpClient: IHttpClient | null = null;

  private _tokenManager: ITokenManager | null = null;
  private _profileStorage: IProfileStorage | null = null;

  private _authDatasource: IAuthDatasource | null = null;
  private _postsDatasource: IPostsDatasource | null = null;
  private _usersDatasource: IUsersDatasource | null = null;

  private constructor() {}

  public static getInstance(): AppRegistry {
    if (!AppRegistry.instance) {
      AppRegistry.instance = new AppRegistry();
    }

    return AppRegistry.instance;
  }

  public get httpClient(): IHttpClient {
    if (!this._httpClient) throw new DependencyNotRegisteredError('HttpClient');
    return this._httpClient;
  }

  public get tokenManager(): ITokenManager {
    if (!this._tokenManager) throw new DependencyNotRegisteredError('TokenManager');
    return this._tokenManager;
  }

  public get profileStorage(): IProfileStorage {
    if (!this._profileStorage) throw new DependencyNotRegisteredError('ProfileStorage');
    return this._profileStorage;
  }

  public get authDatasource(): IAuthDatasource {
    if (!this._authDatasource) throw new DependencyNotRegisteredError('AuthDatasource');
    return this._authDatasource;
  }

  public get postsDatasource(): IPostsDatasource {
    if (!this._postsDatasource) throw new DependencyNotRegisteredError('PostsDatasource');
    return this._postsDatasource;
  }

  public get usersDatasource(): IUsersDatasource {
    if (!this._usersDatasource) throw new DependencyNotRegisteredError('UsersDatasource');
    return this._usersDatasource;
  }

  public registerHttpClient(httpClient: IHttpClient): void {
    this._httpClient = httpClient;
  }

  public registerTokenManager(tokenManager: ITokenManager): void {
    this._tokenManager = tokenManager;
  }

  public registerProfileStorage(profileStorage: IProfileStorage): void {
    this._profileStorage = profileStorage;
  }

  public registerAuthDatasource(authDatasource: IAuthDatasource): void {
    this._authDatasource = authDatasource;
  }

  public registerPostsDatasource(postsDatasource: IPostsDatasource): void {
    this._postsDatasource = postsDatasource;
  }

  public registerUsersDatasource(usersDatasource: IUsersDatasource): void {
    this._usersDatasource = usersDatasource;
  }
}

export const registry = AppRegistry.getInstance();

if (isBrowser()) {
  clientBootstrap.run(registry);
} else {
  serverBootstrap.run(registry);
}
