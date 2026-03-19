import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/layout/nav';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FlexWhere - Embrava Sensors',
  description: 'Embrava DMS Integration Dashboard for FlexWhere',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-background">
          <Nav />
          <main className="pl-[72px]">
            <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
