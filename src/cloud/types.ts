import type { FirebaseWebConfig } from '../state/types';

export type { FirebaseWebConfig, CloudSettings } from '../state/types';
export { DEFAULT_CLOUD } from '../state/types';

export function isValidFirebaseConfig(c: unknown): c is FirebaseWebConfig {
  if (!c || typeof c !== 'object') return false;
  const o = c as Record<string, unknown>;
  return (
    typeof o.apiKey === 'string' &&
    typeof o.authDomain === 'string' &&
    typeof o.projectId === 'string' &&
    typeof o.storageBucket === 'string' &&
    typeof o.messagingSenderId === 'string' &&
    typeof o.appId === 'string' &&
    o.apiKey.length > 0 &&
    o.projectId.length > 0
  );
}
