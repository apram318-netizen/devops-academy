import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { DEFAULT_STATE, type Attempt, type FileRef, type State, type Submission } from './types';
import { migrateState } from './migrate';
import {
  clearAllData,
  deleteFileBlob,
  isPersisted,
  listFileIds,
  loadFileBlob,
  loadStateRecord,
  requestPersistentStorage,
  saveFileBlob,
  saveStateRecord,
} from '../storage/idb';
import {
  ensureFolderPermission,
  getStoredFolderHandle,
  pickFolder,
  readFolderProgress,
  supportsFolderSync,
  writeFolderSync,
} from '../storage/folder';
import { createBackup, downloadJson, restoreBackup, type BackupPayload } from '../storage/backup';

export type SaveStatus = 'browser' | 'folder' | 'error' | 'idle';

type StoreValue = {
  state: State;
  ready: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  folderNeedsReconnect: boolean;
  setPrefs: (patch: Partial<State['prefs']>) => void;
  markDone: (id: string, done?: boolean) => void;
  updatePage: (id: string, patch: Partial<State['page'][string]>) => void;
  setSteps: (id: string, steps: boolean[]) => void;
  setSubmission: (id: string, sub: Submission | null) => void;
  patchSubmission: (id: string, patch: Partial<Submission>) => void;
  setQuiz: (id: string, data: State['quiz'][string]) => void;
  patchUi: (patch: Partial<State['ui']>) => void;
  uploadFile: (file: File) => Promise<FileRef>;
  removeFile: (id: string) => Promise<void>;
  getFile: (id: string) => Promise<Blob | null>;
  connectFolder: () => Promise<void>;
  reconnectFolder: () => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<void>;
  resetProgress: () => Promise<void>;
  flush: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let t: number | undefined;
  const wrapped = (...args: Parameters<T>) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
  wrapped.flush = () => {
    window.clearTimeout(t);
  };
  wrapped.cancel = () => window.clearTimeout(t);
  return wrapped;
}

