import { ApplicationError } from '@errors/application/ApplicationError';

export class NetworkError extends ApplicationError {
  public static code = 'NetworkError';

  constructor(message = 'Network Error') {
    super(message);
  }
}
