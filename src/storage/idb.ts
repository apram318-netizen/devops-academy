const DB_NAME = 'devops-academy';
const DB_VERSION = 1;

type Stores = 'state' | 'files' | 'meta';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

async function withStore<T>(
  store: Stores,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const s = tx.objectStore(store);
    const req = fn(s);
    tx.oncomplete = () => {
      db.close();
      if (req) resolve(req.result);
      else resolve(undefined as T);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB transaction failed'));
    };
    if (req) {
      req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
    }
  });
}

export async function loadStateRecord<T>(): Promise<T | null> {
  return withStore('state', 'readonly', (s) => s.get('main'));
}

export async function saveStateRecord<T>(state: T): Promise<void> {
  await withStore('state', 'readwrite', (s) => {
    s.put(state, 'main');
  });
}

export async function saveFileBlob(id: string, blob: Blob): Promise<void> {
  await withStore('files', 'readwrite', (s) => {
    s.put(blob, id);
  });
}

export async function loadFileBlob(id: string): Promise<Blob | null> {
  return withStore('files', 'readonly', (s) => s.get(id));
}

export async function deleteFileBlob(id: string): Promise<void> {
  await withStore('files', 'readwrite', (s) => {
    s.delete(id);
  });
}

export async function listFileIds(): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const req = tx.objectStore('files').getAllKeys();
    req.onsuccess = () => {
      db.close();
      resolve(req.result.map(String));
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function clearAllData(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['state', 'files', 'meta'], 'readwrite');
    tx.objectStore('state').clear();
    tx.objectStore('files').clear();
    tx.objectStore('meta').clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function saveMeta<T>(key: string, value: T): Promise<void> {
  await withStore('meta', 'readwrite', (s) => {
    s.put(value, key);
  });
}

export async function loadMeta<T>(key: string): Promise<T | null> {
  return withStore('meta', 'readonly', (s) => s.get(key));
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      return await navigator.storage.persist();
    }
  } catch {
    /* ignore */
  }
  return false;
}

export async function isPersisted(): Promise<boolean | null> {
  try {
    if (navigator.storage?.persisted) {
      return await navigator.storage.persisted();
    }
  } catch {
    /* ignore */
  }
  return null;
}
