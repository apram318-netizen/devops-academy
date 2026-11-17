# DevOps Academy: style guide

A calm, focused study tool. Think of a well-made notebook rather than a busy portal: generous space, quiet colour, clear type, and one obvious next step on every screen.

---

## 1. Design principles

1. **One next step.** Every screen answers "what should I do now?" with a single primary button. Everything else is secondary or tucked away.
2. **Quiet by default.** Grey and white carry the layout. Colour is reserved for meaning: blue for action, green for done, amber for due soon, red for overdue.
3. **Space over lines.** Separate things with white space and type weight before reaching for borders, boxes or dividers.
4. **Progressive disclosure.** Show the summary; reveal detail on click. Week lists before week content, conditions as small chips, downloads in overflow menus.
5. **Readable first.** Long text sits in a 720 px column with comfortable line height. No text in all caps except tiny labels.
6. **Consistent and predictable.** The same item always looks the same everywhere (an activity row in the week view looks like an activity row on the dashboard).

### Clutter budget (hard limits)

| Element | Limit |
| --- | --- |
| Primary buttons per screen | 1 |
| Sections on the dashboard | 3 |
| Chips per row | 2 |
| Activities shown in a week view | 5 (group extras) |
| Lines of helper text under a heading | 1 |
| Colours used for status | 4 (blue, green, amber, red) |
| Font weights | 3 (400, 500, 600) |
| Font sizes on one screen | 4 |

---

## 2. Colour

### Neutrals (most of the interface)

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#FAFAF9` | App background |
| `--surface` | `#FFFFFF` | Cards, panels, inputs |
| `--surface-muted` | `#F4F4F2` | Hover rows, code blocks, quiet fills |
| `--border` | `#E7E5E4` | Hairline borders (1 px) |
| `--border-strong` | `#D6D3D1` | Inputs, focus-adjacent borders |
| `--text` | `#1C1917` | Primary text |
| `--text-muted` | `#57534E` | Secondary text, metadata |
| `--text-subtle` | `#78716C` | Placeholders, timestamps (min 4.5:1 on white for body text; use only at 14 px+) |

### Brand and status

| Token | Hex | Tint (backgrounds) | Use |
| --- | --- | --- | --- |
| `--accent` | `#2563EB` | `#EFF6FF` | Primary buttons, links, active nav, focus ring |
| `--accent-hover` | `#1D4ED8` | | Hover on primary |
| `--success` | `#15803D` | `#F0FDF4` | Done, submitted on time, correct answer |
| `--warning` | `#B45309` | `#FFFBEB` | Due within 48 hours, drafts |
| `--danger` | `#B91C1C` | `#FEF2F2` | Overdue, errors, destructive actions |

Rules:
- Status colour appears only as small chips, thin bars, icons or text. Never fill a whole card with status colour.
- Links are `--accent`, underlined on hover only.
- Text on tints uses the full-strength colour of that status.

### Unit colours (used only for the course cover pattern and a 3 px left accent on course cards)

| Unit | Colour |
| --- | --- |
| DEV101 | `#2563EB` |
| DEV102 | `#0D9488` |
| DEV103 | `#7C3AED` |
| DEV104 | `#EA580C` |
| DEV201 | `#4F46E5` |
| DEV202 | `#9333EA` |
| DEV203 | `#DB2777` |
| DEV204 | `#CA8A04` |
| DEV301 | `#16A34A` |

Never use unit colours for buttons, text or status.

### Dark mode (optional, stage 5)

Invert neutrals (`--bg #0C0A09`, `--surface #1C1917`, `--surface-muted #292524`, `--border #292524`, `--text #FAFAF9`, `--text-muted #A8A29E`), keep accent at `#3B82F6`. Follow `prefers-color-scheme`, with a toggle in Settings.

---

## 3. Typography

