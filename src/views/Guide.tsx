import { useStore } from '../state/store';
import { getUnit } from '../data/curriculum';
import { guideId } from '../lib/activities';
import { isDone } from '../lib/completion';
import { Breadcrumb, Button, Chip } from '../components/ui';
import { DoneTick } from '../components/ui';

export function GuideView({ unitId, embedded }: { unitId: string; embedded?: boolean }) {
  const { state, markDone } = useStore();
  const unit = getUnit(unitId);
  if (!unit) return null;
  const id = guideId(unit.id);
  const done = isDone(state, id);

  const body = (
    <div class="prose">
      <h2>Unit guide</h2>
      <p>{unit.summary}</p>
      <h3>Resources</h3>
      <ul>
        {unit.res.map(([title, url]) => (
          <li key={url}>
            <a href={url} target="_blank" rel="noreferrer">
              {title}
            </a>
          </li>
        ))}
      </ul>
      <h3>Assessment weights</h3>
      <ul>
        {unit.labWeight > 0 && <li>Weekly labs: {unit.labWeight}%</li>}
        {unit.quizWeight > 0 && <li>Weekly quizzes: {unit.quizWeight}%</li>}
        <li>Major assessments: see the Grades tab</li>
      </ul>
      <div style={{ marginTop: 24 }}>
        {done ? (
          <Chip tone="success" icon={<DoneTick />}>
            Done
          </Chip>
        ) : (
          <Button variant="secondary" onClick={() => markDone(id, true)}>
            Mark as done
          </Button>
        )}
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <div class="page reading">
      <Breadcrumb
        items={[
          { label: 'My courses', href: '#/courses' },
          { label: unit.code, href: `#/course/${unit.id}` },
          { label: 'Guide' },
        ]}
      />
      <h1 class="page-title">
        {unit.code} guide
      </h1>
      {body}
    </div>
  );
}
