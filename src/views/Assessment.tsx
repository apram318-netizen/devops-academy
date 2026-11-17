import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { getAssessment, getUnit } from '../data/curriculum';
import { postmortemTemplate } from '../data/content';
import { earlyOrLate, formatLongDateTime, weekEnd, weekStart } from '../lib/dates';
import {
  Breadcrumb,
  Button,
  Chip,
  Dialog,
  FileDrop,
  OverflowMenu,
} from '../components/ui';
import { downloadText } from '../storage/backup';
import type { FileRef } from '../state/types';

export function AssessmentView({
  unitId,
  assessmentId,
  mode = 'view',
}: {
  unitId: string;
  assessmentId: string;
  mode?: 'view' | 'edit' | 'submit' | 'grade';
}) {
  const { state, patchSubmission, setSubmission, uploadFile, removeFile } = useStore();
  const unit = getUnit(unitId);
  const a = getAssessment(assessmentId);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileRef[]>([]);
  const [declare, setDeclare] = useState(false);
  const [rubric, setRubric] = useState<boolean[]>([]);
  const [override, setOverride] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirm, setConfirm] = useState<'remove' | 'revert' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!unit || !a || a.unit !== unit.id) {
    return (
      <div class="page">
        <h1 class="page-title">Assessment not found</h1>
      </div>
    );
  }

  const id = a.id;
  const sub = state.subs[id];
  const due = weekEnd(state.prefs.start, a.due);
  const opened = weekStart(state.prefs.start, Math.max(1, a.due - 2));

  useEffect(() => {
    if (sub) {
      setText(sub.text);
      setFiles(sub.files);
      setRubric(sub.rubric ?? a.crit.map(() => false));
      setOverride(sub.override != null ? String(sub.override) : '');
      setFeedback(sub.feedback ?? '');
    } else {
      setRubric(a.crit.map(() => false));
    }
  }, [sub?.modified, a.id]);

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

  const saveDraft = () => {
    patchSubmission(id, {
      status: 'draft',
      files,
      text,
      attempt: sub?.attempt ?? 1,
    });
  };

  if (mode === 'edit') {
    return (
      <div class="page reading">
        <Breadcrumb
          items={[
            { label: unit.code, href: `#/course/${unit.id}` },
            { label: a.n, href: `#/course/${unit.id}/assessment/${a.id}` },
            { label: 'Add submission' },
          ]}
        />
        <h1 class="page-title">Add submission</h1>
        <div class="field">
          <label>Files</label>
          <FileDrop onFiles={(f) => void onFiles(f)} />
          {files.map((f) => (
            <div class="file-row" key={f.id}>
              <span style={{ flex: 1 }}>{f.name}</span>
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
          <label for="online-text">Online text</label>
          <textarea id="online-text" value={text} onInput={(e) => setText((e.target as HTMLTextAreaElement).value)} />
        </div>
        <Button
          variant="primary"
          onClick={() => {
            saveDraft();
            location.hash = `#/course/${unit.id}/assessment/${a.id}`;
          }}
        >
          Save draft
        </Button>
      </div>
    );
  }

  if (mode === 'submit') {
    return (
      <div class="page reading">
        <Breadcrumb
          items={[
            { label: unit.code, href: `#/course/${unit.id}` },
            { label: a.n, href: `#/course/${unit.id}/assessment/${a.id}` },
            { label: 'Submit' },
          ]}
        />
        <h1 class="page-title">Submit assignment</h1>
        <p>You are about to submit your draft for grading.</p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '16px 0' }}>
          <input type="checkbox" checked={declare} onChange={(e) => setDeclare((e.target as HTMLInputElement).checked)} />
          <span>This submission is my own work</span>
        </label>
        <Button
          variant="primary"
          disabled={!declare || !sub}
          onClick={() => {
            patchSubmission(id, {
              status: 'submitted',
              submittedAt: Date.now(),
              files: sub?.files ?? files,
              text: sub?.text ?? text,
            });
            location.hash = `#/course/${unit.id}/assessment/${a.id}`;
          }}
        >
          Submit assignment
        </Button>
      </div>
    );
  }

  if (mode === 'grade') {
    const met = rubric.filter(Boolean).length;
    const auto = a.crit.length ? (met / a.crit.length) * 100 : 0;
    return (
      <div class="page reading">
        <Breadcrumb
          items={[
            { label: unit.code, href: `#/course/${unit.id}` },
            { label: a.n, href: `#/course/${unit.id}/assessment/${a.id}` },
            { label: 'Grade' },
          ]}
        />
        <h1 class="page-title">Self-grading</h1>
        <div class="checklist">
          {a.crit.map((c, i) => (
            <label key={i}>
              <input
                type="checkbox"
                checked={!!rubric[i]}
                onChange={() => {
                  const next = [...rubric];
                  next[i] = !next[i];
                  setRubric(next);
                }}
              />
              <span>{c}</span>
            </label>
          ))}
        </div>
        <p>
          Rubric grade: {auto.toFixed(0)}% ({met} of {a.crit.length})
        </p>
        <div class="field">
          <label for="override">Numeric override (optional, e.g. certification score)</label>
          <input id="override" inputMode="decimal" value={override} onInput={(e) => setOverride((e.target as HTMLInputElement).value)} />
        </div>
        <div class="field">
          <label for="feedback">Feedback comments</label>
          <textarea id="feedback" value={feedback} onInput={(e) => setFeedback((e.target as HTMLTextAreaElement).value)} />
        </div>
        <Button
          variant="primary"
          onClick={() => {
            const ov = override.trim() === '' ? null : Number(override);
            patchSubmission(id, {
              rubric,
              grade: auto,
              override: ov != null && !Number.isNaN(ov) ? ov : null,
              feedback,
              gradedAt: Date.now(),
            });
            location.hash = `#/course/${unit.id}/assessment/${a.id}`;
          }}
        >
          Save grade
        </Button>
      </div>
    );
  }

  // view
  const remaining = due.getTime() - Date.now();
  const remainingText =
    remaining > 0
      ? `Due ${formatLongDateTime(due)}`
      : earlyOrLate(sub?.submittedAt ?? Date.now(), due);

  return (
    <div class="page reading">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Breadcrumb
          items={[
            { label: unit.code, href: `#/course/${unit.id}` },
            { label: `Week ${a.due}`, href: `#/course/${unit.id}/week/${a.due}` },
            { label: a.n },
          ]}
        />
        <OverflowMenu
          items={[
            {
              label: 'Download brief (.md)',
              onClick: () =>
                downloadText(
                  `${a.id}-brief.md`,
                  `# ${a.n}: ${a.title}\n\n${a.brief}\n\n## Requirements\n${a.crit.map((c) => `- [ ] ${c}`).join('\n')}\n`,
                ),
            },
            {
              label: 'Download checklist (.md)',
              onClick: () =>
                downloadText(`${a.id}-checklist.md`, `# Checklist\n\n${a.crit.map((c) => `- [ ] ${c}`).join('\n')}\n`),
            },
            ...(a.tpl
              ? [
                  {
                    label: 'Download postmortem template',
                    onClick: () => downloadText('postmortem-template.md', postmortemTemplate()),
                  },
                ]
              : []),
          ]}
        />
      </div>

      <h1 class="page-title">
        {a.n}: {a.title}
      </h1>
      <p class="page-sub">
        Weight {a.weight}% · Opens {formatLongDateTime(opened)} · Due {formatLongDateTime(due)}
      </p>

      <article class="prose">
        <h2>Brief</h2>
        <p>{a.brief}</p>
        <h2>Requirements</h2>
        <ul>
          {a.crit.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <h2>What to submit</h2>
        <p>Upload your files and optional online text, save a draft, then submit with the declaration.</p>
      </article>

      <section class="submission-portal" style={{ marginTop: 32 }}>
      <h2 class="week-panel-title">Submission portal</h2>
      <p class="week-panel-body" style={{ marginBottom: 16 }}>
        Add a draft, then submit with the declaration. Self-grade after you submit.
      </p>
      <table class="status-table">
        <tbody>
          <tr>
            <th>Attempt</th>
            <td>{sub?.attempt ?? '—'}</td>
          </tr>
          <tr>
            <th>Submission status</th>
            <td>
              {!sub ? (
                <Chip tone="neutral">No attempt</Chip>
              ) : sub.status === 'draft' ? (
                <Chip tone="warning">Draft</Chip>
              ) : (
                <Chip tone="success">Submitted</Chip>
              )}
            </td>
          </tr>
          <tr>
            <th>Grading status</th>
            <td>{sub?.gradedAt ? <Chip tone="info">Graded</Chip> : <Chip tone="neutral">Not graded</Chip>}</td>
          </tr>
          <tr>
            <th>Time</th>
            <td title={formatLongDateTime(due)}>{remainingText}</td>
          </tr>
          <tr>
            <th>Last modified</th>
            <td>{sub ? new Date(sub.modified).toLocaleString('en-AU') : '—'}</td>
          </tr>
          <tr>
            <th>Files</th>
            <td>{sub?.files.length ? sub.files.map((f) => f.name).join(', ') : '—'}</td>
          </tr>
          <tr>
            <th>Online text</th>
            <td style={{ whiteSpace: 'pre-wrap' }}>{sub?.text || '—'}</td>
          </tr>
        </tbody>
      </table>

      {sub?.gradedAt && (
        <>
          <h2 class="section-title">Feedback</h2>
          <table class="status-table">
            <tbody>
              <tr>
                <th>Grade</th>
                <td>{(sub.override ?? sub.grade ?? 0).toFixed(0)}%</td>
              </tr>
              <tr>
                <th>Comments</th>
                <td style={{ whiteSpace: 'pre-wrap' }}>{sub.feedback || '—'}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        {(!sub || sub.status === 'draft') && (
          <Button variant="primary" onClick={() => (location.hash = `#/course/${unit.id}/assessment/${a.id}/edit`)}>
            {sub ? 'Edit submission' : 'Add submission'}
          </Button>
        )}
        {sub?.status === 'draft' && (
          <Button variant="secondary" onClick={() => (location.hash = `#/course/${unit.id}/assessment/${a.id}/submit`)}>
            Submit assignment
          </Button>
        )}
        {sub?.status === 'submitted' && (
          <>
            <a class="btn btn-secondary" href={`#/course/${unit.id}/assessment/${a.id}/grade`}>
              Self-grade
            </a>
            <Button variant="ghost" onClick={() => setConfirm('revert')}>
              Revert to draft
            </Button>
            <Button variant="danger" onClick={() => setConfirm('remove')}>
              Remove submission
            </Button>
          </>
        )}
      </div>
      </section>

      {confirm && (
        <Dialog
          title={confirm === 'remove' ? 'Remove this submission?' : 'Revert to draft?'}
          onClose={() => setConfirm(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="danger-solid"
                onClick={() => {
                  if (confirm === 'remove') {
                    for (const f of sub?.files ?? []) void removeFile(f.id);
                    setSubmission(id, null);
                  } else {
                    patchSubmission(id, { status: 'draft', submittedAt: undefined });
                  }
                  setConfirm(null);
                }}
              >
                Confirm
              </Button>
            </>
          }
        >
          <p>
            {confirm === 'remove'
              ? 'Its files will be deleted.'
              : 'You can edit and submit again.'}
          </p>
        </Dialog>
      )}
    </div>
  );
}
