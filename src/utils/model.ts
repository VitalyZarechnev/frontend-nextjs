import { z, ZodError } from 'zod';

import { ValidationError } from '@errors/application/ValidationError';

export function createModel<T extends z.Schema>(model: T, data: unknown): z.infer<T> {
  try {
    return model.parse(data);
  } catch (error) {
    const errors: string[] = [];
    if (error instanceof ZodError) {
      const test = z.treeifyError(error, (error) => error);

      test.errors.forEach((err) => {
        errors.push(`- ${err.path.join('.')}: ${err.message}`);
      });
    }

    throw new ValidationError('Validation error' + (errors ? '\n' + errors.join('\n') : ''));
  }
}
