
'use client';
import {
  createContext,
  ReactNode,
  useContext,
} from 'react';
import { Auth, getAuth } from 'firebase/auth';
import { FirebaseApp, getApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';

// Define the shape of the Firebase context
interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

// Create the context with a default undefined value
const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined,
);

/**
 * Provider component to make Firebase instances available to the component tree.
 */
export function FirebaseProvider({
  children,
  firebaseApp,
  firestore,
  auth,
}: {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}) {
  return (
    <FirebaseContext.Provider value={{ firebaseApp, firestore, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
}

// Hook to access the entire Firebase context
export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

// Hook to access the Firebase App instance
export function useFirebaseApp() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.firebaseApp;
}

// Hook to access the Firestore instance
export function useFirestore() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
}

// Hook to access the Auth instance
export function useAuth() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
}
