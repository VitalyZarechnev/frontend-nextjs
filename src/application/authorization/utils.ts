import { registry } from '@application/di/AppRegistry';

import { TUser } from '@domain/users/models/UserModel';

type TClientCookies = {
  profile: TUser | null;
  accessToken: string | null;
};

export const SERVER_AUTH_SNAPSHOT: TClientCookies = { profile: null, accessToken: null };

const listeners = new Set<() => void>();
const clientCache: { value: TClientCookies | null } = { value: null };

export function isServerAuthSnapshot(snapshot: TClientCookies): boolean {
  return snapshot === SERVER_AUTH_SNAPSHOT;
}

export function subscribeToClientCookies(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function invalidateClientCookieCache(): void {
  clientCache.value = null;
  listeners.forEach((listener) => listener());
}

export function getClientSnapshot(): TClientCookies {
  if (clientCache.value === null) {
    clientCache.value = {
      profile: registry.profileStorage.profile,
      accessToken: registry.tokenManager.getAccessToken(),
    };
  }

  return clientCache.value;
}

export function getServerSnapshot(): TClientCookies {
  return SERVER_AUTH_SNAPSHOT;
}
