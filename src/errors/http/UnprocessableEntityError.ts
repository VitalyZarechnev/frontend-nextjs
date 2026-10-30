import { HttpError } from '@errors/application/HttpError';

export class UnprocessableEntityError extends HttpError {
  public static code = 'UnprocessableEntityError';
  public static statusCode = 422;

  constructor(message = 'Unprocessable Entity Error', body = '', detail?: string) {
    super(message, body, UnprocessableEntityError.statusCode, UnprocessableEntityError.code, detail);
  }
}
