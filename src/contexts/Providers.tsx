
"use client";

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { UserDataProvider } from './UserDataContext';

// Create a client
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseClientProvider>
        <UserDataProvider>
          {children}
        </UserDataProvider>
      </FirebaseClientProvider>
    </QueryClientProvider>
  );
}
