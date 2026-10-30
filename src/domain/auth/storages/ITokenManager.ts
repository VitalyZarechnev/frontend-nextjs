export interface ITokenManager {
  getAccessToken(): string | null;
  refreshToken(): Promise<string>;
  setAccessToken(token: string): void;
  clearTokens(): void;
}
