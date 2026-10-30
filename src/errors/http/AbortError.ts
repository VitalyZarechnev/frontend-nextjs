import { ApplicationError } from '@errors/application/ApplicationError';

export class AbortError extends ApplicationError {
  public static code = 'AbortError';

  constructor(message = 'Abort Error') {
    super(message);
  }
}
