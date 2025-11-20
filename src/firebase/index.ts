
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

import { firebaseConfig } from './config';

/**
 * Initializes and returns Firebase services.
 *
 * This function ensures that Firebase is initialized only once.
 *
 * @returns An object containing the initialized Firebase app, Firestore, and Auth instances.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
} {
  const firebaseApp = !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  return { firebaseApp, firestore, auth };
}

// Re-export providers and hooks for a single entry point
export { FirebaseProvider, FirebaseClientProvider } from './client-provider';
export {
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';
export { useDoc } from './hooks/use-doc';
export { useCollection } from './hooks/use-collection';
export { useUser } from './hooks/use-user';
