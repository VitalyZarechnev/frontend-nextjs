import { ReactNode } from 'react';
import { Inter } from 'next/font/google';

import ApplicationProvider from '@application/ApplicationProvider';
import { bindServerRequestCookies } from '@application/di/bindServerRequestCookies';

import '@assets/styles/index.scss';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  await bindServerRequestCookies();

  return (
    <html lang='ru' className={`${inter.variable}`}>
      <body>
        <ApplicationProvider>{children}</ApplicationProvider>
      </body>
    </html>
  );
}
