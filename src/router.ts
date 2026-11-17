export type Route =
  | { name: 'dashboard' }
  | { name: 'courses' }
  | { name: 'course'; unit: string; tab?: 'weeks' | 'grades' | 'guide' }
  | { name: 'week'; unit: string; week: number }
  | { name: 'notes'; unit: string; week: number }
  | { name: 'lab'; unit: string; week: number; lab: number; edit?: boolean }
  | { name: 'quiz'; unit: string; week: number; mode?: 'info' | 'attempt' | 'review'; attempt?: number }
  | { name: 'assessment'; unit: string; id: string; mode?: 'view' | 'edit' | 'submit' | 'grade' }
  | { name: 'unitGrades'; unit: string }
  | { name: 'guide'; unit: string }
  | { name: 'grades' }
  | { name: 'calendar' }
  | { name: 'settings' }
  | { name: 'programWeek'; week: number }
  | { name: 'notFound' };

export function parseHash(hash = location.hash): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const path = raw.split('?')[0] || '/';
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return { name: 'dashboard' };
  if (parts[0] === 'courses') return { name: 'courses' };
  if (parts[0] === 'grades') return { name: 'grades' };
  if (parts[0] === 'calendar') return { name: 'calendar' };
  if (parts[0] === 'settings') return { name: 'settings' };

  if (parts[0] === 'week' && parts[1]) {
    return { name: 'programWeek', week: Number(parts[1]) };
  }

  if (parts[0] === 'course' && parts[1]) {
    const unit = parts[1];
    if (!parts[2]) return { name: 'course', unit };
    if (parts[2] === 'grades') return { name: 'unitGrades', unit };
    if (parts[2] === 'guide') return { name: 'guide', unit };
    if (parts[2] === 'assessment' && parts[3]) {
      const id = parts[3];
      const mode = parts[4] as 'edit' | 'submit' | 'grade' | undefined;
      return { name: 'assessment', unit, id, mode: mode ?? 'view' };
    }
    if (parts[2] === 'week' && parts[3]) {
      const week = Number(parts[3]);
      if (!parts[4]) return { name: 'week', unit, week };
      if (parts[4] === 'notes') return { name: 'notes', unit, week };
      if (parts[4] === 'lab' && parts[5] != null) {
        return { name: 'lab', unit, week, lab: Number(parts[5]), edit: parts[6] === 'edit' };
      }
      if (parts[4] === 'quiz') {
        if (parts[5] === 'attempt') return { name: 'quiz', unit, week, mode: 'attempt' };
        if (parts[5] === 'review' && parts[6] != null) {
          return { name: 'quiz', unit, week, mode: 'review', attempt: Number(parts[6]) };
        }
        return { name: 'quiz', unit, week, mode: 'info' };
      }
    }
  }

  return { name: 'notFound' };
}

export function useHashRoute(onChange: (r: Route) => void): void {
  const handler = () => onChange(parseHash());
  window.addEventListener('hashchange', handler);
  onChange(parseHash());
}

export function navigate(to: string): void {
  if (!to.startsWith('#')) to = `#${to}`;
  if (location.hash === to) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = to;
  }
}
