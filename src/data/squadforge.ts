/** SquadForge — on-demand game-server SaaS spine for the curriculum. */

import { FORGE_WEEK_PLANS } from './forgeWeeks';
import { getUnit } from './curriculum';

export type ForgeMilestone = {
  id: string;
  title: string;
  by: string; // ISO date Sunday deadline
  unit: string;
  doneWhen: string;
};

export type ForgeTask = {
  id: string;
  title: string;
  steps: string[];
};

export type ForgeWeekPlan = {
  summary: string;
  outcome: string;
  tasks: ForgeTask[];
};

export type ForgeWeekRef = {
  unitId: string;
  unitCode: string;
  unitName: string;
  weekIndex: number; // 1-based within unit
  programWeek: number; // hash route week number
  weekTitle: string;
  href: string;
  plan: ForgeWeekPlan;
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

export const FORGE_MILESTONES: ForgeMilestone[] = [
  {
    id: 'm-host',
    title: 'Host bootstrap + health agent',
    by: '2026-12-13',
    unit: 'dev101',
    doneWhen: 'Linux node can run Forge helpers; health script ready for game-host monitoring',
  },
  {
    id: 'm-net',
    title: 'Join path + TLS edge design',
    by: '2027-01-03',
    unit: 'dev102',
    doneWhen: 'Network design for tenant servers + local TLS reverse proxy in front of control API',
  },
  {
    id: 'm-compose',
    title: 'Compose MVP (start/stop one game)',
    by: '2027-01-24',
    unit: 'dev103',
    doneWhen: 'docker compose up runs API, orchestrator, Postgres, Redis, and one game image; forgectl start/stop works',
  },
  {
    id: 'm-aws',
    title: 'AWS foundation for Forge',
    by: '2027-02-14',
    unit: 'dev104',
    doneWhen: 'VPC/IAM/ECR/S3/RDS plan applied or staged; cost alarms on',
  },
  {
    id: 'm-k8s',
    title: 'Game servers on kind → EKS path',
    by: '2027-03-07',
    unit: 'dev201',
    doneWhen: 'Forge deploys on kind; tenant server pods get join endpoints; EKS path documented',
  },
  {
    id: 'm-tf',
    title: 'Platform as code',
    by: '2027-03-28',
    unit: 'dev202',
    doneWhen: 'Terraform brings up VPC+EKS skeleton; workspaces for dev/staging/prod',
  },
  {
    id: 'm-gitops',
    title: 'CI + GitOps delivery',
    by: '2027-04-18',
    unit: 'dev203',
    doneWhen: 'Merge builds/scans/pushes images; Argo CD syncs Forge; canary for control plane',
  },
  {
    id: 'm-sre',
    title: 'SLOs, billing hooks, game day',
    by: '2027-05-09',
    unit: 'dev204',
    doneWhen: 'Dashboards+alerts; metering/quotas; game-day report on Forge',
  },
  {
    id: 'm-capstone',
    title: 'Industry-complete portfolio',
    by: '2027-06-20',
    unit: 'dev301',
    doneWhen: 'One-command bootstrap, failure portfolio, demo: start → join → idle stop → invoice',
  },
];

export function forgeTaskDoneId(unitId: string, weekIndex1Based: number, taskId: string): string {
  return `forge:${unitId}:w${weekIndex1Based}:${taskId}`;
}

export function getForgeWeekPlan(unitId: string, weekIndex1Based: number): ForgeWeekPlan | null {
  const list = FORGE_WEEK_PLANS[unitId];
  if (!list?.length) return null;
  const idx = Math.max(1, weekIndex1Based) - 1;
  return list[Math.min(idx, list.length - 1)] ?? null;
}

/** @deprecated Prefer getForgeWeekPlan — kept for any residual string callers */
export function squadForgeApply(unitId: string, weekIndex1Based: number): string {
  const plan = getForgeWeekPlan(unitId, weekIndex1Based);
  return plan?.summary ?? 'Advance SquadForge with a concrete change in the monorepo this week (PR + evidence).';
}

export function listForgeWeeksForUnit(unitId: string): ForgeWeekRef[] {
  const unit = getUnit(unitId);
  const plans = FORGE_WEEK_PLANS[unitId];
  if (!unit || !plans) return [];
  return plans.map((plan, i) => {
    const weekIndex = i + 1;
    const programWeek = unit.start + i;
    return {
      unitId,
      unitCode: unit.code,
      unitName: unit.name,
      weekIndex,
      programWeek,
      weekTitle: unit.weeks[i]?.t ?? `Week ${weekIndex}`,
      href: `#/course/${unitId}/week/${programWeek}`,
      plan,
    };
  });
}

export function listAllForgeWeeks(): ForgeWeekRef[] {
  return FORGE_MILESTONES.flatMap((m) => listForgeWeeksForUnit(m.unit));
}
