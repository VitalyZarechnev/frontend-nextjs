import { HttpError } from '@errors/application/HttpError';

export class GatewayTimeoutError extends HttpError {
  public static code = 'GatewayTimeoutError';
  public static statusCode = 504;

  constructor(message = 'Gateway Timeout Error', body = '', detail?: string) {
    super(message, body, GatewayTimeoutError.statusCode, GatewayTimeoutError.code, detail);
  }
}
