import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  DEFAULT_CLOUD,
  DEFAULT_STATE,
  type Attempt,
  type CloudSettings,
  type FileRef,
  type FirebaseWebConfig,
  type State,
  type Submission,
} from './types';
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
import {
  connectCloud,
  mergeProgressStates,
  progressFingerprint,
  pullCloudState,
  pushCloudState,
  subscribeVault,
} from '../cloud/sync';
import { sha256Hex } from '../cloud/hash';
import type { Unsubscribe } from 'firebase/firestore';

export type SaveStatus = 'browser' | 'folder' | 'cloud' | 'error' | 'idle';

type StoreValue = {
  state: State;
  ready: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  folderNeedsReconnect: boolean;
  cloudReady: boolean;
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
  connectCloudSync: (
    config: FirebaseWebConfig,
    syncKey: string,
    opts?: { remember?: boolean },
  ) => Promise<void>;
  disconnectCloudSync: () => void;
  syncNow: () => Promise<void>;
  exportBackup: () => Promise<void>;
  importBackup: (file: File) => Promise<void>;
  resetProgress: () => Promise<void>;
  flush: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ComponentChildren }) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [folderNeedsReconnect, setFolderNeedsReconnect] = useState(false);
  const [cloudReady, setCloudReady] = useState(false);
  const stateRef = useRef(state);
  const folderHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const folderTimer = useRef<number | undefined>(undefined);
  const cloudTimer = useRef<number | undefined>(undefined);
  const vaultIdRef = useRef<string | null>(null);
  const vaultUnsubRef = useRef<Unsubscribe | null>(null);
  const applyingRemoteRef = useRef(false);
  const lastSeenRemoteAt = useRef(0);
  const scheduleCloudSyncRef = useRef<(s: State) => void>(() => {});

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const persistLocal = useCallback(async (next: State) => {
    // Never write the raw passphrase to disk unless the user opted into "Remember".
    const toSave =
      next.storage.cloud.rememberKey && next.storage.cloud.syncKey
        ? next
        : {
            ...next,
            storage: {
              ...next.storage,
              cloud: { ...next.storage.cloud, syncKey: '' },
            },
          };
    await saveStateRecord(toSave);
  }, []);

  const stopVaultListener = useCallback(() => {
    vaultUnsubRef.current?.();
    vaultUnsubRef.current = null;
  }, []);

  const syncCloud = useCallback(async (s: State) => {
    const cloud = s.storage.cloud;
    if (!cloud.enabled || !cloud.config || !cloud.syncKey || !vaultIdRef.current) return;
    if (applyingRemoteRef.current) return;
    const updatedAt = await pushCloudState(vaultIdRef.current, s, cloud.syncKey);
    lastSeenRemoteAt.current = Math.max(lastSeenRemoteAt.current, updatedAt);
    setState((prev) => {
      const next = {
        ...prev,
        storage: {
          ...prev.storage,
          cloud: { ...prev.storage.cloud, lastCloudSync: updatedAt },
        },
      };
      stateRef.current = next;
      return next;
    });
    setSaveStatus('cloud');
    setSaveError(null);
  }, []);

  const scheduleCloudSync = useCallback(
    (s: State) => {
      if (!s.storage.cloud.enabled || !vaultIdRef.current || applyingRemoteRef.current) return;
      window.clearTimeout(cloudTimer.current);
      cloudTimer.current = window.setTimeout(() => {
        void syncCloud(s).catch((e) => {
          setSaveStatus('error');
          setSaveError(e instanceof Error ? e.message : 'Cloud sync failed');
        });
      }, 300);
    },
    [syncCloud],
  );

  useEffect(() => {
    scheduleCloudSyncRef.current = scheduleCloudSync;
  }, [scheduleCloudSync]);

  const applyRemoteSnapshot = useCallback(async (remoteUpdatedAt: number, remoteState: State) => {
    if (remoteUpdatedAt <= lastSeenRemoteAt.current) return;
    if (remoteUpdatedAt <= (stateRef.current.storage.cloud.lastCloudSync ?? 0)) return;

    lastSeenRemoteAt.current = remoteUpdatedAt;
    applyingRemoteRef.current = true;
    const local = stateRef.current;
    const cloud = local.storage.cloud;
    const migratedRemote = migrateState(remoteState);
    let next = mergeProgressStates(migratedRemote, local);
    next = {
      ...next,
      storage: {
        ...next.storage,
        persisted: local.storage.persisted,
        folderName: local.storage.folderName,
        lastFolderSync: local.storage.lastFolderSync,
        cloud: {
          ...cloud,
          enabled: true,
          config: cloud.config,
          syncKey: cloud.syncKey,
          lastCloudSync: remoteUpdatedAt,
        },
      },
    };
    const shouldRepublish = progressFingerprint(next) !== progressFingerprint(migratedRemote);
    stateRef.current = next;
    setState(next);
    await persistLocal(next);
    setSaveStatus('cloud');
    setSaveError(null);
    applyingRemoteRef.current = false;
    if (shouldRepublish) scheduleCloudSyncRef.current(next);
  }, [persistLocal]);

  const startVaultListener = useCallback(
    (vaultId: string, passphrase: string) => {
      stopVaultListener();
      vaultUnsubRef.current = subscribeVault(
        vaultId,
        passphrase,
        (snap) => {
          void applyRemoteSnapshot(snap.updatedAt, snap.state).catch((e) => {
            setSaveError(e instanceof Error ? e.message : 'Live sync failed');
          });
        },
        (err) => {
          setSaveError(err.message);
        },
      );
    },
    [applyRemoteSnapshot, stopVaultListener],
  );

  const persist = useCallback(
    async (next: State) => {
      try {
        await persistLocal(next);
        setSaveError(null);
        if (next.storage.cloud.enabled && vaultIdRef.current) {
          setSaveStatus('cloud');
        } else if (folderHandleRef.current) {
          setSaveStatus('folder');
        } else {
          setSaveStatus('browser');
        }
      } catch (e) {
        setSaveStatus('error');
        setSaveError(e instanceof Error ? e.message : 'Could not save progress');
      }
    },
    [persistLocal],
  );

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
      window.clearTimeout(cloudTimer.current);
      if (stateRef.current.storage.cloud.enabled && vaultIdRef.current) {
        await syncCloud(stateRef.current);
      }
    };
    return run;
  }, [persist, syncCloud]);

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
    if (!s.storage.cloud.enabled) setSaveStatus('folder');
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
        scheduleCloudSync(next);
        return next;
      });
    },
    [persistDebounced, scheduleFolderSync, scheduleCloudSync],
  );

  const bootstrapCloud = useCallback(
    async (cloud: CloudSettings, local: State) => {
      if (!cloud.enabled || !cloud.config || !cloud.syncKey) {
        setCloudReady(false);
        vaultIdRef.current = null;
        stopVaultListener();
        return local;
      }
      const { uid, vaultId } = await connectCloud(cloud.config, cloud.syncKey);
      vaultIdRef.current = vaultId;
      setCloudReady(true);

      const remote = await pullCloudState(vaultId, cloud.syncKey);
      let merged: State;
      if (remote) {
        // Union every progress item from cloud + this device, then publish so Firestore has it all.
        merged = mergeProgressStates(migrateState(remote.state), local);
      } else {
        merged = local;
      }
      merged = {
        ...merged,
        storage: {
          ...merged.storage,
          persisted: local.storage.persisted,
          folderName: local.storage.folderName,
          lastFolderSync: local.storage.lastFolderSync,
          cloud: {
            ...cloud,
            uid,
            enabled: true,
            config: cloud.config,
            syncKey: cloud.syncKey,
          },
        },
      };

      const updatedAt = await pushCloudState(vaultId, merged, cloud.syncKey);
      merged.storage.cloud.lastCloudSync = updatedAt;
      lastSeenRemoteAt.current = updatedAt;

      startVaultListener(vaultId, cloud.syncKey);
      return merged;
    },
    [startVaultListener, stopVaultListener],
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

        let migrated = migrateState(loaded);
        const persisted = await requestPersistentStorage();
        const persistedFlag = await isPersisted();
        migrated.storage.persisted = persistedFlag ?? persisted;
        if (handle) migrated.storage.folderName = handle.name;

        if (migrated.storage.cloud.enabled && migrated.storage.cloud.config && migrated.storage.cloud.syncKey) {
          try {
            migrated = await bootstrapCloud(migrated.storage.cloud, migrated);
            setSaveStatus('cloud');
          } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Cloud connect failed');
            setCloudReady(false);
            setSaveStatus(handle ? 'folder' : 'browser');
          }
        } else {
          setSaveStatus(handle && !folderNeedsReconnect ? 'folder' : 'browser');
        }

        setState(migrated);
        stateRef.current = migrated;
        await persistLocal(migrated);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Failed to load');
        setSaveStatus('error');
      } finally {
        setReady(true);
      }
    })();
    // bootstrap/persist helpers are stable enough for one-shot boot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const flush = () => {
      void persistDebounced.flush();
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        flush();
        return;
      }
      // Pull latest when returning to the tab (phones often suspend listeners).
      const cloud = stateRef.current.storage.cloud;
      if (!cloud.enabled || !cloud.syncKey || !vaultIdRef.current) return;
      void pullCloudState(vaultIdRef.current, cloud.syncKey)
        .then((remote) => {
          if (remote) return applyRemoteSnapshot(remote.updatedAt, remote.state);
        })
        .catch((e) => {
          setSaveError(e instanceof Error ? e.message : 'Cloud pull failed');
        });
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [persistDebounced, applyRemoteSnapshot]);

  useEffect(() => () => stopVaultListener(), [stopVaultListener]);

  const value: StoreValue = {
    state,
    ready,
    saveStatus,
    saveError,
    folderNeedsReconnect,
    cloudReady,
    setPrefs: (patch) => update((s) => ({ ...s, prefs: { ...s.prefs, ...patch } })),
    markDone: (id, done = true) => {
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
      });
      void persistDebounced.flush();
    },
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
    connectCloudSync: async (config, syncKey, opts) => {
      const remember = opts?.remember ?? true;
      const { uid, vaultId } = await connectCloud(config, syncKey);
      vaultIdRef.current = vaultId;
      setCloudReady(true);
      const cloud: CloudSettings = {
        enabled: true,
        config,
        syncKey,
        rememberKey: remember,
        uid,
        lastCloudSync: stateRef.current.storage.cloud.lastCloudSync,
      };
      let next = {
        ...stateRef.current,
        storage: { ...stateRef.current.storage, cloud },
      };
      next = await bootstrapCloud(cloud, next);
      next.storage.cloud.rememberKey = remember;
      next.storage.cloud.syncKey = syncKey;
      setState(next);
      stateRef.current = next;
      await persistLocal(next);
      setSaveStatus('cloud');
      setSaveError(null);
    },
    disconnectCloudSync: () => {
      stopVaultListener();
      vaultIdRef.current = null;
      setCloudReady(false);
      update((s) => ({
        ...s,
        storage: {
          ...s.storage,
          cloud: {
            ...DEFAULT_CLOUD,
            config: s.storage.cloud.config,
            rememberKey: s.storage.cloud.rememberKey,
          },
        },
      }));
      setSaveStatus(folderHandleRef.current ? 'folder' : 'browser');
    },
    syncNow: async () => {
      if (!vaultIdRef.current) throw new Error('Cloud sync is not connected');
      await persistDebounced.flush();
      await syncCloud(stateRef.current);
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
      let migrated = migrateState(restored);
      if (migrated.storage.cloud.enabled && migrated.storage.cloud.config && migrated.storage.cloud.syncKey) {
        migrated = await bootstrapCloud(migrated.storage.cloud, migrated);
        setSaveStatus('cloud');
      } else {
        setSaveStatus('browser');
      }
      setState(migrated);
      stateRef.current = migrated;
      await persistLocal(migrated);
    },
    resetProgress: async () => {
      const cloud = stateRef.current.storage.cloud;
      await clearAllData();
      const next = structuredClone(DEFAULT_STATE);
      next.prefs = { ...stateRef.current.prefs, lastBackup: null };
      next.storage = {
        persisted: stateRef.current.storage.persisted,
        folderName: null,
        lastFolderSync: null,
        cloud: cloud.enabled
          ? { ...cloud, lastCloudSync: null }
          : { ...DEFAULT_CLOUD },
      };
      folderHandleRef.current = null;
      setState(next);
      stateRef.current = next;
      await persistLocal(next);
      if (next.storage.cloud.enabled && vaultIdRef.current && next.storage.cloud.syncKey) {
        await pushCloudState(vaultIdRef.current, next, next.storage.cloud.syncKey);
      }
    },
    flush: async () => {
      await persistDebounced.flush();
    },
  };

  void sha256Hex;
  void (null as unknown as Attempt);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
