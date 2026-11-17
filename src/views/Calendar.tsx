import { useMemo, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { ASSESSMENTS, getUnit } from '../data/curriculum';
import { activitiesForWeek, activityHref, globalWeekForUnitWeek } from '../lib/activities';
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
import { UNITS } from '../data/curriculum';

type CalEvent = {
  id: string;
  title: string;
  date: Date;
  href: string;
  kind: 'major' | 'weekly';
  unitCode?: string;
};

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
    for (const unit of UNITS) {
      for (let i = 0; i < unit.weeks.length; i++) {
        const gw = globalWeekForUnitWeek(unit, i);
        const acts = activitiesForWeek(unit, i).filter((x) => x.kind === 'lab' || x.kind === 'quiz' || x.kind === 'scenarios');
        if (!acts.length) continue;
        const open = acts.filter((x) => state.subs[x.id]?.status !== 'submitted' && !(x.kind === 'quiz' && (state.quiz[x.id]?.attempts.some((at) => (at.score ?? 0) >= 2)))).length;
        const due = dueSunday(state.prefs.start, gw);
        list.push({
          id: `${unit.id}-w${gw}-weekly`,
          title: `Weekly tasks (${open} open)`,
          date: due,
          href: `#/course/${unit.id}/week/${gw}`,
          kind: 'weekly',
          unitCode: unit.code,
        });
      }
    }
    return list;
  }, [state]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = addDays(monthStart, -((monthStart.getDay() + 6) % 7)); // Monday-first
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));

  const monthLabel = cursor.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
  const selectedEvents = selected
    ? events.filter((e) => sameDay(e.date, selected)).sort((a, b) => a.title.localeCompare(b.title))
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
          const dayEvents = events.filter((e) => sameDay(e.date, d));
          const shown = dayEvents.slice(0, 2);
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
                <span key={e.id} class="cal-pill" title={e.title}>
                  {e.kind === 'weekly' ? e.title : e.title}
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
            selectedEvents.map((e) => (
              <a key={e.id} class="activity-row" href={e.href} style={{ paddingLeft: 0 }} onClick={() => setSelected(null)}>
                <div class="activity-body">
                  <p class="activity-name">{e.title}</p>
                  <p class="activity-meta">
                    {e.unitCode} · {formatLongDateTime(e.date)}
                  </p>
                </div>
                <Chip tone={e.kind === 'major' ? 'warning' : 'neutral'}>{e.kind === 'major' ? 'Assessment' : 'Weekly'}</Chip>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}

void activityHref;
