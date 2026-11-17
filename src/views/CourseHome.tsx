import { useMemo, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { getUnit, assessmentsForUnit } from '../data/curriculum';
import { activitiesForWeek, globalWeekForUnitWeek } from '../lib/activities';
import {
  currentProgramWeek,
  formatWeekRange,
  weekEnd,
  weekStart,
} from '../lib/dates';
import { activityComplete } from '../lib/completion';
import { unitGradebook, unitProgressPercent } from '../lib/grades';
import { defaultStepCount } from '../lib/nextStep';
import { Breadcrumb, Button, Chip, ProgressRing, RowChevron } from '../components/ui';
import { GuideView } from './Guide';
import { UnitGrades } from './Grades';

export function CourseHome({ unitId, tab = 'weeks' }: { unitId: string; tab?: 'weeks' | 'grades' | 'guide' }) {
  const { state, patchUi } = useStore();
  const unit = getUnit(unitId);
  const [localTab, setLocalTab] = useState(tab);
  const weekNow = currentProgramWeek(state.prefs.start) || 1;

  if (!unit) {
    return (
      <div class="page">
        <h1 class="page-title">Course not found</h1>
      </div>
    );
  }

  const pct = unitProgressPercent(state, unit.id);
  const welcomeKey = unit.id;
  const showWelcome = !state.ui.dismissedWelcome.includes(welcomeKey);

  const weeks = useMemo(() => {
    return unit.weeks.map((w, i) => {
      const gw = globalWeekForUnitWeek(unit, i);
      const acts = activitiesForWeek(unit, i);
      const stepCounts = Object.fromEntries(acts.map((a) => [a.id, defaultStepCount(a)]));
      const done = acts.filter((a) => activityComplete(state, a, stepCounts[a.id])).length;
      const dueAssess = assessmentsForUnit(unit.id).filter((a) => a.due === gw);
      return { w, i, gw, acts, done, total: acts.length, dueAssess };
    });
  }, [unit, state]);

  void unitGradebook;

  return (
    <div class="page">
      <Breadcrumb items={[{ label: 'My courses', href: '#/courses' }, { label: unit.code }]} />
      <div class="week-header">
        <div>
          <h1 class="page-title">
            {unit.code} {unit.name}
          </h1>
          <p class="page-sub">{unit.summary}</p>
        </div>
        <ProgressRing value={Math.round((pct / 100) * weeks.length)} total={weeks.length} size={44} />
      </div>

      {showWelcome && (
        <div class="card" style={{ marginBottom: 24, background: 'var(--accent-tint)', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Welcome to {unit.code}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Work week by week. Open a week for notes, labs and quizzes, then submit assessments when they are due.
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => patchUi({ dismissedWelcome: [...state.ui.dismissedWelcome, welcomeKey] })}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div class="tabs" role="tablist">
        {(
          [
            ['weeks', 'Weeks'],
            ['grades', 'Grades'],
            ['guide', 'Guide'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            class={localTab === id ? 'active' : ''}
            aria-selected={localTab === id}
            onClick={() => setLocalTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {localTab === 'grades' && <UnitGrades unitId={unit.id} embedded />}
      {localTab === 'guide' && <GuideView unitId={unit.id} embedded />}
      {localTab === 'weeks' && (
        <div>
          {weeks.map(({ w, gw, done, total, dueAssess }) => {
            const start = weekStart(state.prefs.start, gw);
            const end = weekEnd(state.prefs.start, gw);
            const current = gw === weekNow;
            const complete = total > 0 && done >= total;
            return (
              <a
                key={gw}
                class={`week-row ${current ? 'current' : ''} ${complete ? 'done-week' : ''}`}
                href={`#/course/${unit.id}/week/${gw}`}
              >
                <ProgressRing value={done} total={total || 1} />
                <div class="activity-body">
                  <p class="activity-name">
                    Week {gw - unit.start + 1}{' '}
                    <span style={{ fontWeight: 400 }}>{w.t}</span>
                  </p>
                  <p class="activity-meta">{formatWeekRange(start, end)}</p>
                </div>
                <div class="activity-chips">
                  {current && <Chip tone="info">This week</Chip>}
                  {dueAssess[0] && <Chip tone="warning">{dueAssess[0].n}</Chip>}
                  {!current && !dueAssess[0] && complete && <Chip tone="success">Done</Chip>}
                  {!current && !dueAssess[0] && !complete && gw === weekNow && null}
                </div>
                <RowChevron />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
