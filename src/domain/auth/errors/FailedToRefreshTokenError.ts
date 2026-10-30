import { ApplicationError } from '@errors/application/ApplicationError';

export class FailedToRefreshTokenError extends ApplicationError {
  public static code = 'failed_to_refresh_token';

  constructor(message = 'Failed To Refresh Token') {
    super(message);
  }
}
