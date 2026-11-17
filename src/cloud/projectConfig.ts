import type { FirebaseWebConfig } from './types';

/**
 * Public Firebase *web* config for the live GitHub Pages app.
 * This is a client identifier (safe to ship in front-end JS), not a server secret.
 * Do NOT put the sync passphrase here — that would publish the vault key to the world.
 */
export const BUILT_IN_FIREBASE_CONFIG: FirebaseWebConfig = {
  apiKey: 'AIzaSyBvZUv94t6jor-UIO96qEKTnOPys2fYwX8',
  authDomain: 'devops-course-7e346.firebaseapp.com',
  projectId: 'devops-course-7e346',
  storageBucket: 'devops-course-7e346.firebasestorage.app',
  messagingSenderId: '500958684529',
  appId: '1:500958684529:web:7e33cc1024d5af2c7642d0',
};
