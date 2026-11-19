import { useMemo, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import {
  FORGE_MILESTONES,
  SQUADFORGE,
  forgeTaskDoneId,
  listForgeWeeksForUnit,
} from '../data/squadforge';
import { assessmentsForUnit, getUnit } from '../data/curriculum';
import { unitProgressPercent } from '../lib/grades';
import { isDone } from '../lib/completion';
import { Chip, ProgressRing } from '../components/ui';

function milestoneReached(by: string): boolean {
  const today = new Date();
  const due = new Date(by + 'T23:59:59');
  return today > due;
}

export function ProjectView() {
  const { state, markDone } = useStore();
  const start = state.prefs.start;
  const [openUnit, setOpenUnit] = useState<string | null>(FORGE_MILESTONES[0]?.unit ?? null);

  const totals = useMemo(() => {
    let tasks = 0;
    let done = 0;
    for (const m of FORGE_MILESTONES) {
      for (const w of listForgeWeeksForUnit(m.unit)) {
        for (const t of w.plan.tasks) {
          tasks++;
          if (state.done[forgeTaskDoneId(w.unitId, w.weekIndex, t.id)]) done++;
        }
      }
    }
    return { tasks, done };
  }, [state.done]);

  return (
    <div class="page reading">
      <h1 class="page-title">{SQUADFORGE.name}</h1>
      <p class="page-sub">{SQUADFORGE.tagline}</p>

      <div class="stats-row" style={{ marginBottom: 24 }}>
        <div class="stat">
          <div class="stat-value">
            {totals.done}/{totals.tasks}
          </div>
          <div class="stat-label">Forge tasks done</div>
        </div>
        <div class="stat">
          <div class="stat-value">{start}</div>
          <div class="stat-label">Program start</div>
        </div>
      </div>

      <section class="section">
        <h2 class="section-title">The problem</h2>
        <p>{SQUADFORGE.problem}</p>
      </section>

      <section class="section">
        <h2 class="section-title">What you are building</h2>
        <p>{SQUADFORGE.product}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          <strong>Stack:</strong> {SQUADFORGE.stack}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          <strong>Language:</strong> {SQUADFORGE.language}
        </p>
      </section>

      <section class="section">
        <h2 class="section-title">Build tracker</h2>
        <p class="page-sub" style={{ marginTop: 0 }}>
          Each row is one course week. Open it for the exact commands and files. Check off tasks as you finish them.
        </p>
        <div class="forge-milestones">
          {FORGE_MILESTONES.map((m) => {
            const unit = getUnit(m.unit);
            const past = milestoneReached(m.by);
            const pct = unit ? unitProgressPercent(state, unit.id) : 0;
            const assesses = assessmentsForUnit(m.unit);
            const assessDone = assesses.filter(
              (a) => isDone(state, a.id) || state.subs[a.id]?.status === 'submitted',
            ).length;
            const weeks = listForgeWeeksForUnit(m.unit);
            const weekTasks = weeks.flatMap((w) =>
              w.plan.tasks.map((t) => ({ w, t, id: forgeTaskDoneId(w.unitId, w.weekIndex, t.id) })),
            );
            const weekDone = weekTasks.filter((x) => state.done[x.id]).length;
            const expanded = openUnit === m.unit;

            return (
              <div class="forge-milestone" key={m.id}>
                <button
                  type="button"
                  class="forge-milestone-toggle"
                  onClick={() => setOpenUnit(expanded ? null : m.unit)}
                  aria-expanded={expanded}
                >
                  <div class="forge-milestone-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ProgressRing value={pct} total={100} size={44} />
                      <div style={{ textAlign: 'left' }}>
                        <strong>{m.title}</strong>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
                          {unit ? `${unit.code} · ${unit.name}` : m.unit}
                          {` · Forge tasks ${weekDone}/${weekTasks.length}`}
                          {assesses.length > 0 ? ` · assessments ${assessDone}/${assesses.length}` : ''}
                        </div>
                      </div>
                    </div>
                    <Chip tone={weekDone === weekTasks.length && weekTasks.length > 0 ? 'success' : past ? 'warning' : 'info'}>
                      {weekDone === weekTasks.length && weekTasks.length > 0 ? 'Complete' : m.by}
                    </Chip>
                  </div>
                </button>
                <p style={{ margin: '8px 0', fontSize: 14 }}>{m.doneWhen}</p>

                {expanded && (
                  <div class="forge-week-track">
                    {weeks.map((w) => {
                      const tDone = w.plan.tasks.filter((t) =>
                        state.done[forgeTaskDoneId(w.unitId, w.weekIndex, t.id)],
                      ).length;
                      return (
                        <div class="forge-week-row" key={`${w.unitId}-${w.weekIndex}`}>
                          <div class="forge-week-row-head">
                            <div>
                              <a href={w.href} class="forge-week-link">
                                {w.unitCode} · Week {w.weekIndex}: {w.weekTitle}
                              </a>
                              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{w.plan.summary}</div>
                            </div>
                            <Chip tone={tDone === w.plan.tasks.length ? 'success' : 'neutral'}>
                              {tDone}/{w.plan.tasks.length}
                            </Chip>
                          </div>
                          <ul class="forge-track-tasks">
                            {w.plan.tasks.map((task) => {
                              const id = forgeTaskDoneId(w.unitId, w.weekIndex, task.id);
                              const done = Boolean(state.done[id]);
                              return (
                                <li key={task.id}>
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={done}
                                      onChange={() => markDone(id, !done)}
                                    />
                                    <span>{task.title}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                          <a href={w.href} class="forge-open-week">
                            Open week for exact steps →
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">How to work each week</h2>
        <ol>
          <li>Pick the next unchecked task in this tracker</li>
          <li>Open the linked course week</li>
          <li>Follow the numbered SquadForge steps (commands and file paths)</li>
          <li>Check the task off here or on the week page; submit unit evidence as usual</li>
        </ol>
      </section>
    </div>
  );
}
