import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sign in | Trimly',
  description: 'Sign in to Trimly to book barbers and manage your appointments.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}