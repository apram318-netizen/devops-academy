import { useStore } from '../state/store';
import { UNITS, getUnit } from '../data/curriculum';
import { exportGradesCsv, unitGradebook } from '../lib/grades';
import { Breadcrumb, Button } from '../components/ui';
import { downloadText } from '../storage/backup';

export function UnitGrades({ unitId, embedded }: { unitId: string; embedded?: boolean }) {
  const { state } = useStore();
  const unit = getUnit(unitId);
  if (!unit) return null;
  const { rows, total, note } = unitGradebook(state, unitId);

  const table = (
    <>
      <table class="grades-table">
        <thead>
          <tr>
            <th>Item</th>
            <th class="num">Weight</th>
            <th class="num">Grade</th>
            <th class="num">Contribution</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.item}</td>
              <td class="num">{r.weight}%</td>
              <td class="num">{r.grade == null ? '—' : `${r.grade.toFixed(0)}%`}</td>
              <td class="num">{r.contribution == null ? '—' : r.contribution.toFixed(1)}</td>
            </tr>
          ))}
          <tr class="total">
            <td>Course total</td>
            <td class="num" />
            <td class="num">{total == null ? '—' : `${total.toFixed(0)}%`}</td>
            <td class="num" />
          </tr>
        </tbody>
      </table>
      <p class="field-help">{note}</p>
    </>
  );

  if (embedded) return <div>{table}</div>;

  return (
    <div class="page">
      <Breadcrumb
        items={[
          { label: 'My courses', href: '#/courses' },
          { label: unit.code, href: `#/course/${unit.id}` },
          { label: 'Grades' },
        ]}
      />
      <h1 class="page-title">
        {unit.code} grades
      </h1>
      {table}
    </div>
  );
}

export function AllGrades() {
  const { state } = useStore();
  return (
    <div class="page">
      <div class="week-header">
        <h1 class="page-title">All grades</h1>
        <Button
          variant="secondary"
          onClick={() => downloadText('devops-academy-grades.csv', exportGradesCsv(state), 'text/csv')}
        >
          Export CSV
        </Button>
      </div>
      {UNITS.map((u) => {
        const { total } = unitGradebook(state, u.id);
        return (
          <a key={u.id} class="activity-row" href={`#/course/${u.id}/grades`} style={{ marginBottom: 4 }}>
            <div class="activity-body">
              <p class="activity-name">
                {u.code} {u.name}
              </p>
              <p class="activity-meta">{u.cat}</p>
            </div>
            <div class="activity-chips" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {total == null ? '—' : `${total.toFixed(0)}%`}
            </div>
          </a>
        );
      })}
    </div>
  );
}
