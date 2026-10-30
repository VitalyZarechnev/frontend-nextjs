import { ApplicationError } from '@errors/application/ApplicationError';

export class ValidationError extends ApplicationError {
  public static code = 'ValidationError';

  constructor(message = 'Validation Error') {
    super(message);
  }
}
