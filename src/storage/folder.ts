import { loadMeta, saveMeta } from './idb';

const HANDLE_KEY = 'folderHandle';

export function supportsFolderSync(): boolean {
  return typeof window !== 'undefined' && typeof (window as Window).showDirectoryPicker === 'function';
}

export async function pickFolder(): Promise<FileSystemDirectoryHandle | null> {
  const picker = (window as Window).showDirectoryPicker;
  if (!supportsFolderSync() || !picker) return null;
  const handle = await picker({ mode: 'readwrite', id: 'devops-academy' });
  await saveMeta(HANDLE_KEY, handle);
  return handle;
}

export async function getStoredFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
  return loadMeta<FileSystemDirectoryHandle>(HANDLE_KEY);
}

export async function ensureFolderPermission(
  handle: FileSystemDirectoryHandle,
  interactive = false,
): Promise<boolean> {
  const opts = { mode: 'readwrite' as const };
  const h = handle as FileSystemDirectoryHandle & {
    queryPermission?: (d?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
    requestPermission?: (d?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  };
  if (h.queryPermission) {
    const status = await h.queryPermission(opts);
    if (status === 'granted') return true;
    if (!interactive) return false;
  }
  if (h.requestPermission) {
    const status = await h.requestPermission(opts);
    return status === 'granted';
  }
  return false;
}

export async function writeFolderSync(
  handle: FileSystemDirectoryHandle,
  progressJson: string,
  files: { id: string; blob: Blob; name: string }[],
): Promise<void> {
  const progress = await handle.getFileHandle('progress.json', { create: true });
  const writable = await progress.createWritable();
  await writable.write(progressJson);
  await writable.close();

  const filesDir = await handle.getDirectoryHandle('files', { create: true });
  for (const file of files) {
    const fh = await filesDir.getFileHandle(`${file.id}__${file.name}`, { create: true });
    const w = await fh.createWritable();
    await w.write(file.blob);
    await w.close();
  }
}

export async function readFolderProgress(
  handle: FileSystemDirectoryHandle,
): Promise<string | null> {
  try {
    const fh = await handle.getFileHandle('progress.json');
    const file = await fh.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

export async function clearFolderHandle(): Promise<void> {
  await saveMeta(HANDLE_KEY, null);
}
