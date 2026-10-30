import { TUser } from '@domain/users/models/UserModel';

export interface IProfileStorage {
  profile: TUser | null;
  setProfile(profile: TUser): void;
  removeProfile(): void;
}