- **Font:** Inter (Google Fonts, weights 400, 500, 600), fallback `-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
- **Monospace:** `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` for inline code and commands.
- Enable `font-feature-settings: "cv11", "ss01"` and tabular numbers (`font-variant-numeric: tabular-nums`) in tables, timers and grades.

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `display` | 28 / 36 | 600 | Page titles (one per page) |
| `title` | 20 / 28 | 600 | Section titles, week view title |
| `heading` | 16 / 24 | 600 | Card titles, activity names |
| `body` | 15 / 24 | 400 | Default text |
| `reading` | 17 / 28 | 400 | Notes pages and briefs |
| `small` | 13 / 20 | 400 / 500 | Metadata, chips, helper text |
| `label` | 12 / 16 | 500, letter-spacing 0.02em | Tiny uppercase labels (sparingly) |

Rules:
- Sentence case everywhere ("Add evidence", not "Add Evidence").
- Max line length 70 characters for reading text.
- Inline code: monospace at 0.9em, `--surface-muted` background, 4 px radius, 2 px 6 px padding, `--text` colour (not red).

---

## 4. Spacing, layout and shape

- **Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64. Use only these.
- **Page padding:** 32 px desktop, 16 px mobile.
- **Content width:** 1120 px max for app pages, 720 px for reading views (notes, briefs, quiz questions).
- **Vertical rhythm:** 48 px between page sections, 24 px between cards, 12 px between rows inside a card.
- **Radius:** 6 px (inputs, chips, buttons), 10 px (cards), 14 px (dialogs), full (avatars, progress rings).
- **Borders:** 1 px `--border`. Cards may use either a border or a shadow, never both.
- **Shadows:** `--shadow-sm: 0 1px 2px rgba(28,25,23,.06)` for cards on hover; `--shadow-lg: 0 12px 32px rgba(28,25,23,.12)` for dialogs, menus and popovers only.
- **Grid:** 12 columns, 24 px gutter. Dashboard uses 8 + 4 on desktop, single column under 900 px.
- **Breakpoints:** 600, 900, 1200 px.

---

## 5. Iconography

- Lucide icons, 1.75 px stroke, 18 px in rows and buttons, 20 px in the top bar.
- Activity icons (in a 32 px rounded square with a 10% tint of the icon colour):

| Activity | Lucide icon | Colour |
| --- | --- | --- |
| Notes | `book-open` | `--accent` |
| Lab | `flask-conical` | `#7C3AED` |
| Quiz | `circle-help` | `#CA8A04` |
| Assignment | `file-check-2` | `#EA580C` |
| Exam / certification | `award` | `#DB2777` |
| Failure scenarios | `siren` | `--danger` |
| Resource link | `external-link` | `--text-muted` |

- Never use emoji in the interface.

---

## 6. Components

### Top bar
- 56 px tall, `--surface`, bottom hairline border, no shadow.
- Left: logo mark (24 px rounded square, accent fill, white graduation-cap icon) + "DevOps Academy" in 15 px / 600.
- Centre-left: nav links "Dashboard", "Courses", "Calendar", "Grades" in `--text-muted`; active link in `--text` with a 2 px accent underline flush with the bar's bottom edge.
- Right: bell (with a small red dot and count if anything is due in 7 days), avatar with initials (32 px circle, `--surface-muted`).
- On mobile: logo, bell, and a menu button opening a full-height sheet.

### Footer
- One quiet line, 13 px `--text-subtle`: save status on the left ("Saved to folder: Study" with a green dot), "Settings" link on the right.

### Buttons

| Variant | Style | Use |
| --- | --- | --- |
| Primary | Accent fill, white text, 36 px tall, 16 px horizontal padding | The one main action |
| Secondary | Surface fill, 1 px `--border-strong`, `--text` | Cancel, alternatives |
| Ghost | No border, `--text-muted`, hover `--surface-muted` | Toolbar and inline actions |
| Danger | `--danger` text, hover `--danger` tint; filled only inside confirm dialogs | Remove, reset |
| Icon | 32 px square ghost button with tooltip | Overflow "...", close |

States: hover darkens 6%, active darkens 10%, disabled 45% opacity, focus ring `0 0 0 3px rgba(37,99,235,.35)`.

### Chips (status)
- 22 px tall, 8 px horizontal padding, 6 px radius, 12 px / 500 text, tint background, full-strength text, optional 12 px icon.
- Variants: `neutral` (grey: "To do"), `success` ("Done", "Submitted"), `warning` ("Due in 2 days", "Draft"), `danger` ("Overdue"), `info` (accent: "Best 3/3").
- Max 2 per row.

