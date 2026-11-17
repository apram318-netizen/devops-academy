import type { Assessment, Unit, Week } from '../data/types';
import { ASSESSMENTS, UNITS } from '../data/curriculum';
import { labSteps } from '../data/content';
import { dueSunday } from './dates';

export type ActivityKind =
  | 'notes'
  | 'lab'
  | 'quiz'
  | 'assignment'
  | 'exam'
  | 'scenarios'
  | 'guide';

export type ActivityRef = {
  id: string;
  kind: ActivityKind;
  unitId: string;
  unitCode: string;
  week?: number;
  title: string;
  subtitle?: string;
  dueWeek?: number;
  assessment?: Assessment;
  labIndex?: number;
  scenarioCount?: number;
};

export function notesId(unitId: string, week: number): string {
  return `${unitId}-w${week}-notes`;
}

export function labId(unitId: string, week: number, labIndex = 0): string {
  return `${unitId}-w${week}-lab${labIndex}`;
}

export function quizId(unitId: string, week: number): string {
  return `${unitId}-w${week}-quiz`;
}

export function guideId(unitId: string): string {
  return `${unitId}-guide`;
}

export function globalWeekForUnitWeek(unit: Unit, weekIndex0: number): number {
  return unit.start + weekIndex0;
}

export function unitWeekIndex(unit: Unit, globalWeek: number): number | null {
  const idx = globalWeek - unit.start;
  if (idx < 0 || idx >= unit.weeks.length) return null;
  return idx;
}

export function isCapstoneScenarioWeek(unit: Unit, weekIndex0: number): boolean {
  return unit.id === 'dev301' && weekIndex0 >= 1 && weekIndex0 <= 3;
}

export function isExamWeek(unit: Unit, weekIndex0: number): boolean {
  const gw = globalWeekForUnitWeek(unit, weekIndex0);
  return ASSESSMENTS.some((a) => a.unit === unit.id && a.due === gw && a.exam);
}

export function weekTitle(week: Week): string {
  return week.t;
}

export function activitiesForWeek(unit: Unit, weekIndex0: number): ActivityRef[] {
  const week = unit.weeks[weekIndex0];
  if (!week) return [];
  const gw = globalWeekForUnitWeek(unit, weekIndex0);
  const assessments = ASSESSMENTS.filter((a) => a.unit === unit.id && a.due === gw);

  if (unit.id === 'dev301' && weekIndex0 === 0) {
    // Platform rebuild week: notes + lab + assessment
  }

  const items: ActivityRef[] = [];

  if (isCapstoneScenarioWeek(unit, weekIndex0)) {
    items.push({
      id: labId(unit.id, gw, 0),
      kind: 'scenarios',
      unitId: unit.id,
      unitCode: unit.code,
      week: gw,
      title: 'Failure scenarios',
      subtitle: `${week.labs.length} scenarios`,
      dueWeek: gw,
      scenarioCount: week.labs.length,
    });
    for (const a of assessments) {
      items.push(assessmentActivity(a, unit));
    }
    return items.slice(0, 5);
  }

  const isExam = assessments.some((a) => a.exam);
  if (isExam && weekIndex0 === unit.weeks.length - 1) {
    for (const a of assessments) {
      items.push(assessmentActivity(a, unit));
    }
    return items;
  }

  items.push({
    id: notesId(unit.id, gw),
    kind: 'notes',
    unitId: unit.id,
    unitCode: unit.code,
    week: gw,
    title: `Notes: ${week.t}`,
    subtitle: 'Notes',
    dueWeek: gw,
  });

  if (!isCapstoneScenarioWeek(unit, weekIndex0)) {
    week.labs.forEach((lab, i) => {
      if (unit.labWeight === 0 && unit.id === 'dev301' && weekIndex0 === 0) {
        items.push({
          id: labId(unit.id, gw, i),
          kind: 'lab',
          unitId: unit.id,
          unitCode: unit.code,
          week: gw,
          title: `Lab: ${lab}`,
          subtitle: 'Lab',
          dueWeek: gw,
          labIndex: i,
        });
      } else if (unit.labWeight > 0 || unit.id === 'dev301') {
        items.push({
          id: labId(unit.id, gw, i),
          kind: 'lab',
          unitId: unit.id,
          unitCode: unit.code,
          week: gw,
          title: lab.length > 72 ? `Lab: ${lab.slice(0, 69)}…` : `Lab: ${lab}`,
          subtitle: 'Lab · About 4 hours',
          dueWeek: gw,
          labIndex: i,
        });
      }
    });
  }

  if (unit.quizWeight > 0) {
    items.push({
      id: quizId(unit.id, gw),
      kind: 'quiz',
      unitId: unit.id,
      unitCode: unit.code,
      week: gw,
      title: `Week ${weekIndex0 + 1} quiz`,
      subtitle: 'Quiz · 3 questions',
      dueWeek: gw,
    });
  }

  for (const a of assessments) {
    items.push(assessmentActivity(a, unit));
  }

  // Cap activity list at 5; assessments already included
  if (items.length > 5) {
    const core = items.filter((i) => i.kind === 'notes' || i.kind === 'lab' || i.kind === 'quiz').slice(0, 3);
    const rest = items.filter((i) => i.kind === 'assignment' || i.kind === 'exam');
    return [...core, ...rest].slice(0, 5);
  }

  return items;
}

