
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserDataProvider } from '@/contexts/UserDataContext';

export const metadata: Metadata = {
  title: 'LinguaLab - Personalized Language Learning',
  description: 'Your AI-powered journey to language fluency.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider>
          <UserDataProvider>
            {children}
            <Toaster />
          </UserDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
