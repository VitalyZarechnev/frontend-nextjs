import { ApplicationError } from '@errors/application/ApplicationError';

export class InvalidTokenError extends ApplicationError {
  public static code = 'invalid_token';

  constructor(message = 'Invalid Token') {
    super(message);
  }
}
