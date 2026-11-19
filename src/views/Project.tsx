import { useEffect, useMemo, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import {
  SQUADFORGE,
  listProjectPhases,
  phaseProgress,
  projectTaskDoneId,
  resolveConceptLink,
} from '../data/squadforge';
import { Chip, ProgressRing } from '../components/ui';
import { renderInlineCode } from '../data/content';

function pastDue(by: string): boolean {
  return new Date() > new Date(by + 'T23:59:59');
}

export function ProjectView({
  focusTask,
  focusPhase,
}: {
  focusTask?: string;
  focusPhase?: string;
}) {
  const { state, markDone } = useStore();
  const phases = listProjectPhases();
  const [openPhase, setOpenPhase] = useState<string | null>(focusPhase ?? phases[0]?.id ?? null);
  const [openTask, setOpenTask] = useState<string | null>(focusTask ?? null);

  useEffect(() => {
    if (focusPhase) setOpenPhase(focusPhase);
    if (focusTask) {
      setOpenTask(focusTask);
      for (const p of phases) {
        if (p.tasks.some((t) => t.id === focusTask)) {
          setOpenPhase(p.id);
          break;
        }
      }
      requestAnimationFrame(() => {
        document.getElementById(`task-${focusTask}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [focusTask, focusPhase, phases]);

  const totals = useMemo(() => {
    let tasks = 0;
    let done = 0;
    for (const p of phases) {
      const prog = phaseProgress(p, state.done);
      tasks += prog.total;
      done += prog.done;
    }
    return { tasks, done };
  }, [phases, state.done]);

  return (
    <div class="page reading">
      <h1 class="page-title">{SQUADFORGE.name}</h1>
      <p class="page-sub">{SQUADFORGE.tagline}</p>

      <div class="stats-row" style={{ marginBottom: 24 }}>
        <div class="stat">
          <div class="stat-value">
            {totals.done}/{totals.tasks}
          </div>
          <div class="stat-label">Project tasks done</div>
        </div>
        <div class="stat">
          <div class="stat-value">{phases.length}</div>
          <div class="stat-label">Phases</div>
        </div>
        <div class="stat">
          <div class="stat-value">{state.prefs.start}</div>
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
        <h2 class="section-title">Project timeline</h2>
        <p class="page-sub" style={{ marginTop: 0 }}>
          Real shipping order — not subject order. Each task links to the subject weeks that teach the concepts you need (often several units at once).
        </p>
        <div class="forge-milestones">
          {phases.map((phase) => {
            const prog = phaseProgress(phase, state.done);
            const expanded = openPhase === phase.id;
            const complete = prog.total > 0 && prog.done === prog.total;
            const overdue = !complete && pastDue(phase.by);
            return (
              <div class="forge-milestone" key={phase.id} id={`phase-${phase.id}`}>
                <button
                  type="button"
                  class="forge-milestone-toggle"
                  onClick={() => setOpenPhase(expanded ? null : phase.id)}
                  aria-expanded={expanded}
                >
                  <div class="forge-milestone-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ProgressRing value={prog.done} total={prog.total || 1} size={44} />
                      <div style={{ textAlign: 'left' }}>
                        <strong>{phase.title}</strong>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>
                          {prog.done}/{prog.total} tasks
                        </div>
                      </div>
                    </div>
                    <Chip tone={complete ? 'success' : overdue ? 'warning' : 'info'}>
                      {complete ? 'Complete' : phase.by}
                    </Chip>
                  </div>
                </button>
                <p style={{ margin: '8px 0', fontSize: 14 }}>{phase.goal}</p>

                {expanded && (
                  <div class="forge-week-track">
                    {phase.tasks.map((task) => {
                      const doneId = projectTaskDoneId(task.id);
                      const done = Boolean(state.done[doneId]);
                      const showSteps = openTask === task.id;
                      return (
                        <div
                          class={`forge-week-row ${done ? 'forge-task-done-row' : ''}`}
                          key={task.id}
                          id={`task-${task.id}`}
                        >
                          <div class="forge-week-row-head">
                            <label class="forge-task-label" style={{ flex: 1 }}>
                              <input
                                type="checkbox"
                                checked={done}
                                onChange={() => markDone(doneId, !done)}
                              />
                              <span class="forge-task-title">{task.title}</span>
                            </label>
                            <button
                              type="button"
                              class="btn btn-ghost"
                              style={{ fontSize: 13 }}
                              onClick={() => setOpenTask(showSteps ? null : task.id)}
                            >
                              {showSteps ? 'Hide steps' : 'Show steps'}
                            </button>
                          </div>

                          <div class="forge-learn-links">
                            <span class="forge-learn-label">Learn:</span>
                            {task.links.map((link) => {
                              const r = resolveConceptLink(link);
                              if (!r) return null;
                              return (
                                <a key={`${r.unitId}-${r.weekIndex}-${r.concepts[0]}`} class="forge-learn-chip" href={r.href}>
                                  {r.unitCode} · W{r.weekIndex} {r.weekTitle}
                                  <span class="forge-learn-why">{r.concepts.join(' · ')}</span>
                                </a>
                              );
                            })}
                          </div>

                          {showSteps && (
                            <ol class="forge-step-list">
                              {task.steps.map((step) => (
                                <li key={step} dangerouslySetInnerHTML={{ __html: renderInlineCode(step) }} />
                              ))}
                            </ol>
                          )}
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
        <h2 class="section-title">How to work</h2>
        <ol>
          <li>Open the next incomplete phase on this timeline</li>
          <li>Use <strong>Learn</strong> links to pull concepts from any subject week (order does not have to match units)</li>
          <li>Follow the exact steps on the task; check it off when done</li>
          <li>Submit unit assessments as usual — they map to the same product milestones</li>
        </ol>
      </section>
    </div>
  );
}
