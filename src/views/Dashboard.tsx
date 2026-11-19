import { useMemo } from 'preact/hooks';
import { useStore } from '../state/store';
import { UNITS } from '../data/curriculum';
import {
  activitiesForWeek,
  activityHref,
  unitWeekIndex,
  upcomingDeadlines,
} from '../lib/activities';
import {
  currentProgramWeek,
  daysUntilStart,
  firstName,
  formatDayHeading,
  formatWeekRange,
  greeting,
  relativeDue,
  weekEnd,
  weekStart,
} from '../lib/dates';
import { activityComplete, isDone } from '../lib/completion';
import { programProgress } from '../lib/grades';
import { computeNextStep, defaultStepCount } from '../lib/nextStep';
import { Chip, ProgressRing, RowChevron } from '../components/ui';
import { BookOpen, CircleHelp, FileCheck2, FlaskConical, Award, Siren } from 'lucide-preact';

function kindIcon(kind: string) {
  const props = { size: 16, strokeWidth: 1.75 as const };
  switch (kind) {
    case 'notes':
      return <BookOpen {...props} />;
    case 'lab':
      return <FlaskConical {...props} />;
    case 'quiz':
      return <CircleHelp {...props} />;
    case 'exam':
      return <Award {...props} />;
    case 'scenarios':
      return <Siren {...props} />;
    default:
      return <FileCheck2 {...props} />;
  }
}

export function Dashboard() {
  const { state } = useStore();
  const now = new Date();
  const week = currentProgramWeek(state.prefs.start, now);
  const started = week > 0;
  const progress = programProgress(state);

  const thisWeekUnits = useMemo(() => {
    const w = started ? week : 1;
    return UNITS.filter((u) => unitWeekIndex(u, w) !== null).map((u) => {
      const idx = unitWeekIndex(u, w)!;
      const acts = activitiesForWeek(u, idx);
      const stepCounts = Object.fromEntries(acts.map((a) => [a.id, defaultStepCount(a)]));
      const done = acts.filter((a) => activityComplete(state, a, stepCounts[a.id])).length;
      const next = computeNextStep(state, acts, stepCounts);
      return { unit: u, idx, week: u.weeks[idx]!, acts, done, total: acts.length, next, gw: w };
    });
  }, [state, week, started]);

  const upcoming = useMemo(() => {
    const items = upcomingDeadlines(state.prefs.start, now, 7)
      .filter(({ activity }) => !isDone(state, activity.id) && state.subs[activity.id]?.status !== 'submitted')
      .sort((a, b) => {
        const ao = a.due.getTime() < now.getTime() ? 0 : 1;
        const bo = b.due.getTime() < now.getTime() ? 0 : 1;
        if (ao !== bo) return ao - bo;
        return a.due.getTime() - b.due.getTime();
      })
      .slice(0, 8);
    return items;
  }, [state, now]);

  const dueCount = upcoming.filter((u) => u.due.getTime() >= now.getTime()).length;
  const overdueCount = upcoming.filter((u) => u.due.getTime() < now.getTime()).length;

  const grouped = upcoming.reduce<Record<string, typeof upcoming>>((acc, item) => {
    const key = formatDayHeading(item.due);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div class="page">
      <div class="dash-header">
        <h1 class="page-title" style={{ margin: 0 }}>
          {greeting(now)}, {firstName(state.prefs.name)}
        </h1>
        <div class="dash-week">
          {started ? (
            <>
              Week {week} of 30 · <a href={`#/week/${week}`}>View week</a>
            </>
          ) : (
            <>Starts in {daysUntilStart(state.prefs.start, now)} days</>
          )}
        </div>
      </div>

      <div class="stats-row">
        <div class="stat">
          <div class="stat-value">{progress}%</div>
          <div class="stat-label">Program progress</div>
        </div>
        <div class="stat">
          <div class="stat-value">{dueCount}</div>
          <div class="stat-label">Due in 7 days</div>
        </div>
        <div class="stat">
          <div class="stat-value">{overdueCount}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>

      <section class="section">
        <a class="card card-link" href="#/project" style={{ display: 'block', padding: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Spine project</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>SquadForge</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            Real-world project timeline — phases link to any subject week you need
          </div>
        </a>
      </section>

      <section class="section">
        <h2 class="section-title">This week</h2>
        <div class="unit-week-cards">
          {thisWeekUnits.map(({ unit, week: w, done, total, next, gw }) => (
            <a key={unit.id} class="card card-link" href={`#/course/${unit.id}/week/${gw}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ProgressRing value={done} total={total} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unit.code}</div>
                <div style={{ fontWeight: 600 }}>{w.t}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {next.complete ? 'Week complete' : `Next: ${next.text}`}
                </div>
              </div>
              <RowChevron />
            </a>
          ))}
        </div>
      </section>

      <section class="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 class="section-title">Upcoming</h2>
          <a href="#/calendar">View calendar</a>
        </div>
        {upcoming.length === 0 ? (
          <div class="card" style={{ color: 'var(--text-muted)' }}>
            Nothing due this week
          </div>
        ) : (
          <div class="card upcoming-list">
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day}>
                <div class="upcoming-day">{day}</div>
                {items.map(({ activity, due }) => {
                  const rel = relativeDue(due, now);
                  return (
                    <a key={activity.id} class="activity-row" href={activityHref(activity)} style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{kindIcon(activity.kind)}</span>
                      <div class="activity-body">
                        <p class="activity-name">{activity.title}</p>
                        <p class="activity-meta">{activity.unitCode}</p>
                      </div>
                      <div class="activity-chips">
                        <Chip tone={rel.tone === 'danger' ? 'danger' : rel.tone === 'warning' ? 'warning' : 'neutral'}>
                          {rel.tone === 'danger' ? 'Overdue' : rel.text.includes('Due in') ? rel.text.replace('Due in ', 'Due ') : 'Due Sun'}
                        </Chip>
                      </div>
                    </a>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

void formatWeekRange;
void weekStart;
void weekEnd;
