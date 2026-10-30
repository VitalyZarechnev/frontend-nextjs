import { HttpError } from '@errors/application/HttpError';

export class BadGatewayError extends HttpError {
  public static code = 'BadGatewayError';
  public static statusCode = 502;

  constructor(message = 'Bad Gateway Error', body = '', detail?: string) {
    super(message, body, BadGatewayError.statusCode, BadGatewayError.code, detail);
  }
}
