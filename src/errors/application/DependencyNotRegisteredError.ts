import { ApplicationError } from './ApplicationError';

export class DependencyNotRegisteredError extends ApplicationError {
  public static code = 'DependencyNotRegisteredError';

  constructor(dependency: string) {
    super(`Dependency ${dependency} hasn't been registered`);
  }
}
