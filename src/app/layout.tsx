import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getCurrentUser, getSession, getUserProfile } from '@/actions/auth';
import { ClientState } from '@/components/common/ClientState';
import { Providers } from '@/provider/providers';
import '@/styles/global.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tour Map',
  description: 'Your all-in-one platform for productivity and collaboration',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getCurrentUser();
  const { profile } = await getUserProfile(user?.id);
  const { session } = await getSession();

  const props = {
    profile,
    session,
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <ClientState props={props} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
