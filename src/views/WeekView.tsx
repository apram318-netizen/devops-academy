import { useMemo } from 'preact/hooks';
import { useStore } from '../state/store';
import { getUnit } from '../data/curriculum';
import { activitiesForWeek, activityHref, notesId, unitWeekIndex } from '../lib/activities';
import {
  estimateHours,
  labBrief,
  learningOutcomes,
  renderInlineCode,
  studyPlan,
  studyResources,
  weekOverview,
} from '../data/content';
import { getWeekMedia } from '../data/weekMedia';
import { squadForgeApply } from '../data/squadforge';
import { formatLongDateTime, formatWeekRange, relativeDue, weekEnd, weekStart } from '../lib/dates';
import { activityComplete, quizBestScore } from '../lib/completion';
import { computeNextStep, defaultStepCount } from '../lib/nextStep';
import {
  ActivityIconBox,
  Breadcrumb,
  Button,
  Chip,
  DoneTick,
  ProgressRing,
  RowChevron,
} from '../components/ui';
import { YouTubeEmbed } from '../components/YouTubeEmbed';
import {
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileCheck2,
  FlaskConical,
  Siren,
} from 'lucide-preact';

function iconFor(kind: string) {
  const p = { size: 18, strokeWidth: 1.75 as const };
  switch (kind) {
    case 'notes':
      return { el: <BookOpen {...p} />, color: 'var(--accent)' };
    case 'lab':
      return { el: <FlaskConical {...p} />, color: '#7C3AED' };
    case 'quiz':
      return { el: <CircleHelp {...p} />, color: '#CA8A04' };
    case 'exam':
      return { el: <Award {...p} />, color: '#DB2777' };
    case 'scenarios':
      return { el: <Siren {...p} />, color: 'var(--danger)' };
    default:
      return { el: <FileCheck2 {...p} />, color: '#EA580C' };
  }
}

