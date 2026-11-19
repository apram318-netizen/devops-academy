/** SquadForge — on-demand game-server SaaS spine (project timeline). */

import { FORGE_PHASES } from './forgeTimeline';
import { getUnit } from './curriculum';

export type ConceptLink = {
  unitId: string;
  weekIndex: number; // 1-based within unit
  concepts: string[];
};

export type ProjectTask = {
  id: string;
  title: string;
  steps: string[];
  links: ConceptLink[];
};

export type ProjectPhase = {
  id: string;
  title: string;
  goal: string;
  by: string; // ISO date
  tasks: ProjectTask[];
};

/** @deprecated Unit-linear week plan shape — kept for forgeWeeks.ts typing only */
export type ForgeTask = {
  id: string;
  title: string;
  steps: string[];
};

/** @deprecated */
export type ForgeWeekPlan = {
  summary: string;
  outcome: string;
  tasks: ForgeTask[];
};

export type ResolvedConceptLink = ConceptLink & {
  unitCode: string;
  weekTitle: string;
  href: string;
  programWeek: number;
};

export type ProjectTaskRef = {
  phase: ProjectPhase;
  task: ProjectTask;
  doneId: string;
  href: string;
  resolvedLinks: ResolvedConceptLink[];
};

export const SQUADFORGE = {
  name: 'SquadForge',
  tagline: 'Friends click start. You run the platform that spins up the game server.',
  problem:
    'Clans either burn money on always-on VPS boxes or host from home. Neither is reliable, isolated, or observable.',
  product:
    'A multi-tenant game-server SaaS: clans request a server, Forge launches an isolated dedicated-server container, returns join info, health-checks it, shuts it down when empty, and meters hours for billing.',
  stack:
    'Go API + orchestrator + forgectl · Postgres · Redis/SQS · object storage for worlds · Compose → kind → EKS · Terraform · GitOps · SRE',
  language: 'Go (control plane). Shell for host labs. Game binary = upstream dedicated-server image.',
};

export function listProjectPhases(): ProjectPhase[] {
  return FORGE_PHASES;
}

export function projectTaskDoneId(taskId: string): string {
  return `forge:task:${taskId}`;
}

export function conceptWeekHref(unitId: string, weekIndex1Based: number): string {
  const unit = getUnit(unitId);
  if (!unit) return '#/courses';
  const programWeek = unit.start + weekIndex1Based - 1;
  return `#/course/${unitId}/week/${programWeek}`;
}

export function resolveConceptLink(link: ConceptLink): ResolvedConceptLink | null {
  const unit = getUnit(link.unitId);
  if (!unit) return null;
  const week = unit.weeks[link.weekIndex - 1];
  if (!week) return null;
  const programWeek = unit.start + link.weekIndex - 1;
  return {
    ...link,
    unitCode: unit.code,
    weekTitle: week.t,
    programWeek,
    href: `#/course/${link.unitId}/week/${programWeek}`,
  };
}

export function getProjectTask(taskId: string): ProjectTaskRef | null {
  for (const phase of FORGE_PHASES) {
    const task = phase.tasks.find((t) => t.id === taskId);
    if (!task) continue;
    return {
      phase,
      task,
      doneId: projectTaskDoneId(task.id),
      href: `#/project?task=${encodeURIComponent(task.id)}`,
      resolvedLinks: task.links.map(resolveConceptLink).filter((x): x is ResolvedConceptLink => Boolean(x)),
    };
  }
  return null;
}

export function listAllProjectTasks(): ProjectTaskRef[] {
  return FORGE_PHASES.flatMap((phase) =>
    phase.tasks.map((task) => ({
      phase,
      task,
      doneId: projectTaskDoneId(task.id),
      href: `#/project?task=${encodeURIComponent(task.id)}`,
      resolvedLinks: task.links.map(resolveConceptLink).filter((x): x is ResolvedConceptLink => Boolean(x)),
    })),
  );
}

/** Project tasks that pull concepts from this subject week (reverse index). */
export function projectTasksForUnitWeek(unitId: string, weekIndex1Based: number): ProjectTaskRef[] {
  return listAllProjectTasks().filter((ref) =>
    ref.task.links.some((l) => l.unitId === unitId && l.weekIndex === weekIndex1Based),
  );
}

export function phaseProgress(
  phase: ProjectPhase,
  doneMap: Record<string, number | boolean | undefined>,
): { done: number; total: number } {
  const total = phase.tasks.length;
  const done = phase.tasks.filter((t) => Boolean(doneMap[projectTaskDoneId(t.id)])).length;
  return { done, total };
}
