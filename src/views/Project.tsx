import { useStore } from '../state/store';
import { FORGE_MILESTONES, SQUADFORGE } from '../data/squadforge';
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
  const { state } = useStore();
  const start = state.prefs.start;

  return (
    <div class="page reading">
      <h1 class="page-title">{SQUADFORGE.name}</h1>
      <p class="page-sub">{SQUADFORGE.tagline}</p>

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
        <h2 class="section-title">Milestones (ambitious deadlines)</h2>
        <p class="page-sub" style={{ marginTop: 0 }}>
          Program start in preferences: {start}. Complete each unit’s weeks and assignments to hit these.
        </p>
        <div class="forge-milestones">
          {FORGE_MILESTONES.map((m) => {
            const unit = getUnit(m.unit);
            const past = milestoneReached(m.by);
            const pct = unit ? unitProgressPercent(state, unit.id) : 0;
            const assesses = assessmentsForUnit(m.unit);
            const assessDone = assesses.filter((a) => isDone(state, a.id) || state.subs[a.id]?.status === 'submitted').length;
            return (
              <div class="forge-milestone" key={m.id}>
                <div class="forge-milestone-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ProgressRing value={pct} total={100} size={44} />
                    <strong>{m.title}</strong>
                  </div>
                  <Chip tone={pct >= 100 ? 'success' : past ? 'warning' : 'info'}>
                    {pct >= 100 ? 'Complete' : m.by}
                  </Chip>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {unit ? `${unit.code} · ${unit.name}` : m.unit}
                  {assesses.length > 0 ? ` · assessments ${assessDone}/${assesses.length}` : ''}
                </div>
                <p style={{ marginBottom: 8, fontSize: 14 }}>{m.doneWhen}</p>
                {unit && (
                  <a href={`#/course/${unit.id}`} style={{ fontSize: 13 }}>
                    Open unit →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">How to work each week</h2>
        <ol>
          <li>Open the unit week → read notes and unit books</li>
          <li>Watch the week-specific videos (Watch this week)</li>
          <li>Do the lab so it advances SquadForge (see “SquadForge this week”)</li>
          <li>Submit evidence / assignments against the milestone above</li>
        </ol>
      </section>
    </div>
  );
}
