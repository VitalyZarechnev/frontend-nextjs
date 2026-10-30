import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

import { cookieOptions } from '@data/storage/CookieStorageImpl';
import { IStorage } from '@data/storage/IStorage';

import { UnexpectedError } from '@errors/application/UnexpectedError';

export class ServerCookieStorage implements IStorage {
  private cookieStore: ReadonlyRequestCookies | null = null;

  public bind(cookieStore: ReadonlyRequestCookies): void {
    this.cookieStore = cookieStore;
  }

  public get(key: string): string | null {
    if (!this.cookieStore) this.throwNotBoundError();

    return this.cookieStore!.get(key)?.value ?? null;
  }

  public set(key: string, value: unknown, expDate?: Date): void {
    if (!this.cookieStore) this.throwNotBoundError();

    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    let ttl: { maxAge: number } | { expires: Date } = { maxAge: 86400 * 365 };

    if (expDate) {
      ttl = { expires: expDate };
    }

    this.cookieStore!.set(key, serialized, { ...cookieOptions, ...ttl });
  }

  public remove(key: string): void {
    if (!this.cookieStore) this.throwNotBoundError();

    this.cookieStore!.delete(key);
  }

  private throwNotBoundError(): void {
    throw new UnexpectedError("Server cookies store hasn't been bound");
  }
}
