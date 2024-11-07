import { Metadata } from 'next';
import Link from 'next/link';
import { PropsWithChildren } from 'react';
export const metadata: Metadata = {
  title: 'Dapp Offer Up Nextjs',
  description: 'Dapp Offer Up Next.js UI',
};

export default function RootLayout({ children }: PropsWithChildren<unknown>) {
  return (
    <html lang="en">
      <head>
        <Link rel="icon" type="image/svg+xml" href="/public/agoric.svg" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
