import { IStorage } from '@data/storage/IStorage';

import { cookies } from '@utils/cookies';

export const cookieOptions = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export class CookieStorage implements IStorage {
  public get(key: string): string | null {
    return cookies.get(key) ?? null;
  }

  public set(key: string, value: unknown, expDate?: Date): void {
    let ttl: { maxAge: number } | { expires: Date } = { maxAge: 86400 * 365 };

    if (expDate) {
      ttl = { expires: expDate };
    }

    cookies.set(key, value, { ...cookieOptions, ...ttl });
  }

  public remove(key: string): void {
    cookies.remove(key, { path: '/' });
  }
}