export function WeekView({ unitId, week }: { unitId: string; week: number }) {
  const { state } = useStore();
  const unit = getUnit(unitId);
  if (!unit) {
    return (
      <div class="page">
        <h1 class="page-title">Week not found</h1>
      </div>
    );
  }
  const idx = unitWeekIndex(unit, week);
  if (idx === null) {
    return (
      <div class="page">
        <h1 class="page-title">Week not in this unit</h1>
      </div>
    );
  }

  const w = unit.weeks[idx]!;
  const acts = useMemo(() => activitiesForWeek(unit, idx), [unit, idx]);
  const stepCounts = Object.fromEntries(acts.map((a) => [a.id, defaultStepCount(a)]));
  const done = acts.filter((a) => activityComplete(state, a, stepCounts[a.id])).length;
  const next = computeNextStep(state, acts, stepCounts);
  const start = weekStart(state.prefs.start, week);
  const end = weekEnd(state.prefs.start, week);
  const localWeek = idx + 1;
  const prev = week > unit.start ? week - 1 : null;
  const nextW = week < unit.start + unit.weeks.length - 1 ? week + 1 : null;
  const outcomes = useMemo(() => learningOutcomes(w), [w]);
  const plan = useMemo(() => studyPlan(w), [w]);
  const resources = useMemo(() => studyResources(unit, w), [unit, w]);
  const media = useMemo(() => getWeekMedia(unit.id, idx + 1), [unit.id, idx]);
  const forge = useMemo(() => squadForgeApply(unit.id, idx + 1), [unit.id, idx]);
  const hours = estimateHours(w);
  const overview = weekOverview(w);
  const watched = new Set(state.page[notesId(unit.id, week)]?.watched ?? []);

  return (
    <div class="page">
      <Breadcrumb
        items={[
          { label: 'My courses', href: '#/courses' },
          { label: unit.code, href: `#/course/${unit.id}` },
          { label: `Week ${localWeek}` },
        ]}
      />

      <div class="week-header">
        <div>
          <h1 class="page-title" style={{ fontSize: 20, lineHeight: '28px' }}>
            Week {localWeek} · {w.t}
          </h1>
          <p class="page-sub" style={{ marginBottom: 0 }}>
            {formatWeekRange(start, end)} · about {hours} hours · due {formatLongDateTime(end)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ProgressRing value={done} total={acts.length || 1} size={44} />
          <div class="week-nav">
            {prev ? (
              <a class="icon-btn" href={`#/course/${unit.id}/week/${prev}`} aria-label="Previous week">
                <ChevronLeft size={18} strokeWidth={1.75} />
              </a>
            ) : (
              <span class="icon-btn" style={{ opacity: 0.3 }} aria-hidden>
                <ChevronLeft size={18} />
              </span>
            )}
            {nextW ? (
              <a class="icon-btn" href={`#/course/${unit.id}/week/${nextW}`} aria-label="Next week">
                <ChevronRight size={18} strokeWidth={1.75} />
              </a>
            ) : (
              <span class="icon-btn" style={{ opacity: 0.3 }} aria-hidden>
                <ChevronRight size={18} />
              </span>
            )}
          </div>
        </div>
      </div>

      <div class={`next-step ${next.complete ? 'complete' : ''}`}>
        <div>
          <div class="next-step-label">{next.complete ? 'Week complete' : 'Next step'}</div>
          <p class="next-step-text">{next.text}</p>
        </div>
        {next.complete ? (
          <Button variant="secondary" onClick={() => (location.hash = next.href)}>
            {next.cta}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => (location.hash = next.href)}>
            {next.cta}
          </Button>
        )}
      </div>

      <section class="week-panel">
        <h2 class="week-panel-title">This week</h2>
        <p class="week-panel-body">{overview}</p>
        <p class="week-panel-meta">
          <strong>Topics:</strong> {w.topics}
        </p>
      </section>

      <section class="week-panel">
        <h2 class="week-panel-title">SquadForge this week</h2>
        <p class="week-panel-body">{forge}</p>
        <p class="week-panel-meta">
          <a href="#/project">Open SquadForge tracker →</a>
        </p>
      </section>

      <section class="week-panel">
        <h2 class="week-panel-title">Learning outcomes</h2>
        <ul class="week-list">
          {outcomes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>

      <section class="week-panel">
        <h2 class="week-panel-title">Key ideas</h2>
        <ul class="week-list">
          {w.notes.map((n) => (
            <li key={n} dangerouslySetInnerHTML={{ __html: renderInlineCode(n) }} />
          ))}
        </ul>
      </section>

      <section class="week-panel">
        <h2 class="week-panel-title">Study plan</h2>
        <ol class="week-list">
          {plan.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
      </section>

      {media && (
        <section class="week-panel">
          <h2 class="week-panel-title">Watch this week</h2>
          <p class="week-panel-body" style={{ marginBottom: 12 }}>
            Concept focus: {media.concepts.join(' · ')}
          </p>
          {media.videos.map((video) => (
            <YouTubeEmbed key={video.youtubeId + (video.startSeconds ?? 0)} video={video} watched={watched.has(video.youtubeId)} />
          ))}
          {media.reads.length > 0 && (
            <div class="resource-list" style={{ marginTop: 12 }}>
              {media.reads.map((r) => (
                <a key={r.url} class="resource-row" href={r.url} target="_blank" rel="noreferrer">
                  <div>
                    <div class="resource-title">
                      {r.title} <ExternalLink size={14} strokeWidth={1.75} />
                    </div>
                    <div class="resource-why">{r.why}</div>
                  </div>
                </a>
              ))}
            </div>
          )}
          <p class="week-panel-meta" style={{ marginTop: 12 }}>
            Mark videos watched in <a href={`#/course/${unit.id}/week/${week}/notes`}>Notes</a>.
          </p>
        </section>
      )}

      <section class="section" style={{ marginBottom: 32 }}>
        <h2 class="section-title">Activities</h2>
        <div>
          {acts.map((a) => {
            const complete = activityComplete(state, a, stepCounts[a.id]);
            const icon = iconFor(a.kind);
            const due = a.dueWeek ? weekEnd(state.prefs.start, a.dueWeek) : null;
            const rel = due ? relativeDue(due) : null;
            const chips: { tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; label: string }[] = [];
            if (complete) chips.push({ tone: 'success', label: 'Done' });
            else {
              if (a.kind === 'quiz') {
                const best = quizBestScore(state, a.id);
                if (best !== null) chips.push({ tone: 'info', label: `Best ${best}/3` });
              }
              if (a.kind === 'lab' || a.kind === 'scenarios') {
                const sub = state.subs[a.id];
                if (sub?.status === 'draft') chips.push({ tone: 'warning', label: 'Draft' });
                else if (sub?.status === 'submitted') chips.push({ tone: 'success', label: 'Submitted' });
              }
              if (rel && chips.length < 2) {
                chips.push({
                  tone: rel.tone === 'danger' ? 'danger' : rel.tone === 'warning' ? 'warning' : 'neutral',
                  label: rel.tone === 'danger' ? 'Overdue' : 'Due Sun',
                });
              }
            }

            let detail = a.subtitle ?? '';
            if (a.kind === 'lab' || a.kind === 'scenarios') {
              const brief = labBrief(
                w.labs[a.labIndex ?? 0] ?? a.title,
                w,
                a.kind === 'scenarios',
              );
              detail = brief.summary;
            } else if (a.kind === 'notes') {
              detail = `Read topics, key ideas and answer 4 self-check questions · about ${Math.max(2, Math.round(hours * 0.35))} hours`;
            } else if (a.kind === 'quiz') {
              detail = '3 multiple-choice questions · unlimited attempts · pass mark 2 of 3';
            } else if (a.kind === 'assignment' || a.kind === 'exam') {
              detail = a.assessment
                ? `Weight ${a.assessment.weight}% · submit files and online text through the portal`
                : detail;
            }

            return (
              <a
                key={a.id}
                class="activity-row activity-row-rich"
                href={activityHref(a)}
                title={due ? formatLongDateTime(due) : undefined}
              >
                <ActivityIconBox color={icon.color}>{icon.el}</ActivityIconBox>
                <div class="activity-body">
                  <p class={`activity-name ${complete ? 'done' : ''}`}>{a.title}</p>
                  <p class="activity-meta activity-meta-wrap">{detail}</p>
                </div>
                <div class="activity-chips">
                  {chips.slice(0, 2).map((c) => (
                    <Chip key={c.label} tone={c.tone} icon={c.tone === 'success' ? <DoneTick /> : undefined}>
                      {c.label}
                    </Chip>
                  ))}
                </div>
                <RowChevron />
              </a>
            );
          })}
        </div>
      </section>

      <section class="week-panel">
        <h2 class="week-panel-title">Unit books &amp; resources</h2>
        <p class="week-panel-body" style={{ marginBottom: 12 }}>
          Core books and links for this unit. Week videos are above under Watch this week.
        </p>
        <div class="resource-list">
          {resources.map((r) => (
            <a key={r.url} class="resource-row" href={r.url} target="_blank" rel="noreferrer">
              <div>
                <div class="resource-title">
                  {r.title} <ExternalLink size={14} strokeWidth={1.75} />
                </div>
                <div class="resource-why">{r.why}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
