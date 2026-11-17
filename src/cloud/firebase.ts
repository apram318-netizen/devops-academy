import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { FirebaseWebConfig } from './types';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebase() {
  return { app, auth, db };
}

export async function initFirebase(config: FirebaseWebConfig): Promise<{
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  uid: string;
}> {
  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApps()[0]!;
  }
  auth = getAuth(app);
  db = getFirestore(app);

  const uid = await new Promise<string>((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth!,
      async (user) => {
        try {
          if (user) {
            unsub();
            resolve(user.uid);
            return;
          }
          const cred = await signInAnonymously(auth!);
          unsub();
          resolve(cred.user.uid);
        } catch (e) {
          unsub();
          reject(e);
        }
      },
      reject,
    );
  });

  return { app, auth, db, uid };
}

export function clearFirebase() {
  app = null;
  auth = null;
  db = null;
}
