import { useMemo, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { ASSESSMENTS, getUnit, UNITS } from '../data/curriculum';
import { activitiesForWeek, globalWeekForUnitWeek } from '../lib/activities';
import {
  FORGE_MILESTONES,
  forgeTaskDoneId,
  listAllForgeWeeks,
} from '../data/squadforge';
import {
  addDays,
  dueSunday,
  endOfMonth,
  formatDayHeading,
  formatLongDateTime,
  sameDay,
  startOfMonth,
} from '../lib/dates';
import { Chip, IconBtn } from '../components/ui';
import { ChevronLeft, ChevronRight, X } from 'lucide-preact';

type CalEvent = {
  id: string;
  title: string;
  date: Date;
  href: string;
  kind: 'major' | 'weekly' | 'forge';
  unitCode?: string;
  meta?: string;
};

function chipFor(kind: CalEvent['kind']): { tone: 'warning' | 'info' | 'neutral'; label: string } {
  if (kind === 'major') return { tone: 'warning', label: 'Assessment' };
  if (kind === 'forge') return { tone: 'info', label: 'SquadForge' };
  return { tone: 'neutral', label: 'Weekly' };
}

export function CalendarView() {
  const { state } = useStore();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);

  const events = useMemo(() => {
    const list: CalEvent[] = [];

    for (const a of ASSESSMENTS) {
      const unit = getUnit(a.unit);
      if (!unit) continue;
      list.push({
        id: a.id,
        title: `${a.n}: ${a.title}`,
        date: dueSunday(state.prefs.start, a.due),
        href: `#/course/${a.unit}/assessment/${a.id}`,
        kind: 'major',
        unitCode: unit.code,
      });
    }

    for (const m of FORGE_MILESTONES) {
      const unit = getUnit(m.unit);
      list.push({
        id: `forge-milestone-${m.id}`,
        title: `Milestone: ${m.title}`,
        date: new Date(m.by + 'T23:59:00'),
        href: '#/project',
        kind: 'forge',
        unitCode: unit?.code,
        meta: m.doneWhen,
      });
    }

    for (const unit of UNITS) {
      for (let i = 0; i < unit.weeks.length; i++) {
        const gw = globalWeekForUnitWeek(unit, i);
        const acts = activitiesForWeek(unit, i).filter(
          (x) => x.kind === 'lab' || x.kind === 'quiz' || x.kind === 'scenarios',
        );
        if (!acts.length) continue;
        const open = acts.filter((x) => {
          if (state.subs[x.id]?.status === 'submitted') return false;
          if (x.kind === 'quiz' && state.quiz[x.id]?.attempts.some((at) => (at.score ?? 0) >= 2)) {
            return false;
          }
          return true;
        }).length;
        list.push({
          id: `${unit.id}-w${gw}-weekly`,
          title: `Weekly tasks (${open} open)`,
          date: dueSunday(state.prefs.start, gw),
          href: `#/course/${unit.id}/week/${gw}`,
          kind: 'weekly',
          unitCode: unit.code,
        });
      }
    }

    for (const w of listAllForgeWeeks()) {
      const due = dueSunday(state.prefs.start, w.programWeek);
      const openTasks = w.plan.tasks.filter(
        (t) => !state.done[forgeTaskDoneId(w.unitId, w.weekIndex, t.id)],
      );
      const done = w.plan.tasks.length - openTasks.length;

      list.push({
        id: `forge-week-${w.unitId}-w${w.weekIndex}`,
        title: `SquadForge (${done}/${w.plan.tasks.length})`,
        date: due,
        href: w.href,
        kind: 'forge',
        unitCode: w.unitCode,
        meta: w.plan.summary,
      });

      for (const task of openTasks) {
        list.push({
          id: forgeTaskDoneId(w.unitId, w.weekIndex, task.id),
          title: task.title,
          date: due,
          href: w.href,
          kind: 'forge',
          unitCode: w.unitCode,
          meta: `${w.unitCode} · Week ${w.weekIndex}: ${w.weekTitle}`,
        });
      }
    }

    return list;
  }, [state]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = addDays(monthStart, -((monthStart.getDay() + 6) % 7));
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));

  const monthLabel = cursor.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

  /** Compact pills on the grid: assessments + weekly + one forge rollup per week (not every task). */
  const gridEvents = useMemo(
    () =>
      events.filter(
        (e) => e.kind === 'major' || e.kind === 'weekly' || e.id.startsWith('forge-week-'),
      ),
    [events],
  );

  const selectedEvents = selected
    ? events
        .filter((e) => sameDay(e.date, selected))
        .sort((a, b) => {
          const order = { major: 0, forge: 1, weekly: 2 } as const;
          const d = order[a.kind] - order[b.kind];
          if (d !== 0) return d;
          return a.title.localeCompare(b.title);
        })
    : [];

  return (
    <div class="page">
      <div class="cal-header">
        <h1 class="page-title" style={{ margin: 0 }}>
          Calendar
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconBtn label="Previous month" onClick={() => setCursor(startOfMonth(addDays(monthStart, -1)))}>
            <ChevronLeft size={18} strokeWidth={1.75} />
          </IconBtn>
          <strong>{monthLabel}</strong>
          <IconBtn label="Next month" onClick={() => setCursor(startOfMonth(addDays(monthEnd, 1)))}>
            <ChevronRight size={18} strokeWidth={1.75} />
          </IconBtn>
        </div>
      </div>

      <div class="cal-grid" role="grid" aria-label={monthLabel}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} class="cal-dow">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const dayEvents = gridEvents.filter((e) => sameDay(e.date, d));
          const shown = dayEvents.slice(0, 3);
          const more = dayEvents.length - shown.length;
          const today = sameDay(d, new Date());
          return (
            <button
              key={d.toISOString()}
              type="button"
              class={`cal-cell ${inMonth ? '' : 'muted'}`}
              onClick={() => setSelected(d)}
            >
              <span class={`cal-daynum ${today ? 'today' : ''}`}>{d.getDate()}</span>
              {shown.map((e) => (
                <span
                  key={e.id}
                  class={`cal-pill ${e.kind === 'forge' ? 'cal-pill-forge' : e.kind === 'major' ? 'cal-pill-major' : ''}`}
                  title={e.meta ? `${e.title} — ${e.meta}` : e.title}
                >
                  {e.unitCode ? `${e.unitCode} · ` : ''}
                  {e.kind === 'forge' ? e.title : e.kind === 'weekly' ? e.title : e.title}
                </span>
              ))}
              {more > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{more} more</span>}
            </button>
          );
        })}
      </div>

      {selected && (
        <div class="cal-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>{formatDayHeading(selected)}</h2>
            <IconBtn label="Close" onClick={() => setSelected(null)}>
              <X size={18} strokeWidth={1.75} />
            </IconBtn>
          </div>
          {selectedEvents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nothing due this day</p>
          ) : (
            selectedEvents.map((e) => {
              const chip = chipFor(e.kind);
              return (
                <a
                  key={e.id}
                  class="activity-row"
                  href={e.href}
                  style={{ paddingLeft: 0 }}
                  onClick={() => setSelected(null)}
                >
                  <div class="activity-body">
                    <p class="activity-name">{e.title}</p>
                    <p class="activity-meta">
                      {e.meta ? `${e.meta} · ` : e.unitCode ? `${e.unitCode} · ` : ''}
                      {formatLongDateTime(e.date)}
                    </p>
                  </div>
                  <Chip tone={chip.tone}>{chip.label}</Chip>
                </a>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
