
'use client';
import { ReactNode, useMemo } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider }from './provider';

/**
 * Provides a Firebase context to client-side components.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { firebaseApp, firestore, auth } = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
