import { cache } from 'react';
import { cookies } from 'next/headers';

import { getServerCookieStorage } from '@application/di/server-cookies-storage/createServerCookieStorage';

export const bindServerRequestCookies = cache(async (): Promise<void> => {
  getServerCookieStorage().bind(await cookies());
});
