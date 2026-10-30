import { IStorage } from '@data/storage/IStorage';

import { TUser, UserModel } from '@domain/users/models/UserModel';
import { IProfileStorage } from '@domain/users/storages/IProfileStorage';

import { createModel } from '@utils/model';

export class ProfileStorage implements IProfileStorage {
  private readonly _profileKey = 'profile';

  public constructor(private _storage: IStorage) {}

  public get profile(): TUser | null {
    const raw: unknown = this._storage.get(this._profileKey);

    if (!raw) return null;
    let profile: TUser | null = null;

    if (typeof raw === 'string') {
      try {
        profile = createModel(UserModel, JSON.parse(raw));
      } catch {
        return null;
      }
    }

    return profile;
  }

  public setProfile(profile: TUser): void {
    this._storage.set(this._profileKey, JSON.stringify(profile));
  }

  public removeProfile(): void {
    this._storage.remove(this._profileKey);
  }
}
