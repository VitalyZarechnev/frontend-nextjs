import { ApplicationError } from '@errors/application/ApplicationError';

export class PostNotFoundError extends ApplicationError {
  public static code = 'PostNotFoundError';

  constructor(message = 'Post Not Found') {
    super(message);
  }
}
