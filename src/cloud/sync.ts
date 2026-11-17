import { doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import type { State } from '../state/types';
import { DEFAULT_CLOUD } from '../state/types';
import { sha256Hex } from './hash';
import { getFirebase, initFirebase } from './firebase';
import { decryptJson, deriveVaultKey, encryptJson } from './crypto';
import type { CloudSettings, FirebaseWebConfig } from './types';

export type CloudSnapshot = {
  updatedAt: number;
  state: State;
  /** True when the vault was still plaintext from the first sync build. */
  legacy?: boolean;
};

type EncryptedVaultDoc = {
  v: 2;
  updatedAt: number;
  saltB64: string;
  ivB64: string;
  ciphertextB64: string;
};

type LegacyVaultDoc = {
  updatedAt?: number;
  state?: State;
};

type KeyCache = { saltB64: string; key: CryptoKey };

const keyCache = new Map<string, KeyCache>();

function vaultPath(vaultId: string) {
  return `vaults/${vaultId}`;
}

async function vaultKey(vaultId: string, passphrase: string, saltB64?: string): Promise<KeyCache> {
  const cached = keyCache.get(vaultId);
  if (cached && (!saltB64 || cached.saltB64 === saltB64)) return cached;
  const derived = await deriveVaultKey(passphrase, saltB64 ?? cached?.saltB64);
  const entry = { key: derived.key, saltB64: derived.saltB64 };
  keyCache.set(vaultId, entry);
  return entry;
}

/**
 * Full learner progress goes to Firestore (encrypted): prefs, done, pages, steps,
 * submissions (incl. text/grades/file metadata), quizzes, UI. Only strip secrets —
 * never the sync passphrase or Firebase web config. File *bytes* stay in IndexedDB.
 */
export function scrubSecretsForCloud(state: State): State {
  const clone = structuredClone(state);
  clone.storage = {
    ...clone.storage,
    folderName: null,
    lastFolderSync: null,
    cloud: {
      ...DEFAULT_CLOUD,
      enabled: true,
      lastCloudSync: clone.storage.cloud.lastCloudSync,
      uid: null,
    },
  };
  return clone;
}

export { mergeProgressStates, progressFingerprint } from './merge';

export async function connectCloud(
  config: FirebaseWebConfig,
  syncKey: string,
): Promise<{ uid: string; vaultId: string }> {
  if (!syncKey.trim() || syncKey.trim().length < 8) {
    throw new Error('Choose a sync passphrase of at least 8 characters');
  }
  const { uid } = await initFirebase(config);
  const vaultId = await sha256Hex(`devops-academy:${syncKey.trim()}`);
  return { uid, vaultId };
}

function parseVaultDoc(
  data: EncryptedVaultDoc & LegacyVaultDoc,
  passphrase: string,
  vaultId: string,
): Promise<CloudSnapshot | null> {
  return (async () => {
    if (data.v === 2 && data.ciphertextB64 && data.ivB64 && data.saltB64) {
      try {
        const { key } = await vaultKey(vaultId, passphrase, data.saltB64);
        const state = await decryptJson<State>(key, data.ivB64, data.ciphertextB64);
        return { updatedAt: data.updatedAt ?? 0, state };
      } catch {
        throw new Error('Could not decrypt cloud vault — check your passphrase');
      }
    }
    if (data.state) {
      return { updatedAt: data.updatedAt ?? 0, state: data.state, legacy: true };
    }
    return null;
  })();
}

export async function pullCloudState(
  vaultId: string,
  passphrase: string,
): Promise<CloudSnapshot | null> {
  const { db } = getFirebase();
  if (!db) throw new Error('Cloud not connected');
  const snap = await getDoc(doc(db, vaultPath(vaultId)));
  if (!snap.exists()) return null;
  return parseVaultDoc(snap.data() as EncryptedVaultDoc & LegacyVaultDoc, passphrase, vaultId);
}

export async function pushCloudState(
  vaultId: string,
  state: State,
  passphrase: string,
): Promise<number> {
  const { db } = getFirebase();
  if (!db) throw new Error('Cloud not connected');
  const updatedAt = Date.now();
  const safe = scrubSecretsForCloud(state);

  const existing = await getDoc(doc(db, vaultPath(vaultId)));
  const prev = existing.exists() ? (existing.data() as EncryptedVaultDoc) : null;
  const { key, saltB64 } = await vaultKey(
    vaultId,
    passphrase,
    prev?.v === 2 ? prev.saltB64 : undefined,
  );
  const { ivB64, ciphertextB64 } = await encryptJson(key, safe);

  const payload: EncryptedVaultDoc = {
    v: 2,
    updatedAt,
    saltB64,
    ivB64,
    ciphertextB64,
  };
  await setDoc(doc(db, vaultPath(vaultId)), payload, { merge: false });
  return updatedAt;
}

/** Live updates when another device writes the vault. */
export function subscribeVault(
  vaultId: string,
  passphrase: string,
  onUpdate: (snap: CloudSnapshot) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const { db } = getFirebase();
  if (!db) throw new Error('Cloud not connected');
  return onSnapshot(
    doc(db, vaultPath(vaultId)),
    (snap) => {
      void (async () => {
        if (!snap.exists()) return;
        try {
          const parsed = await parseVaultDoc(
            snap.data() as EncryptedVaultDoc & LegacyVaultDoc,
            passphrase,
            vaultId,
          );
          if (parsed) onUpdate(parsed);
        } catch (e) {
          onError?.(e instanceof Error ? e : new Error('Cloud listener failed'));
        }
      })();
    },
    (err) => onError?.(err),
  );
}

export function cloudStatusLabel(cloud: CloudSettings): string | null {
  if (!cloud.enabled || !cloud.config || !cloud.syncKey) return null;
  return 'cloud';
}
