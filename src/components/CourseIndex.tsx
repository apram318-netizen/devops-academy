import { useMemo } from 'preact/hooks';
import { useStore } from '../state/store';
import { getUnit, getAssessment, assessmentsForUnit } from '../data/curriculum';
import { activitiesForWeek, globalWeekForUnitWeek } from '../lib/activities';
import { activityComplete } from '../lib/completion';
import { defaultStepCount } from '../lib/nextStep';
import { currentProgramWeek } from '../lib/dates';
import { ProgressRing } from './ui';
import { ArrowLeft, BookOpen, ClipboardList, FileText, LayoutList } from 'lucide-preact';
import type { Route } from '../router';

export function courseUnitFromRoute(route: Route): string | null {
  switch (route.name) {
    case 'course':
    case 'week':
    case 'notes':
    case 'lab':
    case 'quiz':
    case 'assessment':
    case 'unitGrades':
    case 'guide':
      return route.unit;
    default:
      return null;
  }
}

export function activeWeekFromRoute(route: Route): number | null {
  if (route.name === 'week' || route.name === 'notes' || route.name === 'lab' || route.name === 'quiz') {
    return route.week;
  }
  if (route.name === 'assessment') {
    return getAssessment(route.id)?.due ?? null;
  }
  return null;
}

export function CourseIndex({
  unitId,
  route,
  onNavigate,
  showBack = false,
}: {
  unitId: string;
  route: Route;
  onNavigate?: () => void;
  showBack?: boolean;
}) {
  const { state } = useStore();
  const unit = getUnit(unitId);
  const weekNow = currentProgramWeek(state.prefs.start) || 1;
  const activeWeek = activeWeekFromRoute(route);

  const weeks = useMemo(() => {
    if (!unit) return [];
    return unit.weeks.map((w, i) => {
      const gw = globalWeekForUnitWeek(unit, i);
      const acts = activitiesForWeek(unit, i);
      const stepCounts = Object.fromEntries(acts.map((a) => [a.id, defaultStepCount(a)]));
      const done = acts.filter((a) => activityComplete(state, a, stepCounts[a.id])).length;
      return { w, i, gw, done, total: acts.length };
    });
  }, [unit, state]);

  if (!unit) return null;

  const tab =
    route.name === 'unitGrades' || (route.name === 'course' && route.tab === 'grades')
      ? 'grades'
      : route.name === 'guide' || (route.name === 'course' && route.tab === 'guide')
        ? 'guide'
        : 'weeks';

  return (
    <div class="course-index">
      {showBack && (
        <a class="course-index-back" href="#/courses" onClick={onNavigate}>
          <ArrowLeft size={16} strokeWidth={1.75} />
          My courses
        </a>
      )}

      <div class="course-index-head">
        <div class="course-index-label">Course</div>
        <a class="course-index-title" href={`#/course/${unit.id}`} onClick={onNavigate}>
          {unit.code} {unit.name}
        </a>
      </div>

      <nav class="course-index-nav" aria-label="Course sections">
        <a
          href={`#/course/${unit.id}`}
          class={`course-index-link ${tab === 'weeks' && route.name === 'course' ? 'active' : ''}`}
          onClick={onNavigate}
        >
          <LayoutList size={16} strokeWidth={1.75} />
          Course home
        </a>
        <a
          href={`#/course/${unit.id}/grades`}
          class={`course-index-link ${tab === 'grades' ? 'active' : ''}`}
          onClick={onNavigate}
        >
          <ClipboardList size={16} strokeWidth={1.75} />
          Grades
        </a>
        <a
          href={`#/course/${unit.id}/guide`}
          class={`course-index-link ${tab === 'guide' ? 'active' : ''}`}
          onClick={onNavigate}
        >
          <BookOpen size={16} strokeWidth={1.75} />
          Unit guide
        </a>
      </nav>

      <div class="course-index-section">Weeks</div>
      <div class="course-index-weeks">
        {weeks.map(({ w, i, gw, done, total }) => {
          const current = gw === weekNow;
          const active = activeWeek === gw;
          return (
            <a
              key={gw}
              href={`#/course/${unit.id}/week/${gw}`}
              class={`course-index-week ${active ? 'active' : ''} ${current ? 'current' : ''}`}
              onClick={onNavigate}
            >
              <ProgressRing value={done} total={total || 1} size={28} />
              <span class="course-index-week-text">
                <span class="course-index-week-num">Week {i + 1}</span>
                <span class="course-index-week-title">{w.t}</span>
              </span>
            </a>
          );
        })}
      </div>

      {assessmentsForUnit(unit.id).length > 0 && (
        <>
          <div class="course-index-section">Assessments</div>
          <div class="course-index-weeks">
            {assessmentsForUnit(unit.id).map((a) => (
              <a
                key={a.id}
                href={`#/course/${unit.id}/assessment/${a.id}`}
                class={`course-index-week ${route.name === 'assessment' && route.id === a.id ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <span class="course-index-assess-icon">
                  <FileText size={16} strokeWidth={1.75} />
                </span>
                <span class="course-index-week-text">
                  <span class="course-index-week-num">{a.n}</span>
                  <span class="course-index-week-title">{a.title}</span>
                </span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
