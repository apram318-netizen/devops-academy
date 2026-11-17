import { doc, getDoc, setDoc } from 'firebase/firestore';
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

function vaultPath(vaultId: string) {
  return `vaults/${vaultId}`;
}

/** Never upload Firebase config, passphrase, or file attachment blobs/metadata. */
export function scrubSecretsForCloud(state: State): State {
  const clone = structuredClone(state);
  clone.storage = {
    ...clone.storage,
    cloud: {
      ...DEFAULT_CLOUD,
      enabled: true,
      lastCloudSync: clone.storage.cloud.lastCloudSync,
      uid: null,
    },
  };
  // Submitted files stay on-device (IndexedDB / optional folder). Cloud sync is progress only.
  for (const id of Object.keys(clone.subs)) {
    const sub = clone.subs[id];
    if (sub) clone.subs[id] = { ...sub, files: [] };
  }
  return clone;
}

/** After a cloud pull, keep any file attachments that only exist on this device. */
export function mergeLocalFileAttachments(remote: State, local: State): State {
  const subs = { ...remote.subs };
  for (const [id, localSub] of Object.entries(local.subs)) {
    if (!localSub.files?.length) continue;
    const remoteSub = subs[id];
    subs[id] = remoteSub ? { ...remoteSub, files: localSub.files } : localSub;
  }
  return { ...remote, subs };
}

export function restoreLocalSecrets(remote: State, localCloud: CloudSettings): State {
  return {
    ...remote,
    storage: {
      ...remote.storage,
      cloud: {
        ...localCloud,
        lastCloudSync: remote.storage.cloud.lastCloudSync ?? localCloud.lastCloudSync,
      },
    },
  };
}

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

export async function pullCloudState(
  vaultId: string,
  passphrase: string,
): Promise<CloudSnapshot | null> {
  const { db } = getFirebase();
  if (!db) throw new Error('Cloud not connected');
  const snap = await getDoc(doc(db, vaultPath(vaultId)));
  if (!snap.exists()) return null;
  const data = snap.data() as EncryptedVaultDoc & LegacyVaultDoc;

  if (data.v === 2 && data.ciphertextB64 && data.ivB64 && data.saltB64) {
    try {
      const { key } = await deriveVaultKey(passphrase, data.saltB64);
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
  const { key, saltB64 } = await deriveVaultKey(
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

export function cloudStatusLabel(cloud: CloudSettings): string | null {
  if (!cloud.enabled || !cloud.config || !cloud.syncKey) return null;
  return 'cloud';
}
