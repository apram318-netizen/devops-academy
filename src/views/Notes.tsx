import { useEffect, useMemo, useRef } from 'preact/hooks';
import { useStore } from '../state/store';
import { getUnit } from '../data/curriculum';
import { notesId, unitWeekIndex } from '../lib/activities';
import {
  estimateHours,
  learningOutcomes,
  renderInlineCode,
  selfCheckQuestions,
  studyPlan,
  studyResources,
  weekOverview,
} from '../data/content';
import { getWeekMedia } from '../data/weekMedia';
import { formatWeekRange, weekEnd, weekStart } from '../lib/dates';
import { isDone, notesAutoComplete, notesConditions } from '../lib/completion';
import { Breadcrumb, Button, Chip, DoneTick, OverflowMenu } from '../components/ui';
import { YouTubeEmbed } from '../components/YouTubeEmbed';
import { ForgeWeekPanel } from '../components/ForgeWeekPanel';
import { downloadText } from '../storage/backup';

export function NotesView({ unitId, week }: { unitId: string; week: number }) {
  const { state, updatePage, markDone } = useStore();
  const unit = getUnit(unitId);
  const endRef = useRef<HTMLDivElement>(null);
  const lastInput = useRef(Date.now());

  if (!unit) return <div class="page"><h1 class="page-title">Not found</h1></div>;
  const idx = unitWeekIndex(unit, week);
  if (idx === null) return <div class="page"><h1 class="page-title">Not found</h1></div>;

  const w = unit.weeks[idx]!;
  const id = notesId(unit.id, week);
  const questions = useMemo(() => selfCheckQuestions(w), [w]);
  const outcomes = useMemo(() => learningOutcomes(w), [w]);
  const resources = useMemo(() => studyResources(unit, w), [unit, w]);
  const plan = useMemo(() => studyPlan(w), [w]);
  const overview = weekOverview(w);
  const media = useMemo(() => getWeekMedia(unit.id, idx + 1), [unit.id, idx]);
  const page = state.page[id] ?? { sec: 0, end: false, ans: questions.map(() => ''), watched: [] };
  const ans = [...questions.map((_, i) => page.ans[i] ?? '')];
  const watched = new Set(page.watched ?? []);
  const conds = notesConditions(state, id, questions.length);
  const done = isDone(state, id);
  const canAuto = notesAutoComplete(state, id);
  const start = weekStart(state.prefs.start, week);
  const end = weekEnd(state.prefs.start, week);

  useEffect(() => {
    const onAny = () => {
      lastInput.current = Date.now();
    };
    window.addEventListener('pointerdown', onAny);
    window.addEventListener('keydown', onAny);
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastInput.current > 90_000) return;
      const cur = state.page[id]?.sec ?? 0;
      if (cur < 600) updatePage(id, { sec: cur + 1 });
    }, 1000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pointerdown', onAny);
      window.removeEventListener('keydown', onAny);
    };
  }, [id, state.page, updatePage]);

  useEffect(() => {
    if (!endRef.current || page.end) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) updatePage(id, { end: true });
      },
      { threshold: 0.5 },
    );
    obs.observe(endRef.current);
    return () => obs.disconnect();
  }, [id, page.end, updatePage]);

  useEffect(() => {
    if (!done && canAuto && !state.optOut[id]) markDone(id, true);
  }, [canAuto, done, id, markDone, state.optOut]);

  const downloadMd = () => {
    const md = [
      `# Week ${idx + 1} notes: ${w.t}`,
      '',
      `## Topics`,
      w.topics,
      '',
      `## Learning outcomes`,
      ...outcomes.map((o) => `- ${o}`),
      '',
      `## Key ideas`,
      ...w.notes.map((n) => `- ${n}`),
      '',
      `## Self-check`,
      ...questions.map((q, i) => `### ${i + 1}. ${q}\n\n${ans[i] || ''}`),
    ].join('\n');
    downloadText(`${unit.id}-week-${String(idx + 1).padStart(2, '0')}-notes.md`, md);
  };

  return (
    <>
      <div class="completion-bar">
        <div class="completion-bar-inner">
          <div class="completion-chips">
            {conds.map((c) => (
              <Chip key={c.id} tone={c.done ? 'success' : 'neutral'} icon={c.done ? <DoneTick /> : undefined}>
                {c.label}
              </Chip>
            ))}
          </div>
          {done ? (
            <button
              type="button"
              class="chip chip-success"
              style={{ height: 28, cursor: 'pointer', border: 'none' }}
              onClick={() => markDone(id, false)}
            >
              <DoneTick /> Done
            </button>
          ) : (
            <Button variant="secondary" onClick={() => markDone(id, true)}>
              Mark as done
            </Button>
          )}
        </div>
      </div>

      <div class="page reading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Breadcrumb
            items={[
              { label: unit.code, href: `#/course/${unit.id}` },
              { label: `Week ${idx + 1}`, href: `#/course/${unit.id}/week/${week}` },
              { label: 'Notes' },
            ]}
          />
          <OverflowMenu items={[{ label: 'Download notes (.md)', onClick: downloadMd }]} />
        </div>

        <h1 class="page-title">Week {idx + 1} notes: {w.t}</h1>
        <p class="page-sub">
          {formatWeekRange(start, end)} · about {estimateHours(w)} hours this week
        </p>

        <article class="prose">
          <h2>Overview</h2>
          <p>{overview}</p>

          <h2>Topics</h2>
          <p>{w.topics}</p>

          <h2>Learning outcomes</h2>
          <ul>
            {outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>

          <h2>Key ideas</h2>
          <ul>
            {w.notes.map((n) => (
              <li key={n} dangerouslySetInnerHTML={{ __html: renderInlineCode(n) }} />
            ))}
          </ul>

          <h2>SquadForge this week</h2>
          <p style={{ fontSize: 14 }}>
            <a href="#/project">Open full SquadForge tracker →</a>
          </p>
          <ForgeWeekPanel unitId={unit.id} weekIndex1Based={idx + 1} />

          <h2>Study plan</h2>
          <ol>
            {plan.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>

          {media && (
            <>
              <h2>Watch this week</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Concept focus: {media.concepts.join(' · ')}
              </p>
              {media.videos.map((video) => (
                <YouTubeEmbed
                  key={video.youtubeId + (video.startSeconds ?? 0)}
                  video={video}
                  watched={watched.has(video.youtubeId)}
                  onWatched={() => {
                    const next = new Set(watched);
                    next.add(video.youtubeId);
                    updatePage(id, { watched: [...next] });
                  }}
                />
              ))}
              {media.reads.length > 0 && (
                <>
                  <h3>Concept reads</h3>
                  <ul>
                    {media.reads.map((r) => (
                      <li key={r.url}>
                        <a href={r.url} target="_blank" rel="noreferrer">
                          {r.title}
                        </a>
                        {' — '}
                        {r.why}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          <h2>Unit books &amp; resources</h2>
          <ul>
            {resources.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
                {' — '}
                {r.why}
              </li>
            ))}
          </ul>

          <h2>Self-check</h2>
          {questions.map((q, i) => (
            <div class="field" key={i}>
              <label for={`${id}-q${i}`}>
                {i + 1}. {q}
              </label>
              <textarea
                id={`${id}-q${i}`}
                value={ans[i]}
                onInput={(e) => {
                  lastInput.current = Date.now();
                  const next = [...ans];
                  next[i] = (e.target as HTMLTextAreaElement).value;
                  updatePage(id, { ans: next });
                }}
              />
              <div class="field-help">Write at least 20 characters</div>
            </div>
          ))}
          <div ref={endRef} style={{ height: 1 }} aria-hidden />
        </article>
      </div>
    </>
  );
}
