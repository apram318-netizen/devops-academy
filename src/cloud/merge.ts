import type { Attempt, PageProgress, State, Submission } from '../state/types';

function mergePage(a?: PageProgress, b?: PageProgress): PageProgress | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    sec: Math.max(a.sec, b.sec),
    end: a.end || b.end,
    ans: a.ans.length >= b.ans.length ? a.ans : b.ans,
  };
}

function mergeSteps(a?: boolean[], b?: boolean[]): boolean[] | undefined {
  if (!a) return b;
  if (!b) return a;
  const len = Math.max(a.length, b.length);
  return Array.from({ length: len }, (_, i) => Boolean(a[i] || b[i]));
}

function mergeSubmission(a?: Submission, b?: Submission): Submission | undefined {
  if (!a) return b;
  if (!b) return a;
  const newer = a.modified >= b.modified ? a : b;
  const older = a.modified >= b.modified ? b : a;
  const files = [...newer.files];
  for (const f of older.files) {
    if (!files.some((x) => x.id === f.id)) files.push(f);
  }
  return { ...older, ...newer, files };
}

function mergeQuiz(
  a?: { attempts: Attempt[]; current: Attempt | null },
  b?: { attempts: Attempt[]; current: Attempt | null },
): { attempts: Attempt[]; current: Attempt | null } | undefined {
  if (!a) return b;
  if (!b) return a;
  const attempts = a.attempts.length >= b.attempts.length ? a.attempts : b.attempts;
  const aEnd = a.current?.end ?? a.attempts.at(-1)?.end ?? 0;
  const bEnd = b.current?.end ?? b.attempts.at(-1)?.end ?? 0;
  const current = (aEnd >= bEnd ? a.current : b.current) ?? a.current ?? b.current;
  return { attempts, current };
}

function uniq(arr: string[]): string[] {
  return [...new Set(arr)];
}

/**
 * Union of all learner progress from two devices so Firestore keeps every item.
 * File *blobs* remain device-local; file metadata can still travel with submissions.
 */
export function mergeProgressStates(remote: State, local: State): State {
  const done: State['done'] = { ...remote.done };
  for (const [id, ts] of Object.entries(local.done)) {
    if (!done[id] || ts > done[id]!) done[id] = ts;
  }

  const optOut: State['optOut'] = { ...remote.optOut, ...local.optOut };
  for (const id of Object.keys(done)) delete optOut[id];

  const pageIds = new Set([...Object.keys(remote.page), ...Object.keys(local.page)]);
  const page: State['page'] = {};
  for (const id of pageIds) {
    const p = mergePage(remote.page[id], local.page[id]);
    if (p) page[id] = p;
  }

  const stepIds = new Set([...Object.keys(remote.steps), ...Object.keys(local.steps)]);
  const steps: State['steps'] = {};
  for (const id of stepIds) {
    const s = mergeSteps(remote.steps[id], local.steps[id]);
    if (s) steps[id] = s;
  }

  const subIds = new Set([...Object.keys(remote.subs), ...Object.keys(local.subs)]);
  const subs: State['subs'] = {};
  for (const id of subIds) {
    const s = mergeSubmission(remote.subs[id], local.subs[id]);
    if (s) subs[id] = s;
  }

  const quizIds = new Set([...Object.keys(remote.quiz), ...Object.keys(local.quiz)]);
  const quiz: State['quiz'] = {};
  for (const id of quizIds) {
    const q = mergeQuiz(remote.quiz[id], local.quiz[id]);
    if (q) quiz[id] = q;
  }

  const remotePrefsNewer =
    (remote.storage.cloud.lastCloudSync ?? 0) >= (local.storage.cloud.lastCloudSync ?? 0);

  return {
    schemaVersion: 1,
    prefs: remotePrefsNewer ? { ...local.prefs, ...remote.prefs } : { ...remote.prefs, ...local.prefs },
    done,
    optOut,
    page,
    steps,
    subs,
    quiz,
    ui: {
      starred: uniq([...remote.ui.starred, ...local.ui.starred]),
      hidden: uniq([...remote.ui.hidden, ...local.ui.hidden]),
      recent: uniq([...local.ui.recent, ...remote.ui.recent]).slice(0, 40),
      dismissedWelcome: uniq([...remote.ui.dismissedWelcome, ...local.ui.dismissedWelcome]),
    },
    storage: {
      persisted: local.storage.persisted,
      folderName: local.storage.folderName,
      lastFolderSync: local.storage.lastFolderSync,
      cloud: {
        ...local.storage.cloud,
        lastCloudSync: Math.max(
          remote.storage.cloud.lastCloudSync ?? 0,
          local.storage.cloud.lastCloudSync ?? 0,
        ) || null,
      },
    },
  };
}

/** Stable fingerprint of synced progress (excludes secrets / device storage). */
export function progressFingerprint(state: State): string {
  return JSON.stringify({
    prefs: state.prefs,
    done: state.done,
    optOut: state.optOut,
    page: state.page,
    steps: state.steps,
    subs: state.subs,
    quiz: state.quiz,
    ui: state.ui,
  });
}
