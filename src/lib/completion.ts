import type { ActivityRef } from './activities';
import type { State } from '../state/types';

export type Condition = {
  id: string;
  label: string;
  done: boolean;
  progress?: string;
};

export function isDone(state: State, id: string): boolean {
  if (state.optOut[id]) return false;
  return Boolean(state.done[id]);
}

export function notesConditions(state: State, id: string, topicCount = 4): Condition[] {
  const page = state.page[id] ?? { sec: 0, end: false, ans: [] };
  const minSec = 10 * 60;
  const studied = page.sec >= minSec;
  const answered = (page.ans ?? []).filter((a) => (a?.trim().length ?? 0) >= 20).length;
  return [
    {
      id: 'time',
      label: studied ? '10 min studied' : `${Math.min(10, Math.floor(page.sec / 60))} of 10 min`,
      done: studied,
      progress: studied ? undefined : `${Math.min(10, Math.floor(page.sec / 60))} of 10 min`,
    },
    { id: 'end', label: 'Read to the end', done: page.end },
    {
      id: 'check',
      label: answered >= topicCount ? 'Self-check done' : `Self-check ${answered} of ${topicCount}`,
      done: answered >= topicCount,
    },
  ];
}

export function notesAutoComplete(state: State, id: string): boolean {
  return notesConditions(state, id).every((c) => c.done);
}

export function labConditions(state: State, id: string, stepCount: number): Condition[] {
  const steps = state.steps[id] ?? [];
  const doneSteps = steps.filter(Boolean).length;
  const sub = state.subs[id];
  const submitted = sub?.status === 'submitted';
  return [
    {
      id: 'steps',
      label: doneSteps >= stepCount ? 'All steps done' : `Steps ${doneSteps} of ${stepCount}`,
      done: doneSteps >= stepCount && stepCount > 0,
    },
    { id: 'evidence', label: submitted ? 'Evidence submitted' : 'Evidence required', done: submitted },
  ];
}

export function labAutoComplete(state: State, id: string, stepCount: number): boolean {
  return labConditions(state, id, stepCount).every((c) => c.done);
}

export function quizBestScore(state: State, id: string): number | null {
  const q = state.quiz[id];
  if (!q?.attempts.length) return null;
  const scores = q.attempts.map((a) => a.score ?? 0);
  return Math.max(...scores);
}

export function quizConditions(state: State, id: string): Condition[] {
  const best = quizBestScore(state, id);
  const passed = best !== null && best >= 2;
  return [
    {
      id: 'pass',
      label: best === null ? 'Score at least 2 of 3' : `Best ${best}/3`,
      done: passed,
    },
  ];
}

export function quizAutoComplete(state: State, id: string): boolean {
  return quizConditions(state, id).every((c) => c.done);
}

export function assessmentComplete(state: State, id: string): boolean {
  return state.subs[id]?.status === 'submitted';
}

export function activityComplete(state: State, activity: ActivityRef, stepCount = 0): boolean {
  if (state.optOut[activity.id]) return false;
  if (state.done[activity.id]) return true;
  switch (activity.kind) {
    case 'notes':
      return notesAutoComplete(state, activity.id);
    case 'lab':
    case 'scenarios':
      return labAutoComplete(state, activity.id, stepCount);
    case 'quiz':
      return quizAutoComplete(state, activity.id);
    case 'assignment':
    case 'exam':
      return assessmentComplete(state, activity.id);
    case 'guide':
      return Boolean(state.done[activity.id]);
    default:
      return false;
  }
}

export function weekProgress(
  state: State,
  activities: ActivityRef[],
  stepCounts: Record<string, number> = {},
): { done: number; total: number } {
  const total = activities.length;
  const done = activities.filter((a) => activityComplete(state, a, stepCounts[a.id] ?? 0)).length;
  return { done, total };
}
