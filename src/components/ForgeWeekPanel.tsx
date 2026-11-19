import { useStore } from '../state/store';
import { projectTasksForUnitWeek } from '../data/squadforge';
import { renderInlineCode } from '../data/content';
import { Chip, DoneTick } from './ui';

export function ForgeWeekPanel({
  unitId,
  weekIndex1Based,
}: {
  unitId: string;
  weekIndex1Based: number;
  compact?: boolean;
}) {
  const { state, markDone } = useStore();
  const refs = projectTasksForUnitWeek(unitId, weekIndex1Based);

  if (!refs.length) {
    return (
      <div class="forge-week-panel">
        <p class="forge-week-summary" style={{ color: 'var(--text-muted)' }}>
          No SquadForge project tasks pull this week yet as a primary concept link. Study the notes and books —
          later timeline phases will reuse these skills.
        </p>
        <p style={{ fontSize: 14 }}>
          <a href="#/project">Open project timeline →</a>
        </p>
      </div>
    );
  }

  const doneCount = refs.filter((r) => Boolean(state.done[r.doneId])).length;

  return (
    <div class="forge-week-panel">
      <div class="forge-week-panel-head">
        <p class="forge-week-summary">
          Project work that uses this week’s concepts (from the SquadForge timeline — not unit order).
        </p>
        <Chip tone={doneCount === refs.length ? 'success' : 'info'}>
          {doneCount}/{refs.length} linked tasks
        </Chip>
      </div>
      <p style={{ fontSize: 14, marginBottom: 12 }}>
        <a href="#/project">Open full project timeline →</a>
      </p>
      <ol class="forge-task-list">
        {refs.map((ref) => {
          const done = Boolean(state.done[ref.doneId]);
          const why =
            ref.task.links.find((l) => l.unitId === unitId && l.weekIndex === weekIndex1Based)?.concepts ??
            [];
          return (
            <li key={ref.task.id} class={`forge-task ${done ? 'done' : ''}`} id={`week-task-${ref.task.id}`}>
              <label class="forge-task-label">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => markDone(ref.doneId, !done)}
                />
                <span class="forge-task-title">
                  {ref.task.title}
                  {done ? <DoneTick /> : null}
                </span>
              </label>
              <div class="forge-week-meta">
                <Chip tone="neutral">{ref.phase.title}</Chip>
                {why.length > 0 && (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Uses: {why.join(' · ')}</span>
                )}
              </div>
              <ol class="forge-step-list">
                {ref.task.steps.map((step) => (
                  <li key={step} dangerouslySetInnerHTML={{ __html: renderInlineCode(step) }} />
                ))}
              </ol>
              <p style={{ fontSize: 13, marginBottom: 0 }}>
                <a href={`#/project?task=${encodeURIComponent(ref.task.id)}`}>Open on project timeline →</a>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
