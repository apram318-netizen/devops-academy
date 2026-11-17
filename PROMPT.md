# Build prompt: DevOps Academy (local-first learning platform)

Paste everything below the line into Claude (desktop agent / Claude Code), with this folder open. The folder contains:

- `PROMPT.md` (this file)
- `STYLE_GUIDE.md` (visual design rules; follow it exactly)
- `curriculum-data.js` (all units, weeks, topics, labs, notes, assessments)
- `quiz-bank.js` (3 multiple-choice questions for every content week)

---

## 1. Your role and the goal

You are a senior front-end engineer and product designer. Build **DevOps Academy**: a personal, offline-first learning platform that works like a university LMS (the structure of Moodle: dashboard, courses, weekly sections, activities, assignments, quizzes, grades, calendar), but with a calm, uncluttered, modern interface.

It is for one learner following a 30-week DevOps curriculum: two 12-week semesters of 4 units each, then a 6-week capstone. All curriculum content is in `curriculum-data.js` and `quiz-bank.js`. Do not invent a different curriculum; render what is in those files.

The finished product must:

1. Run by double-clicking a file on my computer, with no server, no account and no internet (except optional web fonts).
2. Keep all my data (progress, answers, submissions, uploaded files, grades) safely and permanently on my device.
3. Give every week of every unit its **own dedicated view**.
4. Feel quiet and focused: one clear next action per screen, lots of white space, no visual noise.

Do not use the Moodle name, logo or trademarks anywhere. The product name is "DevOps Academy".

## 2. How to work

1. Read all four files in this folder first. Summarise back to me in under 15 lines what you're going to build, the tech choice, and any questions. Wait for my answer only if something is genuinely ambiguous; otherwise proceed.
2. Build in stages and show me each stage running (screenshots via Playwright are ideal):
   - Stage 1: project scaffold, data loading, routing, app shell (top bar, navigation), empty views.
   - Stage 2: dashboard, My courses, course page, week view.
   - Stage 3: notes, labs, quizzes, assignments, submission flow, completion rules.
   - Stage 4: grades, calendar, notifications, preferences, persistence, backup and restore.
   - Stage 5: polish against `STYLE_GUIDE.md`, accessibility pass, automated tests, final single-file build.
3. After each stage, run the tests and fix failures before moving on.
4. Keep a short `CHANGELOG.md` and a `README.md` that tells me how to open, back up and update the app.

## 3. Tech requirements

- **Stack:** Vite + TypeScript + Preact (or vanilla TS if you prefer). No heavy UI frameworks. Icons from `lucide` (tree-shaken, inlined as SVG).
- **Output:** a single self-contained `DevOps-Academy.html` produced by `npm run build` (use `vite-plugin-singlefile` or equivalent) that opens from `file://` in Chrome, Edge and Firefox. All JS, CSS, data and icons inlined.
- **Routing:** hash-based (`#/...`) so it works from `file://`.
- **Fonts:** Inter from Google Fonts with a full system-font fallback, so it looks right offline.
- **No network calls** at runtime other than the optional font stylesheet and links the learner clicks.
- Convert `curriculum-data.js` and `quiz-bank.js` into typed TypeScript modules (`src/data/curriculum.ts`, `src/data/quizzes.ts`). Keep the content word for word.

## 4. Persistence (most important requirement)

Data must survive closing the browser, restarting the computer, and moving the HTML file.

Implement a storage layer with three tiers:

1. **Primary: IndexedDB** (database `devops-academy`), stores `state` (one JSON record) and `files` (uploaded blobs keyed by id). Request `navigator.storage.persist()` on first run and show the result in Preferences.
2. **Folder sync (Chrome and Edge):** using the File System Access API, let me pick a folder once ("Save my progress to a folder"). After that, autosave `progress.json` and a `files/` subfolder there on every change (debounced 2 s), and load from it on startup if permission is still granted. Store the directory handle in IndexedDB. If permission lapses, show a one-click "Reconnect folder" banner. Hide this feature in browsers that don't support it.
3. **Manual backup:** "Export backup" downloads one `.json` file containing state plus files (base64). "Import backup" restores it after a confirmation. Remind me with a slim banner when the last backup or folder sync is older than 7 days and I have progress.

Rules:
- Write state on every meaningful change, debounced 400 ms, and flush on `visibilitychange` and `beforeunload`.
- Version the state schema (`schemaVersion: 1`) and write a migration function so future versions can upgrade old data.
- Never lose data silently. If a write fails, show a clear error banner with an Export backup button.
- Footer shows the save status in plain words: "Saved to this browser", "Saved to folder: <name>", or "Not saving".

## 5. Information architecture and routes