/** Persisted checkbox count for lab / scenario activities. */
export function stepCountForActivity(unit: Unit, weekIndex0: number, activity: ActivityRef): number {
  const week = unit.weeks[weekIndex0];
  if (!week) return 0;
  if (activity.kind === 'scenarios') {
    return week.labs.length * 7;
  }
  if (activity.kind === 'lab') {
    const labTitle = week.labs[activity.labIndex ?? 0] ?? week.labs[0] ?? '';
    const capstone = isCapstoneScenarioWeek(unit, weekIndex0);
    return labSteps(unit.id, weekIndex0 + 1, labTitle, capstone).length;
  }
  return 0;
}

function assessmentActivity(a: Assessment, unit: Unit): ActivityRef {
  return {
    id: a.id,
    kind: a.exam || a.cert ? 'exam' : 'assignment',
    unitId: unit.id,
    unitCode: unit.code,
    week: a.due,
    title: `${a.n}: ${a.title}`,
    subtitle: a.exam ? 'Exam' : 'Assignment',
    dueWeek: a.due,
    assessment: a,
  };
}

export function activityHref(a: ActivityRef): string {
  switch (a.kind) {
    case 'notes':
      return `#/course/${a.unitId}/week/${a.week}/notes`;
    case 'lab':
    case 'scenarios':
      return `#/course/${a.unitId}/week/${a.week}/lab/${a.labIndex ?? 0}`;
    case 'quiz':
      return `#/course/${a.unitId}/week/${a.week}/quiz`;
    case 'assignment':
    case 'exam':
      return `#/course/${a.unitId}/assessment/${a.id}`;
    case 'guide':
      return `#/course/${a.unitId}/guide`;
    default:
      return '#/';
  }
}

export function allUnits(): Unit[] {
  return UNITS;
}

export function unitsActiveInWeek(globalWeek: number): Unit[] {
  return UNITS.filter((u) => unitWeekIndex(u, globalWeek) !== null);
}

export function upcomingDeadlines(
  programStart: string,
  from: Date,
  days: number,
): { activity: ActivityRef; due: Date }[] {
  const end = new Date(from);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);

  const results: { activity: ActivityRef; due: Date }[] = [];
  const seen = new Set<string>();

  for (const unit of UNITS) {
    for (let i = 0; i < unit.weeks.length; i++) {
      const acts = activitiesForWeek(unit, i);
      for (const a of acts) {
        if (!a.dueWeek) continue;
        const key = `${a.id}:${a.dueWeek}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const d = dueSunday(programStart, a.dueWeek);
        const windowStart = new Date(from);
        windowStart.setDate(windowStart.getDate() - 14);
        if (d >= windowStart && d <= end) {
          results.push({ activity: a, due: d });
        }
      }
    }
  }

  results.sort((a, b) => a.due.getTime() - b.due.getTime());
  return results;
}
