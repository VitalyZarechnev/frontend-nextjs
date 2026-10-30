import { HttpError } from '@errors/application/HttpError';

export class NotFoundError extends HttpError {
  public static code = 'NotFoundError';
  public static statusCode = 404;

  constructor(message = 'Not Found Error', body = '', detail?: string) {
    super(message, body, NotFoundError.statusCode, NotFoundError.code, detail);
  }
}
