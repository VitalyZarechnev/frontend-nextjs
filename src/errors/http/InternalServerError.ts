import { HttpError } from '@errors/application/HttpError';

export class InternalServerError extends HttpError {
  public static code = 'InternalServerError';
  public static statusCode = 500;

  constructor(message = 'Internal Server Error', body = '', detail?: string) {
    super(message, body, InternalServerError.statusCode, InternalServerError.code, detail);
  }
}
