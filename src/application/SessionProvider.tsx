import { createContext, PropsWithChildren, useContext } from 'react';

import { TUser } from '@domain/users/models/UserModel';

export type TSessionContext = TUser | null;

const sessionContextInitialValues: TSessionContext = null;

export const SessionContext = createContext<TSessionContext>(sessionContextInitialValues);

type TProps = {
  profile: TUser;
};

export function useSession() {
  return useContext(SessionContext);
}

export default function SessionProvider(props: PropsWithChildren & TProps) {
  const { profile, children } = props;

  return <SessionContext.Provider value={profile}>{children}</SessionContext.Provider>;
}
