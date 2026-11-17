import type { Condition } from '../lib/completion';
import { Button, Chip, DoneTick } from './ui';

type Props = {
  conditions: Condition[];
  done: boolean;
  manual?: boolean;
  onMarkDone?: (done: boolean) => void;
};

export function CompletionBar({ conditions, done, manual = true, onMarkDone }: Props) {
  return (
    <div class="completion-bar" role="region" aria-label="Completion progress">
      <div class="completion-bar-inner">
        <div class="completion-chips">
          {conditions.map((c) => (
            <Chip key={c.id} tone={c.done ? 'success' : 'neutral'} icon={c.done ? <DoneTick /> : undefined}>
              {c.progress ?? c.label}
            </Chip>
          ))}
        </div>
        {manual && onMarkDone && (
          <>
            {done ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onMarkDone(false)}
                aria-pressed="true"
              >
                <DoneTick />
                Done
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => onMarkDone(true)}>
                Mark as done
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}