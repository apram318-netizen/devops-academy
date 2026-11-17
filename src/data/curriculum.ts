import type { Assessment, Unit } from './types';
import raw from './curriculum.json';

export const UNITS: Unit[] = raw.units as Unit[];
export const ASSESSMENTS: Assessment[] = raw.assessments as Assessment[];

export const UNIT_COLORS: Record<string, string> = {
  DEV101: '#2563EB',
  DEV102: '#0D9488',
  DEV103: '#7C3AED',
  DEV104: '#EA580C',
  DEV201: '#4F46E5',
  DEV202: '#9333EA',
  DEV203: '#DB2777',
  DEV204: '#CA8A04',
  DEV301: '#16A34A',
};

export function getUnit(id: string): Unit | undefined {
  return UNITS.find((u) => u.id === id);
}

export function getAssessment(id: string): Assessment | undefined {
  return ASSESSMENTS.find((a) => a.id === id);
}

export function assessmentsForUnit(unitId: string): Assessment[] {
  return ASSESSMENTS.filter((a) => a.unit === unitId);
}

export function assessmentsDueInWeek(weekN: number): Assessment[] {
  return ASSESSMENTS.filter((a) => a.due === weekN);
}

export function unitColor(code: string): string {
  return UNIT_COLORS[code] ?? '#2563EB';
}
