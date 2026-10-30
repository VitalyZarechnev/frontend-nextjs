import { faker } from '@faker-js/faker';
import type { z } from 'zod';
import { fake, setFaker } from 'zod-schema-faker/v4';

let isZodSchemaFakerInitialized = false;

function ensureZodSchemaFaker() {
  if (!isZodSchemaFakerInitialized) {
    setFaker(faker);
    isZodSchemaFakerInitialized = true;
  }
}

type TFakerFields<TOutput> = Partial<{
  [K in keyof TOutput]: () => TOutput[K];
}>;

export function createSchemaFactory<TOutput>(schema: z.ZodType<TOutput>, fakerFields?: TFakerFields<TOutput>) {
  ensureZodSchemaFaker();

  return (overrides?: Partial<TOutput>): TOutput => {
    const fromSchema = fake(schema);
    const fromFaker: Partial<TOutput> = {};

    if (fakerFields) {
      for (const key of Object.keys(fakerFields) as (keyof TOutput)[]) {
        const generator = fakerFields[key];

        if (generator) {
          fromFaker[key] = generator();
        }
      }
    }

    return {
      ...fromSchema,
      ...fromFaker,
      ...overrides,
    };
  };
}
