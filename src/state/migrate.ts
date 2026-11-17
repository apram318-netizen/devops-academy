import { DEFAULT_CLOUD, DEFAULT_STATE, type State } from './types';

export function migrateState(raw: unknown): State {
  if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_STATE);
  const data = raw as Partial<State> & { schemaVersion?: number };
  const version = data.schemaVersion ?? 0;
  const storageIn = (data.storage ?? {}) as Partial<State['storage']>;

  const state: State = {
    ...structuredClone(DEFAULT_STATE),
    ...data,
    schemaVersion: 1,
    prefs: { ...DEFAULT_STATE.prefs, ...(data.prefs ?? {}) },
    done: data.done ?? {},
    optOut: data.optOut ?? {},
    page: data.page ?? {},
    steps: data.steps ?? {},
    subs: data.subs ?? {},
    quiz: data.quiz ?? {},
    ui: { ...DEFAULT_STATE.ui, ...(data.ui ?? {}) },
    storage: {
      ...DEFAULT_STATE.storage,
      ...storageIn,
      cloud: { ...DEFAULT_CLOUD, ...(storageIn.cloud ?? {}) },
    },
  };

  if (version < 1) {
    // Future migrations land here.
  }

  return state;
}
