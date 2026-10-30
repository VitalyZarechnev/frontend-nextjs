import { ReactNode } from 'react';

import AuthorizationWrapper from '@application/authorization/AuthorizationWrapper';

export default function DomainLayout({ children }: { children: ReactNode }) {
  return <AuthorizationWrapper>{children}</AuthorizationWrapper>;
}
