import type { ActivityRef } from './activities';
import { activityHref, stepCountForActivity, unitWeekIndex } from './activities';
import { activityComplete, isDone, notesConditions, quizBestScore } from './completion';
import { getUnit } from '../data/curriculum';
import type { State } from '../state/types';
import { dueSunday, formatShortDateTime, relativeDue } from './dates';

export function defaultStepCount(activity: ActivityRef): number {
  const unit = getUnit(activity.unitId);
  if (!unit || activity.week == null) return 0;
  const idx = unitWeekIndex(unit, activity.week);
  if (idx == null) return 0;
  return stepCountForActivity(unit, idx, activity);
}

export type NextStepResult = {
  text: string;
  href: string;
  cta: string;
  complete: boolean;
  nextWeekHref?: string;
  nextWeekLabel?: string;
};

export function computeNextStep(
  state: State,
  activities: ActivityRef[],
  stepCounts: Record<string, number> = {},
): NextStepResult {
  const programStart = state.prefs.start;
  const unitId = activities[0]?.unitId;
  const week = activities[0]?.week;
  const incomplete = activities.filter((a) => !activityComplete(state, a, stepCounts[a.id] ?? 0));

  if (incomplete.length === 0) {
    const nextWeek = week != null ? week + 1 : undefined;
    const nextHref =
      unitId && nextWeek != null ? `#/course/${unitId}/week/${nextWeek}` : `#/course/${unitId}/week/${week}`;
    return {
      text: 'You have finished everything due this week.',
      href: nextHref,
      cta: 'Go to next week',
      complete: true,
      nextWeekHref: nextHref,
      nextWeekLabel: 'Go to next week',
    };
  }

  const a = incomplete[0]!;
  const href = activityHref(a);

  switch (a.kind) {
    case 'notes': {
      const cond = notesConditions(state, a.id);
      const time = cond.find((c) => c.id === 'time');
      const label = time?.label ?? '0 of 10 min';
      return {
        text: time?.done ? 'Finish the self-check on the notes' : `Study the notes: ${label}`,
        href,
        cta: isDone(state, a.id) ? 'Review notes' : 'Continue notes',
        complete: false,
      };
    }
    case 'lab':
    case 'scenarios': {
      const total = stepCounts[a.id] ?? 0;
      const steps = state.steps[a.id] ?? [];
      const doneSteps = steps.filter(Boolean).length;
      if (total > 0 && doneSteps < total) {
        return {
          text: `Complete lab steps (${doneSteps} of ${total})`,
          href,
          cta: 'Continue lab',
          complete: false,
        };
      }
      const sub = state.subs[a.id];
      if (sub?.status !== 'submitted') {
        const due = a.dueWeek ? dueSunday(programStart, a.dueWeek) : null;
        const rel = due ? relativeDue(due).text : '';
        return {
          text: rel ? `Submit lab evidence, ${rel.toLowerCase()}` : 'Submit lab evidence',
          href,
          cta: 'Add evidence',
          complete: false,
        };
      }
      return { text: a.title, href, cta: 'Open lab', complete: false };
    }
    case 'quiz': {
      const q = state.quiz[a.id];
      if (q?.current && !q.current.end) {
        return { text: 'Continue your quiz attempt', href: `${href}/attempt`, cta: 'Continue quiz', complete: false };
      }
      const best = quizBestScore(state, a.id);
      if (best === null) {
        return { text: 'Take the week quiz (pass mark 2 of 3)', href, cta: 'Start quiz', complete: false };
      }
      if (best < 2) {
        return { text: `Improve your quiz score (best ${best}/3)`, href, cta: 'Re-attempt quiz', complete: false };
      }
      return { text: `Quiz passed at ${best}/3`, href, cta: 'Review quiz', complete: false };
    }
    case 'assignment':
    case 'exam': {
      const sub = state.subs[a.id];
      const due = a.dueWeek ? dueSunday(programStart, a.dueWeek) : null;
      if (!sub || sub.status === 'draft') {
        return {
          text: `Submit ${a.assessment?.n ?? 'assessment'}${due ? ` by ${formatShortDateTime(due)}` : ''}`,
          href,
          cta: sub?.status === 'draft' ? 'Continue submission' : 'Add submission',
          complete: false,
        };
      }
      return {
        text: `View feedback for ${a.title}`,
        href: `${href}/grade`,
        cta: 'View submission',
        complete: false,
      };
    }
    default:
      return { text: a.title, href, cta: 'Open', complete: false };
  }
}