| Route | View |
| --- | --- |
| `#/` | Dashboard |
| `#/week/:n` | Program week overview: everything due in calendar week n across all units |
| `#/courses` | My courses |
| `#/course/:unit` | Course home: unit summary + list of weeks |
| `#/course/:unit/week/:n` | **Week view** (see section 6) |
| `#/course/:unit/week/:n/notes` | Notes |
| `#/course/:unit/week/:n/lab/:i` | Lab (and `/edit` for evidence) |
| `#/course/:unit/week/:n/quiz` | Quiz info; `/attempt`, `/review/:k` |
| `#/course/:unit/assessment/:id` | Assignment; `/edit`, `/submit`, `/grade` |
| `#/course/:unit/grades` | Unit gradebook |
| `#/course/:unit/guide` | Unit guide |
| `#/grades` | All grades |
| `#/calendar` | Month calendar |
| `#/settings` | Preferences, storage, backup |

Every view has a breadcrumb and a working browser back button.

## 6. The week view (separate view per week)

This is the heart of the app. Each unit's course home shows weeks as a **compact vertical list** (one row per week: week number, title, date range, a small progress ring, and a due-date chip if something is due). Clicking a row opens that week's own view. No expanding accordions with dozens of activities on one long page.

The week view layout:

- **Header:** "Week 3 · Packages and services", date range, unit code, previous/next week arrows, a progress ring (activities done / total).
- **Next step card:** one prominent card telling me the single next thing to do ("Study the notes: 4 of 10 minutes done", "Submit lab evidence, due Sunday 11:59 PM", "Take the quiz"). One primary button.
- **Activity list (max 4 to 5 items):** Notes, Lab, Quiz, and any assessment due that week. Each row: icon, name, one status chip, due date if any. Nothing else on the row.
- **Capstone weeks 26 to 28** have 10 scenarios each: show them as a numbered checklist inside a single "Failure scenarios" activity, not 10 separate rows.
- Exam weeks show only the final assessment and a short message.

Also build `#/week/:n` (program week overview) reachable from the dashboard: one column per active unit, each showing that unit's week card with its next step, so I can plan a whole week at a glance.

## 7. Feature specs

### Dashboard
- Greeting with my first name and the current program week ("Week 3 of 30"), or a countdown if the program hasn't started.
- **This week** card: the 4 units' week cards for the current week, each with progress and next step, linking to the week view.
- **Upcoming** list: next 7 days of deadlines, grouped by day, max 8 rows, "View all" link to the calendar. Overdue items appear first with a red chip.
- Small stats row (max 3 stats): program progress %, due in 7 days, overdue.
- No more than 3 sections on the dashboard.

### My courses
- Grid of course cards (cover pattern, code, name, semester, progress bar). Filters: All, In progress, Future, Past, Starred. Search. Star and hide from a "..." menu.

### Course home
- Title, one-sentence summary, progress, tabs: **Weeks** (default), **Grades**, **Guide**.
- Weeks list as described in section 6. Assessments shown in the week they're due.

### Notes (per week)
- Clean reading layout (max width 720 px): topics, learning outcomes, key ideas (render backtick text as inline code), study plan, resources, then **self-check questions** with a text area each (autosaved).
- A slim sticky completion bar at the top: three conditions and a "Mark as done" button.
- "Download notes (.md)" in an overflow menu, not as a big button.

### Lab
- Goal, numbered steps as checkboxes (persisted), tips, cost reminder for cloud units.
- Evidence section: status (not submitted / submitted early or late), files, notes and links. "Add evidence" opens a focused form: drag-and-drop file area (20 MB per file, 20 files), a text area for links and notes, Submit.
- Lab sheet download in the overflow menu.

### Quiz
- Info screen: number of questions, attempts unlimited, highest grade counts, pass mark 2 of 3, previous attempts table, Start / Continue / Re-attempt.
- Attempt: one question per screen with a progress indicator and question navigator dots; options shuffled per attempt; answers autosaved; "Finish attempt" leads to a summary, then a confirm dialog.
- Review: score, time taken, each question with my answer, the correct answer and the explanation.

### Assignments and exams
- Brief, requirements list, what to submit, weight, opened and due dates, downloadable brief and checklist (.md), postmortem template where flagged (`tpl: true`).
- Submission flow like a university LMS: Add submission (files + online text) saves a **draft**; Submit assignment requires ticking "This submission is my own work"; status table shows attempt, submission status, grading status, time remaining or how early/late, last modified, files, text.
- Revert to draft and Remove submission (with confirmation).
- **Self-grading:** a rubric with one checkbox per requirement; grade = met / total × 100; optional numeric override (for certification scores); feedback comments. Shows as a Feedback table afterwards.

