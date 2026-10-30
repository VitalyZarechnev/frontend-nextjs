import { ApplicationError } from '@errors/application/ApplicationError';

export class NoTokenError extends ApplicationError {
  public static code = 'no_token';

  constructor(message = 'No Token') {
    super(message);
  }
}
