import { ServerCookieStorage } from '@data/storage/ServerCookieStorageImpl';

let serverCookieStorage: ServerCookieStorage | null = null;

export function getServerCookieStorage(): ServerCookieStorage {
  if (!serverCookieStorage) {
    serverCookieStorage = new ServerCookieStorage();
  }

  return serverCookieStorage;
}
