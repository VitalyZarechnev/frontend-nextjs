import { IStorage } from '@data/storage/IStorage';

export interface IStorageStrategy {
  resolve(): IStorage;
}
