import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { TUser, UserModel } from '@domain/users/models/UserModel';

import { createSchemaFactory } from '@utils/testing/createSchemaFactory';

export const createUser = createSchemaFactory(UserModel, {
  id: () => faker.number.int({ min: 1, max: 1_000_000 }),
  email: () => faker.internet.email(),
  phone: () => faker.phone.number({ style: 'international' }),
  username: () => faker.internet.username(),
  displayName: () => faker.person.fullName(),
});

export const CURRENT_USER: TUser = createUser({ displayName: 'Иван Иванов' });

export async function mockCurrentUser(page: Page): Promise<void> {
  await page.route('**/users/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(CURRENT_USER),
    }),
  );
}
