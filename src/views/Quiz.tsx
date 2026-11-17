import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../state/store';
import { getUnit } from '../data/curriculum';
import { getQuiz } from '../data/quizzes';
import { quizId, unitWeekIndex } from '../lib/activities';
import { formatLongDateTime, weekEnd } from '../lib/dates';
import { isDone, quizAutoComplete, quizBestScore, quizConditions } from '../lib/completion';
import { Breadcrumb, Button, Chip, Dialog, DoneTick } from '../components/ui';
import type { Attempt } from '../state/types';

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function QuizAttempt({
  unitId,
  week,
  localWeek,
  questions,
  id,
}: {
  unitId: string;
  week: number;
  localWeek: number;
  questions: ReturnType<typeof getQuiz> & object;
  id: string;
}) {
  const { state, setQuiz } = useStore();
  const data = state.quiz[id] ?? { attempts: [], current: null };
  const cur = data.current;
  const [qIndex, setQIndex] = useState(0);
  const [confirmFinish, setConfirmFinish] = useState(false);

  useEffect(() => {
    if (!cur) {
      location.hash = `#/course/${unitId}/week/${week}/quiz`;
    }
  }, [cur, unitId, week]);

  useEffect(() => {
    if (!cur) return;
    const optionOrder = cur.order[qIndex] ?? [];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setQIndex((i) => Math.min(questions!.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setQIndex((i) => Math.max(0, i - 1));
      const n = Number(e.key);
      if (n >= 1 && n <= optionOrder.length) {
        const answers = [...cur.answers];
        answers[qIndex] = optionOrder[n - 1]!;
        setQuiz(id, { ...data, current: { ...cur, answers } });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qIndex, cur, data, id, questions, setQuiz]);

  if (!cur || !questions) return null;
  const q = questions[qIndex];
  if (!q) return null;
  const optionOrder = cur.order[qIndex] ?? q[1].map((_, i) => i);

  const select = (optOriginalIndex: number) => {
    const answers = [...cur.answers];
    answers[qIndex] = optOriginalIndex;
    setQuiz(id, { ...data, current: { ...cur, answers } });
  };

  const finish = () => {
    let score = 0;
    cur.answers.forEach((ans, i) => {
      if (ans === questions[i]![2]) score++;
    });
    const finished: Attempt = { ...cur, end: Date.now(), score };
    setQuiz(id, { attempts: [...data.attempts, finished], current: null });
    setConfirmFinish(false);
    location.hash = `#/course/${unitId}/week/${week}/quiz/review/${data.attempts.length}`;
  };

  const answered = cur.answers.filter((a) => a !== null).length;
  void localWeek;

  return (
    <div class="page reading">
      <div class="quiz-nav">
        <span>
          Question {qIndex + 1} of {questions.length}
        </span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              class={`quiz-dot ${cur.answers[i] !== null ? 'answered' : ''} ${i === qIndex ? 'current' : ''}`}
              aria-label={`Question ${i + 1}`}
              onClick={() => setQIndex(i)}
            />
          ))}
        </div>
      </div>

      <h1 class="page-title" style={{ fontSize: 20 }}>
        {q[0]}
      </h1>

      <div role="radiogroup" aria-label="Answers">
        {optionOrder.map((oi, displayIdx) => (
          <button
            key={oi}
            type="button"
            role="radio"
            aria-checked={cur.answers[qIndex] === oi}
            class={`option-row ${cur.answers[qIndex] === oi ? 'selected' : ''}`}
            onClick={() => select(oi)}
          >
            <span>{String.fromCharCode(65 + displayIdx)}.</span>
            <span>{q[1][oi]}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button variant="secondary" disabled={qIndex === 0} onClick={() => setQIndex((i) => i - 1)}>
          Previous
        </Button>
        {qIndex < questions.length - 1 ? (
          <Button variant="primary" onClick={() => setQIndex((i) => i + 1)}>
            Next
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setConfirmFinish(true)}>
            Finish attempt
          </Button>
        )}
      </div>

      {confirmFinish && (
        <Dialog
          title="Submit this attempt?"
          onClose={() => setConfirmFinish(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setConfirmFinish(false)}>
                Return
              </Button>
              <Button variant="primary" onClick={finish}>
                Submit
              </Button>
            </>
          }
        >
          <p>
            You answered {answered} of {questions.length} questions. You can review after submitting.
          </p>
        </Dialog>
      )}
    </div>
  );
}

export function QuizView({
  unitId,
  week,
  mode = 'info',
  attemptIndex,
}: {
  unitId: string;
  week: number;
  mode?: 'info' | 'attempt' | 'review';
  attemptIndex?: number;
}) {
  const { state, setQuiz, markDone } = useStore();
  const unit = getUnit(unitId);

  if (!unit) return <div class="page"><h1 class="page-title">Not found</h1></div>;
  const idx = unitWeekIndex(unit, week);
  if (idx === null) return <div class="page"><h1 class="page-title">Not found</h1></div>;

  const questions = getQuiz(unit.id, idx + 1) ?? [];
  const id = quizId(unit.id, week);
  const data = state.quiz[id] ?? { attempts: [], current: null };
  const best = quizBestScore(state, id);
  const conds = quizConditions(state, id);
  const done = isDone(state, id);
  const canAuto = quizAutoComplete(state, id);
  const due = weekEnd(state.prefs.start, week);

  useEffect(() => {
    if (!done && canAuto && !state.optOut[id]) markDone(id, true);
  }, [canAuto, done, id, markDone, state.optOut]);

  const startAttempt = () => {
    const order = questions.map((q, qi) => {
      const opts = q[1].map((_, oi) => oi);
      return shuffle(opts, Date.now() + qi * 97);
    });
    const attempt: Attempt = {
      start: Date.now(),
      order,
      answers: questions.map(() => null),
    };
    setQuiz(id, { ...data, current: attempt });
    location.hash = `#/course/${unit.id}/week/${week}/quiz/attempt`;
  };

  if (mode === 'attempt') {
    return (
      <QuizAttempt unitId={unit.id} week={week} localWeek={idx + 1} questions={questions} id={id} />
    );
  }

  if (mode === 'review') {
    const attempt = data.attempts[attemptIndex ?? data.attempts.length - 1];
    if (!attempt) {
      location.hash = `#/course/${unit.id}/week/${week}/quiz`;
      return null;
    }
    const ms = (attempt.end ?? Date.now()) - attempt.start;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);

    return (
      <div class="page reading">
        <Breadcrumb
          items={[
            { label: unit.code, href: `#/course/${unit.id}` },
            { label: `Week ${idx + 1}`, href: `#/course/${unit.id}/week/${week}` },
            { label: 'Quiz', href: `#/course/${unit.id}/week/${week}/quiz` },
            { label: 'Review' },
          ]}
        />
        <h1 class="page-title">
          Score {attempt.score ?? 0} / {questions.length}
        </h1>
        <p class="page-sub">
          Time taken {mins}m {secs}s
        </p>
        {questions.map((q, i) => {
          const order = attempt.order[i] ?? q[1].map((_, oi) => oi);
          const mine = attempt.answers[i];
          return (
            <div key={i} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                {i + 1}. {q[0]}
              </h2>
              {order.map((oi) => {
                const correct = oi === q[2];
                const selected = oi === mine;
                let cls = 'option-row';
                if (correct) cls += ' correct';
                else if (selected) cls += ' wrong';
                return (
                  <div key={oi} class={cls}>
                    <span>{q[1][oi]}</span>
                    {correct && <DoneTick />}
                  </div>
                );
              })}
              {q[3] && <div class="explain-box">{q[3]}</div>}
            </div>
          );
        })}
        <Button variant="secondary" onClick={() => (location.hash = `#/course/${unit.id}/week/${week}/quiz`)}>
          Back to quiz
        </Button>
      </div>
    );
  }

  const cta = data.current ? 'Continue' : data.attempts.length ? 'Re-attempt' : 'Start quiz';

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
        <Breadcrumb
          items={[
            { label: unit.code, href: `#/course/${unit.id}` },
            { label: `Week ${idx + 1}`, href: `#/course/${unit.id}/week/${week}` },
            { label: 'Quiz' },
          ]}
        />
        <h1 class="page-title">Week {idx + 1} quiz</h1>
        <p class="page-sub">Due {formatLongDateTime(due)}</p>

        <div class="card" style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0 }}>{questions.length} questions · Unlimited attempts · Highest grade counts</p>
          <p>Pass mark: 2 of 3{best !== null ? ` · Best so far ${best}/3` : ''}</p>
          <Button
            variant="primary"
            onClick={() => {
              if (data.current) location.hash = `#/course/${unit.id}/week/${week}/quiz/attempt`;
              else startAttempt();
            }}
          >
            {cta}
          </Button>
        </div>

        {data.attempts.length > 0 && (
          <>
            <h2 class="section-title">Previous attempts</h2>
            <table class="grades-table">
              <thead>
                <tr>
                  <th>Attempt</th>
                  <th class="num">Score</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((a, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td class="num">
                      {a.score ?? 0}/{questions.length}
                    </td>
                    <td>
                      <a href={`#/course/${unit.id}/week/${week}/quiz/review/${i}`}>Review</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