### Progress
- **Bar:** 4 px tall, full radius, `--surface-muted` track, accent fill (success fill at 100%).
- **Ring:** 28 px (rows) or 44 px (headers), 3 px stroke, percentage or "3/5" in the centre for 44 px only.

### Cards
- `--surface`, 1 px border, 10 px radius, 24 px padding (16 px on mobile).
- Title row: heading + optional ghost action on the right. No coloured headers.
- Hover (when clickable): border `--border-strong`, `--shadow-sm`, cursor pointer, whole card is the link.

### Course card
- Cover: 96 px tall, the unit colour as a soft geometric pattern (low-opacity white circles and diamonds on the unit colour), 10 px top radius.
- Body: small label "Semester 1" (12 px muted), name "DEV101 Linux and Shell" (16 px / 600), progress bar with "34%" at the right.
- "..." icon button top-right of the body for Star and Hide.

### Week row (course home)
```
[ring]  Week 3   Packages and services            30 Nov - 6 Dec    [Due Sun]  >
```
- 56 px tall, full-width link, hover `--surface-muted`, 12 px radius.
- Current week is marked by a 3 px accent bar on the left and the label "This week".
- Past weeks with everything done show a green ring and muted text.

### Activity row (week view, dashboard)
```
[icon]  Lab: Write a systemd unit that restarts on failure       [Evidence due Sun]   >
        Lab · About 4 hours
```
- Icon square, name (15 px / 500), one line of metadata (13 px muted), at most 2 chips on the right, chevron.
- Done rows: name in `--text-muted`, green tick chip, no due chip.

### Next step card (week view and dashboard)
- Accent tint background (`#EFF6FF`), no border, 10 px radius, 20 px padding.
- Label "Next step" (12 px / 500 accent), one sentence (16 px / 500), one primary button on the right (stacks below on mobile).
- When the week is complete: success tint, "Week complete", and a secondary button "Go to week 4".

### Completion bar (notes, lab, quiz)
- Sticky under the top bar while scrolling, `--surface` with a bottom hairline, 48 px tall.
- Left: condition chips ("10 min studied" done, "Read to the end" to do, "Self-check 2 of 4"). Right: "Mark as done" secondary button, which becomes a success chip-button "Done" with a tick.

### Forms
- Labels above inputs, 13 px / 500. Inputs 40 px tall, 1 px `--border-strong`, 6 px radius, focus ring.
- Text areas min 120 px tall, auto-grow.
- Helper text 13 px muted under the input; errors 13 px danger with an icon.

### File drop zone
- 1.5 px dashed `--border-strong`, 10 px radius, 32 px padding, centred upload icon (24 px) and "Drop files here or browse" (browse is a link). On drag-over: accent dashed border and accent tint.
- Uploaded files appear as rows below: file-type icon, name, size, remove icon button. No grid of big tiles.

### Status table (assignment)
- Two columns, label column 200 px in `--text-muted`, no zebra stripes, hairline row dividers, 12 px vertical padding.
- Status cells use chips rather than coloured cell backgrounds.

### Quiz
- One question per screen inside a 720 px column.
- Top: "Question 2 of 3" + dot navigator (8 px dots: filled accent = answered, outline = unanswered, ring = current).
- Options are full-width selectable rows (48 px min height, 1 px border, 8 px radius). Selected: accent border + accent tint + filled radio. Keyboard: arrow keys move, Enter selects.
- Review: correct option in success tint with a tick, my wrong option in danger tint with a cross, explanation in a quiet `--surface-muted` box below.

### Tables (grades)
- Header row 12 px / 500 muted, no background. Numbers right-aligned with tabular figures. Total row 600 weight with a top border.
- On mobile, each row becomes a small stacked card.

### Calendar
- Month grid with hairline borders, day numbers top-left 13 px, today as an accent-filled circle.
- Events as 20 px pills with tint backgrounds; max 2 per day, then "+3 more".
- Clicking a day opens a right-side panel (360 px) listing items.

### Dialogs, menus, toasts
- Dialog: 480 px wide, 14 px radius, `--shadow-lg`, title 18 px / 600, body, right-aligned buttons. Backdrop `rgba(12,10,9,.4)`.
- Overflow menu: 200 px min width, 6 px padding, 36 px items, hover `--surface-muted`.
- Toast: bottom centre, dark (`#1C1917`) with white text, 10 px radius, auto-dismiss after 3 s, one at a time.

