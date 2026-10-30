import { HttpError } from '@errors/application/HttpError';

export class ForbiddenError extends HttpError {
  public static code = 'ForbiddenError';
  public static statusCode = 403;

  constructor(message = 'Forbidden Error', body = '', detail?: string) {
    super(message, body, ForbiddenError.statusCode, ForbiddenError.code, detail);
  }
}
