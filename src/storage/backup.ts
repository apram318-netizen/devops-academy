import type { State } from '../state/types';
import { loadFileBlob, listFileIds, saveFileBlob } from './idb';

export type BackupPayload = {
  version: 1;
  exportedAt: number;
  state: State;
  files: { id: string; name: string; type: string; data: string }[];
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.includes(',') ? result.split(',')[1]! : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export async function createBackup(state: State): Promise<BackupPayload> {
  const ids = await listFileIds();
  const files: BackupPayload['files'] = [];
  for (const id of ids) {
    const blob = await loadFileBlob(id);
    if (!blob) continue;
    const data = await blobToBase64(blob);
    files.push({
      id,
      name: id,
      type: blob.type || 'application/octet-stream',
      data,
    });
  }
  return { version: 1, exportedAt: Date.now(), state, files };
}

export async function restoreBackup(payload: BackupPayload): Promise<State> {
  for (const file of payload.files) {
    const blob = base64ToBlob(file.data, file.type);
    await saveFileBlob(file.id, blob);
  }
  return payload.state;
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, text: string, type = 'text/markdown'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
