import { HttpError } from '@errors/application/HttpError';

export class ConflictError extends HttpError {
  public static code = 'ConflictError';
  public static statusCode = 409;

  constructor(message = 'Conflict Error', body = '', detail?: string) {
    super(message, body, ConflictError.statusCode, ConflictError.code, detail);
  }
}