### Banners
- Full-width slim bar under the top bar (40 px), tint background matching meaning, one sentence and at most one action link. Used only for save problems and backup reminders.

### Empty states
- Centred, 48 px muted icon, one line heading ("Nothing due this week"), one line of help, optional secondary button.

---

## 7. Motion

- 150 ms ease-out for hover and focus; 200 ms for menus and dialogs (fade + 4 px rise); progress bars animate width over 300 ms.
- No bouncing, no confetti, no parallax.
- Respect `prefers-reduced-motion`: remove transforms, keep instant state changes.

---

## 8. Writing style (interface copy)

- Plain, friendly, short. Second person ("Submit your evidence").
- Buttons are verbs: "Start quiz", "Add evidence", "Submit assignment", "Export backup".
- Dates: "Sun 29 Nov, 11:59 PM" in rows; "Sunday, 29 November 2026, 11:59 PM" in detail views. Relative time for urgency ("Due in 2 days", "Overdue by 3 hours").
- Australian English spelling (organise, colour, behaviour).
- No em dashes; use commas, colons or full stops.
- Confirmations say what will happen: "Remove this submission? Its files will be deleted."

---

## 9. Screen sketches

### Dashboard
```
Good evening, Apramjot                                   Week 3 of 30

[ 34% program ]  [ 6 due this week ]  [ 0 overdue ]

This week ─────────────────────────────────────────────────────────────
 DEV101 Packages and services   (ring) Next: study notes 4/10 min   >
 DEV102 TCP and UDP             (ring) Next: take the quiz           >
 DEV103 Python for ops 1        (ring) Next: submit lab evidence     >
 DEV104 VPC                     (ring) Week complete                 >

Upcoming ──────────────────────────────────────────────────────────────
 Sun 6 Dec
  (lab)  Lab: Write a systemd unit ...     DEV101     [Due Sun]
  (quiz) Week 3 quiz: TCP and UDP          DEV102     [Due Sun]
                                                       View calendar >
```

### Course home
```
My courses / DEV101
DEV101 Linux and Shell                                (44px ring 18%)
The operating system every container, node and CI runner is built on.

Weeks   Grades   Guide
─────
 (ring) Week 1  Filesystem and permissions     23 - 29 Nov     Done
 (ring) Week 2  Users, groups and processes    30 Nov - 6 Dec  Done
|(ring) Week 3  Packages and services          7 - 13 Dec      This week  [Due Sun]
 (ring) Week 4  Bash scripting basics          14 - 20 Dec
 ...
 (ring) Week 6  Disks and storage              28 Dec - 3 Jan  [Assignment 1]
```

### Week view
```
DEV101 / Week 3                                              <  >
Week 3 · Packages and services                               (ring 1/3)
7 - 13 December

┌ Next step ───────────────────────────────────────────────────────┐
│ Finish the notes: 4 of 10 minutes studied      [ Continue notes ] │
└──────────────────────────────────────────────────────────────────┘

 (book)  Notes: Packages and services             [2 of 3 done]      >
 (flask) Lab: systemd unit that restarts          [Due Sun]          >
 (help)  Week 3 quiz                              [Due Sun]          >
```

### Notes
```
[ 10 min ✓ ] [ Read to end ] [ Self-check 1/4 ]                [ Mark as done ]
─────────────────────────────────────────────────────────────────────────────
                Week 3 notes: Packages and services
                7 - 13 December · about 7 hours this week

                Topics
                apt and dnf, repositories, systemd units ...

                Key ideas
                • A unit file has [Unit], [Service] and [Install] ...

                Self-check
                1. Explain apt and dnf to a junior engineer ...
                [                                              ]
```

---

## 10. Do and don't

| Do | Don't |
| --- | --- |
| One primary button per screen | Rows of equal-weight buttons |
| White space between groups | Boxes inside boxes inside boxes |
| Small chips for status | Coloured table cells or filled cards |
| Week list, then week view | One long page with every activity of the unit |
| Overflow menu for downloads | A "Download" button on every row |
| Plain sentence explaining what's next | Badges like "To do: View" on everything |
| Consistent row anatomy | Different layouts for the same item type |