### Grades
- Unit gradebook: Weekly labs (5%: share of labs with evidence), Weekly quizzes (5%: average best score across the unit's quizzes), then each assessment at its weight from the data file. Columns: item, weight, grade, contribution. Course total counts graded items only, with a note showing the average so far.
- Capstone uses only its six assessments.
- Export grades as CSV.

### Calendar
- Month grid. Major assessments appear as named events. Weekly labs and quizzes are collapsed into a single "Weekly tasks (n open)" event on each Sunday. Click a day to see its items in a side panel.

### Notifications
- Bell icon with a count of items due in the next 7 days or overdue. Popover lists them. No other notification types.

### Settings
- Display name (default "Apramjot Singh"), program start date (default Monday 23 November 2026; all dates derive from it), storage status, folder sync, export/import backup, reset progress (double confirmation).

## 8. Dates and deadlines

- Week `n` starts on start date + 7 × (n − 1) days (Monday).
- Everything due in week `n` is due **Sunday 11:59 PM local time** of that week.
- Every content week has a lab and a quiz due that Sunday (capstone has scenarios, no quizzes). Assessments use the `due` week in the data file.
- Show relative times in plain words ("Due in 3 days", "Overdue by 2 hours") and absolute times on hover or in detail views.

## 9. Completion rules

Never complete anything just because it was opened.

| Activity | Automatic completion when | Manual |
| --- | --- | --- |
| Notes | 10 minutes of active study on the page (timer counts only while the tab is visible and there was input in the last 90 s) **and** scrolled to the end **and** every self-check answered with at least 20 characters | "Mark as done" button |
| Lab | every step ticked **and** evidence submitted | "Mark as done" |
| Quiz | best score at least 2 of 3 | "Mark as done" |
| Assessment | submitted (not draft) | none |
| Unit guide | manual only | "Mark as done" |

If I untick a manually or automatically completed item, it stays unticked (store an opt-out flag) until I tick it again. Show conditions as small, quiet chips: done ones in green with a tick, open ones grey with progress ("4 of 10 min").

## 10. Data model (suggested)

```ts
type State = {
  schemaVersion: 1;
  prefs: { name: string; start: string /* YYYY-MM-DD */; lastBackup: number | null };
  done: Record<ActivityId, number>;             // completion timestamps
  optOut: Record<ActivityId, true>;
  page: Record<ActivityId, { sec: number; end: boolean; ans: string[] }>;
  steps: Record<ActivityId, boolean[]>;
  subs: Record<ActivityId, Submission>;         // assignments and lab evidence
  quiz: Record<ActivityId, { attempts: Attempt[]; current: Attempt | null }>;
  ui: { starred: string[]; hidden: string[]; recent: string[] };
};
type Submission = { status: 'draft' | 'submitted'; files: FileRef[]; text: string; modified: number; submittedAt?: number; attempt: number; grade?: number; rubric?: boolean[]; override?: number | null; feedback?: string; gradedAt?: number };
type FileRef = { id: string; name: string; size: number; type: string };
type Attempt = { start: number; end?: number; order: number[][]; answers: (number | null)[]; score?: number };
```

Activity ids: `dev101-w3-notes`, `dev101-w3-lab0`, `dev101-w3-quiz`, assessment ids from the data file (`dev101-a1`).

## 11. Content generation rules

- Learning outcomes: derive from the week's topics ("Explain and use ...", max 6).
- Self-check questions: 4 per week, derived from topics (explain one topic with an example; what breaks when another is misconfigured; write the exact commands for a third; what surprised you in the lab).
- Lab steps: create the folder `<unit>-labs/week-NN`, do the lab, break it on purpose and fix it, save evidence, write a README, commit and submit evidence. Capstone scenarios use the 7-step failure method (hypothesis, break, watch alerts, diagnose blind, fix, add a guard, write the postmortem).
- Course welcome message: one short announcement on the course home (dismissible), not a forum.

## 12. UI principles (summary; full detail in STYLE_GUIDE.md)

- One primary action per screen. Secondary actions go in a "..." overflow menu.
- Max reading width 720 px for text, 1120 px for page content.
- No more than one row of chips per item, and no more than 2 chips per row.
- Use empty space and typography for hierarchy, not borders and boxes. Cards only where grouping matters.
- No sidebars on reading views. The course index is a slide-over panel opened from a button.
- Progress is shown with thin bars and small rings, never big coloured blocks.

## 13. Accessibility and responsiveness

- WCAG 2.2 AA contrast, visible focus rings, full keyboard support (including quiz answers with arrow keys), labels on all inputs, `aria-live` for save status and toasts, reduced-motion support.
- Works from 360 px phone width to large desktop. On mobile the top navigation collapses into a menu; tables become stacked rows.

## 14. Testing and acceptance criteria

Write Playwright tests that open the built `DevOps-Academy.html` via `file://` and check:

1. Every route renders without console errors (iterate all units, weeks, labs, quizzes, assessments).
2. Opening a notes page does not complete it; meeting the three conditions does; Mark as done works; unticking stays unticked.
3. Lab completes only after steps and evidence.
4. Quiz attempt with all correct answers scores 3/3 and completes; review shows explanations.
5. Assignment: draft, submit with declaration, self-grade, grade appears in the gradebook with the right contribution.
6. Reloading the page keeps all of the above (IndexedDB).
7. Export backup, reset, import backup restores everything including an uploaded file.
8. Changing the start date moves every due date.
9. Visual snapshots of dashboard, course home, week view, notes, quiz attempt and assignment at 1280 px and 390 px.

Done means: all tests pass, `npm run build` produces one HTML file under 1 MB, and the README explains how to open it, where data lives, and how to back up.
