import { getServerCookieStorage } from '@application/di/server-cookies-storage/createServerCookieStorage';
import { IStorageStrategy } from '@application/di/strategies/storage/IStorageStrategy';

import { IStorage } from '@data/storage/IStorage';

export class ServerStorageStrategy implements IStorageStrategy {
  public resolve(): IStorage {
    return getServerCookieStorage();
  }
}
