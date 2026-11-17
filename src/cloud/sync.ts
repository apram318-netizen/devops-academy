import { doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, getBlob, listAll, ref, uploadBytes } from 'firebase/storage';
import type { State } from '../state/types';
import { sha256Hex } from './hash';
import { getFirebase, initFirebase } from './firebase';
import type { CloudSettings, FirebaseWebConfig } from './types';

export type CloudSnapshot = {
  updatedAt: number;
  state: State;
};

function vaultPath(vaultId: string) {
  return `vaults/${vaultId}`;
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

export async function pullCloudState(vaultId: string): Promise<CloudSnapshot | null> {
  const { db } = getFirebase();
  if (!db) throw new Error('Cloud not connected');
  const snap = await getDoc(doc(db, vaultPath(vaultId)));
  if (!snap.exists()) return null;
  const data = snap.data() as CloudSnapshot;
  if (!data?.state) return null;
  return { updatedAt: data.updatedAt ?? 0, state: data.state };
}

export async function pushCloudState(vaultId: string, state: State): Promise<number> {
  const { db } = getFirebase();
  if (!db) throw new Error('Cloud not connected');
  const updatedAt = Date.now();
  // Strip nothing — full learner state. Document must stay under ~1 MB (fine for this app).
  await setDoc(doc(db, vaultPath(vaultId)), { updatedAt, state }, { merge: false });
  return updatedAt;
}

export async function pushCloudFile(vaultId: string, id: string, blob: Blob): Promise<void> {
  const { storage } = getFirebase();
  if (!storage) throw new Error('Cloud not connected');
  const r = ref(storage, `${vaultPath(vaultId)}/files/${id}`);
  await uploadBytes(r, blob, { contentType: blob.type || 'application/octet-stream' });
}

export async function pullCloudFile(vaultId: string, id: string): Promise<Blob | null> {
  const { storage } = getFirebase();
  if (!storage) throw new Error('Cloud not connected');
  try {
    return await getBlob(ref(storage, `${vaultPath(vaultId)}/files/${id}`));
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
): Promise<void> {
  for (const f of files) {
    await pushCloudFile(vaultId, f.id, f.blob);
  }
}

export async function pullMissingFiles(
  vaultId: string,
  neededIds: string[],
  hasLocal: (id: string) => Promise<boolean>,
  saveLocal: (id: string, blob: Blob) => Promise<void>,
): Promise<number> {
  let n = 0;
  for (const id of neededIds) {
    if (await hasLocal(id)) continue;
    const blob = await pullCloudFile(vaultId, id);
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
