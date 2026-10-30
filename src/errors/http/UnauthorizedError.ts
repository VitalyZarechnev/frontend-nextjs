import { HttpError } from '@errors/application/HttpError';

export class UnauthorizedError extends HttpError {
  public static code = 'UnauthorizedError';
  public static statusCode = 401;

  constructor(message = 'Unauthorized Error', body = '', detail?: string) {
    super(message, body, UnauthorizedError.statusCode, UnauthorizedError.code, detail);
  }
}