export function StoreProvider({ children }: { children: ComponentChildren }) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [folderNeedsReconnect, setFolderNeedsReconnect] = useState(false);
  const stateRef = useRef(state);
  const folderHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const folderTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const persist = useCallback(async (next: State) => {
    try {
      await saveStateRecord(next);
      setSaveError(null);
      if (folderHandleRef.current) {
        setSaveStatus('folder');
      } else {
        setSaveStatus('browser');
      }
    } catch (e) {
      setSaveStatus('error');
      setSaveError(e instanceof Error ? e.message : 'Could not save progress');
    }
  }, []);

  const persistDebounced = useMemo(() => {
    let timer: number | undefined;
    let latest: State | null = null;
    const run = (s: State) => {
      latest = s;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (latest) void persist(latest);
      }, 400);
    };
    run.flush = async () => {
      window.clearTimeout(timer);
      if (latest) await persist(latest);
      else await persist(stateRef.current);
    };
    return run;
  }, [persist]);

  const syncFolder = useCallback(async (s: State) => {
    const handle = folderHandleRef.current;
    if (!handle) return;
    const ok = await ensureFolderPermission(handle, false);
    if (!ok) {
      setFolderNeedsReconnect(true);
      return;
    }
    setFolderNeedsReconnect(false);
    const ids = await listFileIds();
    const files: { id: string; blob: Blob; name: string }[] = [];
    for (const id of ids) {
      const blob = await loadFileBlob(id);
      if (blob) files.push({ id, blob, name: id });
    }
    await writeFolderSync(handle, JSON.stringify(s, null, 2), files);
    setState((prev) => ({
      ...prev,
      storage: { ...prev.storage, lastFolderSync: Date.now(), folderName: handle.name },
    }));
    setSaveStatus('folder');
  }, []);

  const scheduleFolderSync = useCallback(
    (s: State) => {
      if (!folderHandleRef.current) return;
      window.clearTimeout(folderTimer.current);
      folderTimer.current = window.setTimeout(() => {
        void syncFolder(s).catch((e) => {
          setSaveStatus('error');
          setSaveError(e instanceof Error ? e.message : 'Folder sync failed');
        });
      }, 2000);
    },
    [syncFolder],
  );

  const update = useCallback(
    (fn: (prev: State) => State) => {
      setState((prev) => {
        const next = fn(prev);
        stateRef.current = next;
        persistDebounced(next);
        scheduleFolderSync(next);
        return next;
      });
    },
    [persistDebounced, scheduleFolderSync],
  );

  useEffect(() => {
    (async () => {
      try {
        let loaded = await loadStateRecord<unknown>();
        const handle = supportsFolderSync() ? await getStoredFolderHandle() : null;
        if (handle) {
          folderHandleRef.current = handle;
          const permitted = await ensureFolderPermission(handle, false);
          if (permitted) {
            const text = await readFolderProgress(handle);
            if (text) {
              try {
                loaded = JSON.parse(text);
              } catch {
                /* keep idb */
              }
            }
            setFolderNeedsReconnect(false);
          } else {
            setFolderNeedsReconnect(true);
          }
        }

        const migrated = migrateState(loaded);
        const persisted = await requestPersistentStorage();
        const persistedFlag = await isPersisted();
        migrated.storage.persisted = persistedFlag ?? persisted;
        if (handle) migrated.storage.folderName = handle.name;
        setState(migrated);
        stateRef.current = migrated;
        setSaveStatus(handle && !folderNeedsReconnect ? 'folder' : 'browser');
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Failed to load');
        setSaveStatus('error');
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    const flush = () => {
      void persistDebounced.flush();
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [persistDebounced]);

  const value: StoreValue = {
    state,
    ready,
    saveStatus,
    saveError,
    folderNeedsReconnect,
    setPrefs: (patch) => update((s) => ({ ...s, prefs: { ...s.prefs, ...patch } })),
    markDone: (id, done = true) =>
      update((s) => {
        const next = { ...s, done: { ...s.done }, optOut: { ...s.optOut } };
        if (done) {
          next.done[id] = Date.now();
          delete next.optOut[id];
        } else {
          delete next.done[id];
          next.optOut[id] = true;
        }
        return next;
      }),
    updatePage: (id, patch) =>
      update((s) => ({
        ...s,
        page: {
          ...s.page,
          [id]: { ...(s.page[id] ?? { sec: 0, end: false, ans: [] }), ...patch },
        },
      })),
    setSteps: (id, steps) => update((s) => ({ ...s, steps: { ...s.steps, [id]: steps } })),
    setSubmission: (id, sub) =>
      update((s) => {
        const subs = { ...s.subs };
        if (sub) subs[id] = sub;
        else delete subs[id];
        return { ...s, subs };
      }),
    patchSubmission: (id, patch) =>
      update((s) => {
        const cur = s.subs[id] ?? {
          status: 'draft' as const,
          files: [],
          text: '',
          modified: Date.now(),
          attempt: 1,
        };
        return { ...s, subs: { ...s.subs, [id]: { ...cur, ...patch, modified: Date.now() } } };
      }),
    setQuiz: (id, data) => update((s) => ({ ...s, quiz: { ...s.quiz, [id]: data } })),
    patchUi: (patch) => update((s) => ({ ...s, ui: { ...s.ui, ...patch } })),
    uploadFile: async (file) => {
      if (file.size > 20 * 1024 * 1024) throw new Error('Each file must be 20 MB or smaller');
      const id = `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await saveFileBlob(id, file);
      return { id, name: file.name, size: file.size, type: file.type || 'application/octet-stream' };
    },
    removeFile: async (id) => {
      await deleteFileBlob(id);
    },
    getFile: (id) => loadFileBlob(id),
    connectFolder: async () => {
      const handle = await pickFolder();
      if (!handle) return;
      folderHandleRef.current = handle;
      setFolderNeedsReconnect(false);
      update((s) => ({
        ...s,
        storage: { ...s.storage, folderName: handle.name, lastFolderSync: Date.now() },
      }));
      await syncFolder(stateRef.current);
    },
    reconnectFolder: async () => {
      const handle = folderHandleRef.current ?? (await getStoredFolderHandle());
      if (!handle) {
        await value.connectFolder();
        return;
      }
      const ok = await ensureFolderPermission(handle, true);
      if (ok) {
        folderHandleRef.current = handle;
        setFolderNeedsReconnect(false);
        await syncFolder(stateRef.current);
      }
    },
    exportBackup: async () => {
      const payload = await createBackup(stateRef.current);
      downloadJson(`devops-academy-backup-${new Date().toISOString().slice(0, 10)}.json`, payload);
      update((s) => ({ ...s, prefs: { ...s.prefs, lastBackup: Date.now() } }));
    },
    importBackup: async (file) => {
      const text = await file.text();
      const payload = JSON.parse(text) as BackupPayload;
      const restored = await restoreBackup(payload);
      const migrated = migrateState(restored);
      setState(migrated);
      stateRef.current = migrated;
      await saveStateRecord(migrated);
      setSaveStatus('browser');
    },
    resetProgress: async () => {
      await clearAllData();
      const next = structuredClone(DEFAULT_STATE);
      next.prefs = { ...stateRef.current.prefs, lastBackup: null };
      next.storage = { persisted: stateRef.current.storage.persisted, folderName: null, lastFolderSync: null };
      folderHandleRef.current = null;
      setState(next);
      stateRef.current = next;
      await saveStateRecord(next);
    },
    flush: async () => {
      await persistDebounced.flush();
    },
  };

  void debounce;
  void (null as unknown as Attempt);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
