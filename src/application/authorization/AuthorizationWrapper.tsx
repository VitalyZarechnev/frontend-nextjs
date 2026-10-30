'use client';

import { PropsWithChildren, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import {
  getClientSnapshot,
  getServerSnapshot,
  invalidateClientCookieCache,
  isServerAuthSnapshot,
  subscribeToClientCookies,
} from '@application/authorization/utils';

import { UserModel } from '@domain/users/models/UserModel';

import Spinner from '@ui/atoms/spinner/Spinner';

import { createModel } from '@utils/model';

import { routes } from '../routes';
import SessionProvider from '../SessionProvider';

type TProps = PropsWithChildren;

export default function AuthorizationWrapper({ children }: TProps) {
  const router = useRouter();

  const clientCookies = useSyncExternalStore(subscribeToClientCookies, getClientSnapshot, getServerSnapshot);

  const { profile, accessToken } = clientCookies;
  const isAwaitingClientAuth = isServerAuthSnapshot(clientCookies);

  useEffect(() => {
    invalidateClientCookieCache();
  }, []);

  useEffect(() => {
    if (isAwaitingClientAuth) return;

    if (!profile || !accessToken) {
      router.replace(routes.login);
      return;
    }

    try {
      createModel(UserModel, profile);
    } catch {
      router.replace(routes.login);
    }
  }, [isAwaitingClientAuth, profile, accessToken, router]);

  if (isAwaitingClientAuth || !profile || !accessToken) return <Spinner />;

  return <SessionProvider profile={profile}>{children}</SessionProvider>;
}
