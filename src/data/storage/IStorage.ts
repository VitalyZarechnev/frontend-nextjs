export interface IStorage {
  get(key: string): string | null;
  set(key: string, value: unknown, expDate?: Date): void;
  remove(key: string): void;
}
