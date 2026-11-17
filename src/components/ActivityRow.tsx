import {
  Award,
  BookOpen,
  CircleHelp,
  FileCheck2,
  FlaskConical,
  Siren,
} from 'lucide-preact';
import type { ActivityRef } from '../lib/activities';
import { ActivityIconBox, Chip, DoneTick, RowChevron } from './ui';

export type ActivityChip = {
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  label: string;
  icon?: boolean;
};

type Props = {
  activity: ActivityRef;
  done?: boolean;
  chips?: ActivityChip[];
  href: string;
};

const KIND_ICON: Record<
  ActivityRef['kind'],
  { Icon: typeof BookOpen; color: string }
> = {
  notes: { Icon: BookOpen, color: 'var(--accent)' },
  lab: { Icon: FlaskConical, color: '#7C3AED' },
  quiz: { Icon: CircleHelp, color: '#CA8A04' },
  assignment: { Icon: FileCheck2, color: '#EA580C' },
  exam: { Icon: Award, color: '#DB2777' },
  scenarios: { Icon: Siren, color: 'var(--danger)' },
  guide: { Icon: BookOpen, color: 'var(--accent)' },
};

export function ActivityRow({ activity, done, chips = [], href }: Props) {
  const { Icon, color } = KIND_ICON[activity.kind];
  const visibleChips = chips.slice(0, 2);
  return (
    <a href={href} class="activity-row">
      <ActivityIconBox color={color}>
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </ActivityIconBox>
      <div class="activity-body">
        <p class={`activity-name ${done ? 'done' : ''}`}>{activity.title}</p>
        {activity.subtitle && <p class="activity-meta">{activity.subtitle}</p>}
      </div>
      <div class="activity-chips">
        {done && (
          <Chip tone="success" icon={<DoneTick />}>
            Done
          </Chip>
        )}
        {!done &&
          visibleChips.map((c) => (
            <Chip key={c.label} tone={c.tone} icon={c.icon ? <DoneTick /> : undefined}>
              {c.label}
            </Chip>
          ))}
      </div>
      <RowChevron />
    </a>
  );
}