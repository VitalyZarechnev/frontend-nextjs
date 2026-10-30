import type { AppRegistry } from '@application/di/AppRegistry';
import { ClientStorageStrategy } from '@application/di/strategies/storage/ClientStorageStrategy';
import { IStorageStrategy } from '@application/di/strategies/storage/IStorageStrategy';
import { ServerStorageStrategy } from '@application/di/strategies/storage/ServerStorageStrategy';

import { AuthDatasourceImpl } from '@data/auth/datasources/AuthDatasourceImpl';
import { HttpClientImpl } from '@data/network/http/HttpClientImpl';
import { TokenManagerImpl } from '@data/network/token/TokenManagerImpl';
import { PostsDatasourceImpl } from '@data/posts/datasources/PostsDatasourceImpl';
import { IStorage } from '@data/storage/IStorage';
import { UsersDatasourceImpl } from '@data/users/datasources/UsersDatasourceImpl';
import { ProfileStorage } from '@data/users/storages/ProfileStorage';

export class AppBootstrap {
  public constructor(private readonly storageStrategy: IStorageStrategy) {}

  public run(registry: AppRegistry): void {
    const storage = this.storageStrategy.resolve();
    this.registerDependencies(registry, storage);
  }

  private registerDependencies(registry: AppRegistry, storage: IStorage): void {
    const apiUrl = process.env.NEXT_PUBLIC_BASE_URL;

    const tokenManager = new TokenManagerImpl(storage, apiUrl);
    const httpClient = new HttpClientImpl(apiUrl, {}, tokenManager);

    registry.registerHttpClient(httpClient);

    registry.registerTokenManager(tokenManager);
    registry.registerProfileStorage(new ProfileStorage(storage));

    registry.registerAuthDatasource(new AuthDatasourceImpl(httpClient));
    registry.registerPostsDatasource(new PostsDatasourceImpl(httpClient));
    registry.registerUsersDatasource(new UsersDatasourceImpl(httpClient));
  }
}

export const clientBootstrap = new AppBootstrap(new ClientStorageStrategy());
export const serverBootstrap = new AppBootstrap(new ServerStorageStrategy());
