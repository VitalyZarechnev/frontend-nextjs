import { IAuthDatasource } from '@domain/auth/datasources/IAuthDatasource';
import { ITokenManager } from '@domain/auth/storages/ITokenManager';
import { IProfileStorage } from '@domain/users/storages/IProfileStorage';

export class LogoutCase {
  constructor(
    private _authDatasource: IAuthDatasource,
    private _tokenManager: ITokenManager,
    private _profileStorage: IProfileStorage,
  ) {}

  async execute(): Promise<void> {
    await this._authDatasource.logout();

    this._tokenManager.clearTokens();
    this._profileStorage.removeProfile();
  }
}
