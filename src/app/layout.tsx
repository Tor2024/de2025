import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { UserDataProvider } from '@/contexts/UserDataContext';
import { Toaster } from "@/components/ui/toaster";

// The GeistSans and GeistMono imports from 'geist/font' are already configured.
// No need for further instantiation like GeistSans({ ... })

export const metadata: Metadata = {
  title: 'LinguaVerse - Personalized Language Learning',
  description: 'Your AI-powered journey to language fluency.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/*
        GeistSans.variable and GeistMono.variable provide the CSS class names
        that set up the --font-geist-sans and --font-geist-mono CSS variables.
        globals.css already uses var(--font-geist-sans).
      */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <UserDataProvider>
          {children}
          <Toaster />
        </UserDataProvider>
      </body>
    </html>
  );
}
