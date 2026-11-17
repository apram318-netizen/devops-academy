import { doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, getBlob, listAll, ref, uploadBytes } from 'firebase/storage';
import type { State } from '../state/types';
import { DEFAULT_CLOUD } from '../state/types';
import { sha256Hex } from './hash';
import { getFirebase, initFirebase } from './firebase';
import {
  decryptBlob,
  decryptJson,
  deriveVaultKey,
  encryptBlob,
  encryptJson,
} from './crypto';
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

/** Never upload Firebase web config or the raw passphrase to Firestore. */
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
  return clone;
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

  // Legacy plaintext docs from the first cloud-sync build
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

async function vaultKeyForFiles(vaultId: string, passphrase: string): Promise<CryptoKey> {
  const { db } = getFirebase();
  if (!db) throw new Error('Cloud not connected');
  const snap = await getDoc(doc(db, vaultPath(vaultId)));
  const data = snap.exists() ? (snap.data() as EncryptedVaultDoc) : null;
  if (data?.v === 2 && data.saltB64) {
    const { key } = await deriveVaultKey(passphrase, data.saltB64);
    return key;
  }
  const { key } = await deriveVaultKey(passphrase);
  return key;
}

export async function pushCloudFile(
  vaultId: string,
  id: string,
  blob: Blob,
  passphrase: string,
): Promise<void> {
  const { storage } = getFirebase();
  if (!storage) throw new Error('Cloud not connected');
  const key = await vaultKeyForFiles(vaultId, passphrase);
  const encrypted = await encryptBlob(key, blob);
  const r = ref(storage, `${vaultPath(vaultId)}/files/${id}`);
  await uploadBytes(r, encrypted, { contentType: 'application/octet-stream' });
}

export async function pullCloudFile(
  vaultId: string,
  id: string,
  passphrase: string,
): Promise<Blob | null> {
  const { storage } = getFirebase();
  if (!storage) throw new Error('Cloud not connected');
  try {
    const raw = await getBlob(ref(storage, `${vaultPath(vaultId)}/files/${id}`));
    const key = await vaultKeyForFiles(vaultId, passphrase);
    return await decryptBlob(key, raw);
  } catch {
    return null;
  }
}

export async function deleteCloudFile(vaultId: string, id: string): Promise<void> {
  const { storage } = getFirebase();
  if (!storage) return;
  try {
    await deleteObject(ref(storage, `${vaultPath(vaultId)}/files/${id}`));
  } catch {
    /* ignore missing */
  }
}

export async function listCloudFileIds(vaultId: string): Promise<string[]> {
  const { storage } = getFirebase();
  if (!storage) return [];
  try {
    const res = await listAll(ref(storage, `${vaultPath(vaultId)}/files`));
    return res.items.map((i) => i.name);
  } catch {
    return [];
  }
}

export async function pushAllFiles(
  vaultId: string,
  files: { id: string; blob: Blob }[],
  passphrase: string,
): Promise<void> {
  for (const f of files) {
    await pushCloudFile(vaultId, f.id, f.blob, passphrase);
  }
}

export async function pullMissingFiles(
  vaultId: string,
  neededIds: string[],
  passphrase: string,
  hasLocal: (id: string) => Promise<boolean>,
  saveLocal: (id: string, blob: Blob) => Promise<void>,
): Promise<number> {
  let n = 0;
  for (const id of neededIds) {
    if (await hasLocal(id)) continue;
    const blob = await pullCloudFile(vaultId, id, passphrase);
    if (blob) {
      await saveLocal(id, blob);
      n++;
    }
  }
  return n;
}

export function cloudStatusLabel(cloud: CloudSettings): string | null {
  if (!cloud.enabled || !cloud.config || !cloud.syncKey) return null;
  return 'cloud';
}
