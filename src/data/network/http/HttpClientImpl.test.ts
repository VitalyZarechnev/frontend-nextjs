import { HttpClientImpl } from '@data/network/http/HttpClientImpl';
import { IHttpClient } from '@data/network/http/IHttpClient';

import { InvalidTokenError } from '@domain/auth/errors/InvalidTokenError';

import { HttpError } from '@errors/application/HttpError';
import { ForbiddenError } from '@errors/http/ForbiddenError';
import { NotFoundError } from '@errors/http/NotFoundError';

const stubResponse = (init: { status: number; statusText?: string; body?: unknown }) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: init.status,
      statusText: init.statusText ?? '',
      headers: new Headers(),
      json: async () => init.body ?? {},
    }),
  );
};

const createClient = (): IHttpClient => new HttpClientImpl('https://api.test');

describe('HttpClientImpl error mapping', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('throws the exact error class for the response status', async () => {
    stubResponse({ status: 403, statusText: 'Forbidden' });

    await expect(createClient().get({ resource: '/secret' })).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('the thrown status class is also an HttpError carrying status and body', async () => {
    stubResponse({ status: 404, statusText: 'Not Found', body: { detail: 'post_not_found' } });

    const request = createClient().get({ resource: '/posts/1' });

    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({
      statusCode: 404,
      body: '{"detail":"post_not_found"}',
    });
  });

  test('exposes the code the backend sent on `detail`, from either payload field', async () => {
    stubResponse({ status: 422, body: { detail: 'limits_exceeded' } });
    await expect(createClient().post({ resource: '/completion' })).rejects.toMatchObject({ detail: 'limits_exceeded' });

    stubResponse({ status: 422, body: { code: 'not_safe_for_work' } });
    await expect(createClient().post({ resource: '/completion' })).rejects.toMatchObject({ detail: 'not_safe_for_work' });
  });

  test('`code` stays the predefined class id, whatever the backend sends', async () => {
    stubResponse({ status: 404, body: { detail: 'user_not_found' } });

    await expect(createClient().get({ resource: '/me' })).rejects.toMatchObject({
      code: NotFoundError.code,
      detail: 'user_not_found',
    });
  });

  test('falls back to a generic HttpError that still carries an unmapped status', async () => {
    stubResponse({ status: 429 });

    const error = await createClient()
      .get({ resource: '/posts' })
      .catch((thrown: unknown) => thrown);

    expect((error as object).constructor).toBe(HttpError);
    expect(error).toMatchObject({ statusCode: 429 });
  });

  test('token problems reported in `detail` win over the status mapping', async () => {
    stubResponse({ status: 401, statusText: 'Unauthorized', body: { detail: InvalidTokenError.code } });

    await expect(createClient().get({ resource: '/me' })).rejects.toBeInstanceOf(InvalidTokenError);
  });

  test('a status class stays outside the NotFoundError branch when the status differs', async () => {
    stubResponse({ status: 403 });

    await expect(createClient().get({ resource: '/secret' })).rejects.not.toBeInstanceOf(NotFoundError);
  });
});
