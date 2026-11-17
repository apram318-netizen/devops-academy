import { useMemo, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { UNITS, unitColor } from '../data/curriculum';
import { unitProgressPercent } from '../lib/grades';
import { currentProgramWeek } from '../lib/dates';
import { ProgressBar, OverflowMenu } from '../components/ui';
import { Star } from 'lucide-preact';

type Filter = 'all' | 'progress' | 'future' | 'past' | 'starred';

function Cover({ color }: { color: string }) {
  return (
    <div
      class="course-cover"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(255,255,255,.25) 0 18%, transparent 19%),
          radial-gradient(circle at 70% 60%, rgba(255,255,255,.2) 0 12%, transparent 13%),
          linear-gradient(135deg, ${color}, ${color}cc)
        `,
      }}
    />
  );
}

export function Courses() {
  const { state, patchUi } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const week = currentProgramWeek(state.prefs.start) || 1;

  const list = useMemo(() => {
    return UNITS.filter((u) => !state.ui.hidden.includes(u.id))
      .filter((u) => {
        if (filter === 'starred') return state.ui.starred.includes(u.id);
        if (filter === 'progress') return week >= u.start && week < u.start + u.weeks.length;
        if (filter === 'future') return week < u.start;
        if (filter === 'past') return week >= u.start + u.weeks.length;
        return true;
      })
      .filter((u) => {
        if (!q.trim()) return true;
        const s = `${u.code} ${u.name}`.toLowerCase();
        return s.includes(q.trim().toLowerCase());
      });
  }, [state, filter, q, week]);

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'progress', label: 'In progress' },
    { id: 'future', label: 'Future' },
    { id: 'past', label: 'Past' },
    { id: 'starred', label: 'Starred' },
  ];

  return (
    <div class="page">
      <h1 class="page-title">My courses</h1>
      <p class="page-sub">Two semesters and a capstone across nine units.</p>

      <div class="toolbar">
        <input
          class="search"
          placeholder="Search courses"
          value={q}
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
          aria-label="Search courses"
        />
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            class={`filter-chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div class="course-grid">
        {list.map((u) => {
          const pct = unitProgressPercent(state, u.id);
          const color = unitColor(u.code);
          const starred = state.ui.starred.includes(u.id);
          return (
            <div key={u.id} class="card course-card" style={{ borderLeft: `3px solid ${color}` }}>
              <a href={`#/course/${u.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <Cover color={color} />
                <div class="course-body">
                  <p class="course-label">{u.cat}</p>
                  <h2 class="course-name">
                    {u.code} {u.name}
                    {starred && <Star size={14} style={{ marginLeft: 6, color: 'var(--warning)' }} fill="currentColor" />}
                  </h2>
                  <div class="course-progress">
                    <ProgressBar value={pct} done={pct >= 100} />
                    <span class="course-pct">{pct}%</span>
                  </div>
                </div>
              </a>
              <div class="course-menu">
                <OverflowMenu
                  items={[
                    {
                      label: starred ? 'Unstar' : 'Star',
                      onClick: () =>
                        patchUi({
                          starred: starred
                            ? state.ui.starred.filter((id) => id !== u.id)
                            : [...state.ui.starred, u.id],
                        }),
                    },
                    {
                      label: 'Hide',
                      onClick: () => patchUi({ hidden: [...state.ui.hidden, u.id] }),
                    },
                  ]}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
