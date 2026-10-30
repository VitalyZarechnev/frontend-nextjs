import { ApplicationError } from '@errors/application/ApplicationError';

export class UserNotFoundError extends ApplicationError {
  public static code = 'user_not_found';

  constructor(message = 'User Not Found') {
    super(message);
  }
}
