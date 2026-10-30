export interface IAuthDatasource {
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}
