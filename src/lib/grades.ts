import { ASSESSMENTS, UNITS, getUnit } from '../data/curriculum';
import type { State } from '../state/types';
import { activitiesForWeek, labId, quizId } from './activities';
import { quizBestScore } from './completion';

export type GradeRow = {
  id: string;
  item: string;
  weight: number;
  grade: number | null;
  contribution: number | null;
};

export function unitGradebook(state: State, unitId: string): {
  rows: GradeRow[];
  total: number | null;
  gradedWeight: number;
  note: string;
} {
  const unit = getUnit(unitId);
  if (!unit) return { rows: [], total: null, gradedWeight: 0, note: '' };

  const rows: GradeRow[] = [];

  if (unit.labWeight > 0) {
    let labs = 0;
    let withEvidence = 0;
    for (let i = 0; i < unit.weeks.length; i++) {
      const gw = unit.start + i;
      const acts = activitiesForWeek(unit, i).filter((a) => a.kind === 'lab');
      if (acts.length === 0 && unit.weeks[i]?.labs.length) {
        labs++;
        if (state.subs[labId(unit.id, gw, 0)]?.status === 'submitted') withEvidence++;
      } else {
        for (const a of acts) {
          labs++;
          if (state.subs[a.id]?.status === 'submitted') withEvidence++;
        }
      }
    }
    const grade = labs === 0 ? null : (withEvidence / labs) * 100;
    rows.push({
      id: `${unitId}-labs`,
      item: 'Weekly labs',
      weight: unit.labWeight,
      grade,
      contribution: grade === null ? null : (grade / 100) * unit.labWeight,
    });
  }

  if (unit.quizWeight > 0) {
    const scores: number[] = [];
    for (let i = 0; i < unit.weeks.length; i++) {
      const gw = unit.start + i;
      const best = quizBestScore(state, quizId(unit.id, gw));
      if (best !== null) scores.push((best / 3) * 100);
    }
    const grade = scores.length === 0 ? null : scores.reduce((a, b) => a + b, 0) / scores.length;
    rows.push({
      id: `${unitId}-quizzes`,
      item: 'Weekly quizzes',
      weight: unit.quizWeight,
      grade,
      contribution: grade === null ? null : (grade / 100) * unit.quizWeight,
    });
  }

  for (const a of ASSESSMENTS.filter((x) => x.unit === unitId)) {
    const sub = state.subs[a.id];
    let grade: number | null = null;
    if (sub?.override != null) grade = sub.override;
    else if (sub?.grade != null) grade = sub.grade;
    rows.push({
      id: a.id,
      item: `${a.n}: ${a.title}`,
      weight: a.weight,
      grade,
      contribution: grade === null ? null : (grade / 100) * a.weight,
    });
  }

  const graded = rows.filter((r) => r.grade !== null);
  const gradedWeight = graded.reduce((s, r) => s + r.weight, 0);
  const contribSum = graded.reduce((s, r) => s + (r.contribution ?? 0), 0);
  const total = gradedWeight === 0 ? null : (contribSum / gradedWeight) * 100;
  const note =
    gradedWeight === 0
      ? 'No graded items yet.'
      : `Average so far across ${gradedWeight}% of the unit.`;

  return { rows, total, gradedWeight, note };
}

export function exportGradesCsv(state: State): string {
  const lines = ['Unit,Item,Weight,Grade,Contribution'];
  for (const unit of UNITS) {
    const { rows } = unitGradebook(state, unit.id);
    for (const r of rows) {
      lines.push(
        [
          unit.code,
          `"${r.item.replace(/"/g, '""')}"`,
          r.weight,
          r.grade == null ? '' : r.grade.toFixed(1),
          r.contribution == null ? '' : r.contribution.toFixed(2),
        ].join(','),
      );
    }
  }
  return lines.join('\n');
}

export function programProgress(state: State): number {
  let done = 0;
  let total = 0;
  for (const unit of UNITS) {
    for (let i = 0; i < unit.weeks.length; i++) {
      const acts = activitiesForWeek(unit, i);
      for (const a of acts) {
        total++;
        const marked = Boolean(state.done[a.id]) && !state.optOut[a.id];
        const sub = state.subs[a.id];
        const auto =
          (a.kind === 'quiz' && (quizBestScore(state, a.id) ?? 0) >= 2) ||
          ((a.kind === 'assignment' || a.kind === 'exam') && sub?.status === 'submitted') ||
          ((a.kind === 'lab' || a.kind === 'scenarios') && sub?.status === 'submitted') ||
          (a.kind === 'notes' && Boolean(state.done[a.id]));
        if (marked || auto) done++;
      }
    }
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function unitProgressPercent(state: State, unitId: string): number {
  const unit = getUnit(unitId);
  if (!unit) return 0;
  let done = 0;
  let total = 0;
  for (let i = 0; i < unit.weeks.length; i++) {
    for (const a of activitiesForWeek(unit, i)) {
      total++;
      const marked = Boolean(state.done[a.id]) && !state.optOut[a.id];
      const sub = state.subs[a.id];
      const auto =
        (a.kind === 'quiz' && (quizBestScore(state, a.id) ?? 0) >= 2) ||
        ((a.kind === 'assignment' || a.kind === 'exam') && sub?.status === 'submitted') ||
        ((a.kind === 'lab' || a.kind === 'scenarios') && sub?.status === 'submitted');
      if (marked || auto) done++;
    }
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
