import { useStore } from '../state/store';
import {
  forgeTaskDoneId,
  getForgeWeekPlan,
  type ForgeWeekPlan,
} from '../data/squadforge';
import { renderInlineCode } from '../data/content';
import { Chip, DoneTick } from './ui';

export function ForgeWeekPanel({
  unitId,
  weekIndex1Based,
  compact,
}: {
  unitId: string;
  weekIndex1Based: number;
  /** Tracker-style: titles + link only; full steps live on the week page */
  compact?: boolean;
}) {
  const { state, markDone } = useStore();
  const plan = getForgeWeekPlan(unitId, weekIndex1Based);
  if (!plan) return null;

  const doneCount = plan.tasks.filter((t) =>
    Boolean(state.done[forgeTaskDoneId(unitId, weekIndex1Based, t.id)]),
  ).length;

  return (
    <div class={`forge-week-panel ${compact ? 'compact' : ''}`}>
      <div class="forge-week-panel-head">
        <p class="forge-week-summary">{plan.summary}</p>
        <Chip tone={doneCount === plan.tasks.length ? 'success' : 'info'}>
          {doneCount}/{plan.tasks.length} tasks
        </Chip>
      </div>
      <p class="forge-week-outcome">
        <strong>Done when:</strong> {plan.outcome}
      </p>
      <ol class="forge-task-list">
        {plan.tasks.map((task, i) => {
          const id = forgeTaskDoneId(unitId, weekIndex1Based, task.id);
          const done = Boolean(state.done[id]);
          return (
            <li key={task.id} class={`forge-task ${done ? 'done' : ''}`}>
              <label class="forge-task-label">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => markDone(id, !done)}
                />
                <span class="forge-task-title">
                  {i + 1}. {task.title}
                  {done ? <DoneTick /> : null}
                </span>
              </label>
              {!compact && (
                <ol class="forge-step-list">
                  {task.steps.map((step) => (
                    <li
                      key={step}
                      dangerouslySetInnerHTML={{ __html: renderInlineCode(step) }}
                    />
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ForgeWeekPreview({ plan }: { plan: ForgeWeekPlan }) {
  return (
    <ul class="forge-task-titles">
      {plan.tasks.map((t, i) => (
        <li key={t.id}>
          {i + 1}. {t.title}
        </li>
      ))}
    </ul>
  );
}
