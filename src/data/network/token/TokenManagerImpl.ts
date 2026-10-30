import { IStorage } from '@data/storage/IStorage';

import { FailedToRefreshTokenError } from '@domain/auth/errors/FailedToRefreshTokenError';
import { ITokenManager } from '@domain/auth/storages/ITokenManager';

export class TokenManagerImpl implements ITokenManager {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';

  constructor(
    private readonly storage: IStorage,
    private readonly baseUrl: string,
  ) {}

  getAccessToken(): string | null {
    return this.storage.get(this.ACCESS_TOKEN_KEY);
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/auths/refresh-tokens`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new FailedToRefreshTokenError();

      const data = await response.json();

      if (!data.token || typeof data.token !== 'string') throw new FailedToRefreshTokenError();

      this.setAccessToken(data.token);

      return data.token;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  setAccessToken(token: string): void {
    const exp = this.decodeJwtExp(token);
    const expDate = exp ? new Date(exp * 1000) : undefined;

    this.storage.set(this.ACCESS_TOKEN_KEY, token, expDate);
  }

  clearTokens(): void {
    this.storage.remove(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Decode the `exp` claim (Unix seconds) from a JWT without verifying the
   * signature. Returns `null` if the token is malformed or has no `exp`.
   */
  private decodeJwtExp(token: string): number | null {
    try {
      const segments = token.split('.');
      if (segments.length < 2) return null;

      const payloadB64Url = segments[1];
      const padded = payloadB64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(payloadB64Url.length + ((4 - (payloadB64Url.length % 4)) % 4), '=');

      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const json = new TextDecoder('utf-8').decode(bytes);

      const payload = JSON.parse(json) as { exp?: number };

      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }
}
