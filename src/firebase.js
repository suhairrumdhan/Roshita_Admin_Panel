import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { resolveFirebaseEnvironment } from './firebaseEnvironment';

const runtime = resolveFirebaseEnvironment(import.meta.env, import.meta.env.MODE);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAsn2tC0UirEnjPLSgVYvLNTGY1Z9GQoi0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'pharma-apps.firebaseapp.com',
  projectId: runtime.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'pharma-apps.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '657034913156',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:657034913156:web:6cf3497ff0d637328769d1',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

if (runtime.useEmulators) {
  connectAuthEmulator(
    auth,
    `http://${runtime.hosts.auth.host}:${runtime.hosts.auth.port}`,
    { disableWarnings: true },
  );
  connectFirestoreEmulator(
    db,
    runtime.hosts.firestore.host,
    runtime.hosts.firestore.port,
  );
  connectStorageEmulator(
    storage,
    runtime.hosts.storage.host,
    runtime.hosts.storage.port,
  );
  connectFunctionsEmulator(
    functions,
    runtime.hosts.functions.host,
    runtime.hosts.functions.port,
  );
}

export { firebaseConfig };
