import { HttpError } from '@errors/application/HttpError';

export class BadRequestError extends HttpError {
  public static code = 'BadRequestError';
  public static statusCode = 400;

  constructor(message = 'Bad Request Error', body = '', detail?: string) {
    super(message, body, BadRequestError.statusCode, BadRequestError.code, detail);
  }
}
