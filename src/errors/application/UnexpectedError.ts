import { ApplicationError } from '@errors/application/ApplicationError';

export class UnexpectedError extends ApplicationError {
  public static code = 'UnexpectedError';

  private static defaultMessage = 'Unexpected Error';

  constructor(message?: string) {
    const effectiveMessage = message ? `${UnexpectedError.defaultMessage}: ${message}` : UnexpectedError.defaultMessage;

    super(effectiveMessage);
  }
}
