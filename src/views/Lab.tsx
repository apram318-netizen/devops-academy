import { useEffect, useMemo, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { getUnit } from '../data/curriculum';
import { isCapstoneScenarioWeek, labId, unitWeekIndex } from '../lib/activities';
import { labBrief, labSteps, studyResources, whatToSubmitLab } from '../data/content';
import { earlyOrLate, formatLongDateTime, weekEnd } from '../lib/dates';
import { isDone, labAutoComplete, labConditions } from '../lib/completion';
import {
  Breadcrumb,
  Button,
  Chip,
  Dialog,
  DoneTick,
  FileDrop,
  OverflowMenu,
} from '../components/ui';
import { downloadText } from '../storage/backup';
import type { FileRef } from '../state/types';
import { ExternalLink } from 'lucide-preact';

export function LabView({
  unitId,
  week,
  labIndex,
  edit,
}: {
  unitId: string;
  week: number;
  labIndex: number;
  edit?: boolean;
}) {
  const { state, setSteps, markDone, patchSubmission, setSubmission, uploadFile, removeFile } = useStore();
  const unit = getUnit(unitId);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileRef[]>([]);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declare, setDeclare] = useState(false);

  if (!unit) return <div class="page"><h1 class="page-title">Not found</h1></div>;
  const idx = unitWeekIndex(unit, week);
  if (idx === null) return <div class="page"><h1 class="page-title">Not found</h1></div>;

  const w = unit.weeks[idx]!;
  const scenarios = isCapstoneScenarioWeek(unit, idx);
  const rawLab = w.labs[labIndex] ?? w.labs[0] ?? 'Lab';
  const labTitle = scenarios ? 'Failure scenarios' : rawLab;
  const id = labId(unit.id, week, labIndex);
  const steps = useMemo(
    () => (scenarios ? labSteps(unit.id, idx + 1, w.labs[0] ?? '', true) : labSteps(unit.id, idx + 1, labTitle, false)),
    [unit.id, idx, labTitle, scenarios, w.labs],
  );
  const brief = useMemo(() => labBrief(rawLab, w, scenarios), [rawLab, w, scenarios]);
  const resources = useMemo(() => studyResources(unit, w).slice(0, 4), [unit, w]);
  const checked = state.steps[id] ?? steps.map(() => false);
  const sub = state.subs[id];
  const due = weekEnd(state.prefs.start, week);
  const conds = labConditions(state, id, steps.length);
  const done = isDone(state, id);
  const canAuto = labAutoComplete(state, id, steps.length);
  const cloudCost = unit.id === 'dev104' || unit.id.startsWith('dev2') || unit.id === 'dev301';

  useEffect(() => {
    if (sub) {
      setText(sub.text);
      setFiles(sub.files);
    }
  }, [sub?.modified]);

  useEffect(() => {
    if (!done && canAuto && !state.optOut[id]) markDone(id, true);
  }, [canAuto, done, id, markDone, state.optOut]);

  const toggleStep = (i: number) => {
    const next = steps.map((_, j) => checked[j] ?? false);
    next[i] = !next[i];
    setSteps(id, next);
  };

  const toggleScenario = (i: number) => {
    const base = steps.length;
    const next = [...(state.steps[id] ?? Array(base + w.labs.length).fill(false))];
    while (next.length < base + w.labs.length) next.push(false);
    next[base + i] = !next[base + i];
    setSteps(id, next);
  };

  const saveDraft = () => {
    patchSubmission(id, {
      status: 'draft',
      files,
      text,
      attempt: sub?.attempt ?? 1,
    });
  };

  const submit = () => {
    patchSubmission(id, {
      status: 'submitted',
      files,
      text,
      submittedAt: Date.now(),
      attempt: sub?.attempt ?? 1,
    });
    setDeclare(false);
    location.hash = `#/course/${unit.id}/week/${week}/lab/${labIndex}`;
  };

  const onFiles = async (list: File[]) => {
    setError(null);
    if (files.length + list.length > 20) {
      setError('You can attach up to 20 files');
      return;
    }
    try {
      const uploaded: FileRef[] = [];
      for (const f of list) uploaded.push(await uploadFile(f));
      setFiles((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  if (edit) {
    return (
      <div class="page reading">
        <Breadcrumb
          items={[
            { label: unit.code, href: `#/course/${unit.id}` },
            { label: `Week ${idx + 1}`, href: `#/course/${unit.id}/week/${week}` },
            { label: 'Lab', href: `#/course/${unit.id}/week/${week}/lab/${labIndex}` },
            { label: 'Submission' },
          ]}
        />
        <h1 class="page-title">Lab submission portal</h1>
        <p class="page-sub">Due {formatLongDateTime(due)}. Save a draft any time, then submit when ready.</p>

        <div class="submission-portal">
          <h2 class="week-panel-title">What to submit</h2>
          <ul class="week-list">
            {whatToSubmitLab().map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>

          <div class="field" style={{ marginTop: 24 }}>
            <label>File submissions</label>
            <FileDrop onFiles={(f) => void onFiles(f)} />
            {files.map((f) => (
              <div class="file-row" key={f.id}>
                <span style={{ flex: 1 }}>{f.name}</span>
                <span class="field-help">{(f.size / 1024).toFixed(0)} KB</span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    void removeFile(f.id);
                    setFiles((prev) => prev.filter((x) => x.id !== f.id));
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            {error && <div class="field-error">{error}</div>}
          </div>

          <div class="field">
            <label for="ev-text">Online text (notes, links, repo URL)</label>
            <textarea
              id="ev-text"
              value={text}
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
              placeholder="Paste key commands, a short write-up, or a repo link"
            />
          </div>

          <label class="declare-row">
            <input type="checkbox" checked={declare} onChange={(e) => setDeclare((e.target as HTMLInputElement).checked)} />
            <span>This submission is my own work</span>
          </label>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="primary" disabled={!declare || (files.length === 0 && !text.trim())} onClick={submit}>
              Submit evidence
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                saveDraft();
                location.hash = `#/course/${unit.id}/week/${week}/lab/${labIndex}`;
              }}
            >
              Save draft
            </Button>
            <Button variant="ghost" onClick={() => (location.hash = `#/course/${unit.id}/week/${week}/lab/${labIndex}`)}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const scenarioChecks = state.steps[id] ?? [];

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
            <button type="button" class="chip chip-success" style={{ height: 28, border: 'none', cursor: 'pointer' }} onClick={() => markDone(id, false)}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Breadcrumb
            items={[
              { label: unit.code, href: `#/course/${unit.id}` },
              { label: `Week ${idx + 1}`, href: `#/course/${unit.id}/week/${week}` },
              { label: scenarios ? 'Scenarios' : 'Lab' },
            ]}
          />
          <OverflowMenu
            items={[
              {
                label: 'Download lab sheet (.md)',
                onClick: () =>
                  downloadText(
                    `${unit.id}-week-${String(idx + 1).padStart(2, '0')}-lab.md`,
                    `# Lab\n\n${labTitle}\n\n${brief.summary}\n\n## Steps\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n## Deliverables\n${brief.deliverables.map((d) => `- ${d}`).join('\n')}\n`,
                  ),
              },
            ]}
          />
        </div>

        <h1 class="page-title">{scenarios ? 'Failure scenarios' : `Lab: ${labTitle}`}</h1>
        <p class="page-sub">Due {formatLongDateTime(due)}</p>

        <div class="prose">
          <h2>Brief</h2>
          <p>{brief.summary}</p>

          {cloudCost && (
            <p style={{ color: 'var(--warning)' }}>
              Cost reminder: tear down cloud resources when you finish each session.
            </p>
          )}

          <h2>Deliverables</h2>
          <ul>
            {brief.deliverables.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>

          <h2>Steps</h2>
          <div class="checklist">
            {steps.map((s, i) => (
              <label key={i}>
                <input type="checkbox" checked={!!checked[i]} onChange={() => toggleStep(i)} />
                <span dangerouslySetInnerHTML={{ __html: s.replace(/`([^`]+)`/g, '<code>$1</code>') }} />
              </label>
            ))}
          </div>

          {scenarios && (
            <>
              <h2>Scenarios</h2>
              <div class="checklist">
                {w.labs.map((s, i) => (
                  <label key={i}>
                    <input
                      type="checkbox"
                      checked={!!scenarioChecks[steps.length + i]}
                      onChange={() => toggleScenario(i)}
                    />
                    <span>
                      {i + 1}. {s}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}

          <h2>Tips</h2>
          <ul>
            {brief.tips.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>

          <h2>Lab resources</h2>
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
        </div>

        <section class="submission-portal" style={{ marginTop: 32 }}>
          <h2 class="week-panel-title">Submission status</h2>
          <p class="week-panel-body">Upload evidence through the submission portal. Drafts are private until you submit.</p>
          <table class="status-table">
            <tbody>
              <tr>
                <th>Attempt number</th>
                <td>{sub?.attempt ?? '—'}</td>
              </tr>
              <tr>
                <th>Submission status</th>
                <td>
                  {!sub ? (
                    <Chip tone="neutral">Nothing submitted</Chip>
                  ) : sub.status === 'draft' ? (
                    <Chip tone="warning">Draft (not submitted)</Chip>
                  ) : (
                    <Chip tone="success">Submitted for grading</Chip>
                  )}
                </td>
              </tr>
              <tr>
                <th>Grading status</th>
                <td>
                  {sub?.status === 'submitted' ? (
                    <Chip tone="info">Awaiting self-check / complete</Chip>
                  ) : (
                    <Chip tone="neutral">Not graded</Chip>
                  )}
                </td>
              </tr>
              <tr>
                <th>Due date</th>
                <td>{formatLongDateTime(due)}</td>
              </tr>
              <tr>
                <th>Time remaining</th>
                <td>
                  {sub?.status === 'submitted' && sub.submittedAt
                    ? earlyOrLate(sub.submittedAt, due)
                    : (() => {
                        const ms = due.getTime() - Date.now();
                        if (ms < 0) return 'Overdue';
                        const d = Math.floor(ms / 86400000);
                        const h = Math.floor((ms % 86400000) / 3600000);
                        return d > 0 ? `${d} day${d === 1 ? '' : 's'} ${h} hours` : `${Math.max(1, h)} hours`;
                      })()}
                </td>
              </tr>
              <tr>
                <th>Last modified</th>
                <td>{sub ? new Date(sub.modified).toLocaleString('en-AU') : '—'}</td>
              </tr>
              <tr>
                <th>File submissions</th>
                <td>{sub?.files.length ? sub.files.map((f) => f.name).join(', ') : '—'}</td>
              </tr>
              <tr>
                <th>Online text</th>
                <td style={{ whiteSpace: 'pre-wrap' }}>{sub?.text || '—'}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              onClick={() => (location.hash = `#/course/${unit.id}/week/${week}/lab/${labIndex}/edit`)}
            >
              {sub ? 'Edit submission' : 'Add submission'}
            </Button>
            {sub?.status === 'submitted' && (
              <Button
                variant="secondary"
                onClick={() => patchSubmission(id, { status: 'draft', submittedAt: undefined })}
              >
                Revert to draft
              </Button>
            )}
            {sub && (
              <Button variant="danger" onClick={() => setConfirmRemove(true)}>
                Remove submission
              </Button>
            )}
          </div>
        </section>
      </div>

      {confirmRemove && (
        <Dialog
          title="Remove this submission?"
          onClose={() => setConfirmRemove(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmRemove(false)}>
                Cancel
              </Button>
              <Button
                variant="danger-solid"
                onClick={() => {
                  for (const f of sub?.files ?? []) void removeFile(f.id);
                  setSubmission(id, null);
                  setConfirmRemove(false);
                }}
              >
                Remove
              </Button>
            </>
          }
        >
          <p>Its files will be deleted.</p>
        </Dialog>
      )}
    </>
  );
}

void ExternalLink;
