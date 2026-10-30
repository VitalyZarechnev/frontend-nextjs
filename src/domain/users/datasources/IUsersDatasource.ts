import { TUser } from '../models/UserModel';

export interface IUsersDatasource {
  getMe(): Promise<TUser>;
}
