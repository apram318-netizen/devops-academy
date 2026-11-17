export type ActivityId = string;

export type FileRef = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export type Submission = {
  status: 'draft' | 'submitted';
  files: FileRef[];
  text: string;
  modified: number;
  submittedAt?: number;
  attempt: number;
  grade?: number;
  rubric?: boolean[];
  override?: number | null;
  feedback?: string;
  gradedAt?: number;
};

export type Attempt = {
  start: number;
  end?: number;
  order: number[][];
  answers: (number | null)[];
  score?: number;
};

export type PageProgress = {
  sec: number;
  end: boolean;
  ans: string[];
};

export type Prefs = {
  name: string;
  start: string;
  lastBackup: number | null;
  theme: 'system' | 'light' | 'dark';
};

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export type CloudSettings = {
  enabled: boolean;
  config: FirebaseWebConfig | null;
  /** Present in memory while unlocked; only persisted when rememberKey is true. */
  syncKey: string;
  rememberKey: boolean;
  lastCloudSync: number | null;
  uid: string | null;
};

export type State = {
  schemaVersion: 1;
  prefs: Prefs;
  done: Record<ActivityId, number>;
  optOut: Record<ActivityId, true>;
  page: Record<ActivityId, PageProgress>;
  steps: Record<ActivityId, boolean[]>;
  subs: Record<ActivityId, Submission>;
  quiz: Record<ActivityId, { attempts: Attempt[]; current: Attempt | null }>;
  ui: {
    starred: string[];
    hidden: string[];
    recent: string[];
    dismissedWelcome: string[];
  };
  storage: {
    persisted: boolean | null;
    folderName: string | null;
    lastFolderSync: number | null;
    cloud: CloudSettings;
  };
};

export const DEFAULT_CLOUD: CloudSettings = {
  enabled: false,
  config: null,
  syncKey: '',
  rememberKey: true,
  lastCloudSync: null,
  uid: null,
};

export const DEFAULT_STATE: State = {
  schemaVersion: 1,
  prefs: {
    name: 'Apramjot Singh',
    start: '2026-11-23',
    lastBackup: null,
    theme: 'system',
  },
  done: {},
  optOut: {},
  page: {},
  steps: {},
  subs: {},
  quiz: {},
  ui: {
    starred: [],
    hidden: [],
    recent: [],
    dismissedWelcome: [],
  },
  storage: {
    persisted: null,
    folderName: null,
    lastFolderSync: null,
    cloud: { ...DEFAULT_CLOUD },
  },
};
