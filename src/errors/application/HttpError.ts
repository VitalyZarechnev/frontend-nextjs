import { ApplicationError } from '@errors/application/ApplicationError';

export class HttpError extends ApplicationError {
  public static code = 'HttpError';

  statusCode: number | undefined;
  body: string;
  code: string;
  detail: string | undefined;

  constructor(message = 'Network error', body = '', statusCode?: number, code = HttpError.code, detail?: string) {
    super(message);
    this.statusCode = statusCode;
    this.body = body;
    this.code = code;
    this.detail = detail;
  }
}
