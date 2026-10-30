import { ApplicationError } from './ApplicationError';

export class ClientValidationError extends ApplicationError {
  public static code = 'ClientValidationError';

  constructor(message = 'Client validation error') {
    super(message);
  }
}
