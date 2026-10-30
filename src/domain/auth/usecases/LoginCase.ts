import { IAuthDatasource } from '@domain/auth/datasources/IAuthDatasource';
import { ITokenManager } from '@domain/auth/storages/ITokenManager';
import { IUsersDatasource } from '@domain/users/datasources/IUsersDatasource';
import { TUser } from '@domain/users/models/UserModel';
import { IProfileStorage } from '@domain/users/storages/IProfileStorage';

export class LoginCase {
  constructor(
    private _authDatasource: IAuthDatasource,
    private _usersDatasource: IUsersDatasource,
    private _tokenManager: ITokenManager,
    private _profileStorage: IProfileStorage,
  ) {}

  async execute(email: string, password: string): Promise<TUser> {
    await this._authDatasource.login(email, password);

    const profile = await this._usersDatasource.getMe();

    this._tokenManager.setAccessToken('access-token-value');
    this._profileStorage.setProfile(profile);

    return profile;
  }
}
