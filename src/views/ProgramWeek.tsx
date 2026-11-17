import { useStore } from '../state/store';
import { UNITS } from '../data/curriculum';
import { activitiesForWeek, unitWeekIndex } from '../lib/activities';
import { formatWeekRange, weekEnd, weekStart } from '../lib/dates';
import { activityComplete } from '../lib/completion';
import { computeNextStep, defaultStepCount } from '../lib/nextStep';
import { Breadcrumb, ProgressRing, RowChevron } from '../components/ui';

export function ProgramWeek({ week }: { week: number }) {
  const { state } = useStore();
  const start = weekStart(state.prefs.start, week);
  const end = weekEnd(state.prefs.start, week);
  const units = UNITS.filter((u) => unitWeekIndex(u, week) !== null);

  return (
    <div class="page">
      <Breadcrumb items={[{ label: 'Dashboard', href: '#/' }, { label: `Week ${week}` }]} />
      <h1 class="page-title">Program week {week}</h1>
      <p class="page-sub">{formatWeekRange(start, end)}</p>

      <div class="program-week-grid">
        {units.map((unit) => {
          const idx = unitWeekIndex(unit, week)!;
          const w = unit.weeks[idx]!;
          const acts = activitiesForWeek(unit, idx);
          const stepCounts = Object.fromEntries(acts.map((a) => [a.id, defaultStepCount(a)]));
          const done = acts.filter((a) => activityComplete(state, a, stepCounts[a.id])).length;
          const next = computeNextStep(state, acts, stepCounts);
          return (
            <a key={unit.id} class="card card-link" href={`#/course/${unit.id}/week/${week}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{unit.code}</div>
                  <div style={{ fontWeight: 600 }}>{w.t}</div>
                </div>
                <ProgressRing value={done} total={acts.length || 1} />
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{next.complete ? 'Week complete' : next.text}</span>
                <RowChevron />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
