import { IStorageStrategy } from '@application/di/strategies/storage/IStorageStrategy';

import { CookieStorage } from '@data/storage/CookieStorageImpl';
import { IStorage } from '@data/storage/IStorage';

export class ClientStorageStrategy implements IStorageStrategy {
  public resolve(): IStorage {
    return new CookieStorage();
  }
}
