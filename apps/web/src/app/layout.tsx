import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'VibeLoop',
  description: 'Real-time collaborative loops',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
