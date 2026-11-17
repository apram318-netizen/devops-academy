/** Parse YYYY-MM-DD as local midnight Monday-based program start. */
export function parseStart(start: string): Date {
  const [y, m, d] = start.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 0, 0, 0, 0);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Week n starts on start + 7*(n-1) days (Monday). */
export function weekStart(programStart: string, week: number): Date {
  return addDays(parseStart(programStart), 7 * (week - 1));
}

export function weekEnd(programStart: string, week: number): Date {
  const start = weekStart(programStart, week);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Everything due in week n is due Sunday 11:59 PM local. */
export function dueSunday(programStart: string, week: number): Date {
  return weekEnd(programStart, week);
}

export function currentProgramWeek(programStart: string, now = new Date()): number {
  const start = parseStart(programStart);
  if (now < start) return 0;
  const diff = now.getTime() - start.getTime();
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(30, Math.max(1, week));
}

export function daysUntilStart(programStart: string, now = new Date()): number {
  const start = parseStart(programStart);
  const ms = start.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ampm}`;
}

/** Row format: "Sun 29 Nov, 11:59 PM" */
export function formatShortDateTime(d: Date): string {
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${formatTime(d)}`;
}

/** Detail: "Sunday, 29 November 2026, 11:59 PM" */
export function formatLongDateTime(d: Date): string {
  return `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}, ${formatTime(d)}`;
}

/** Range: "7 - 13 December" or "30 Nov - 6 Dec" */
export function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getDate()} - ${end.getDate()} ${MONTHS_LONG[start.getMonth()]}`;
  }
  return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} - ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
}

export function formatDayHeading(d: Date): string {
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function relativeDue(due: Date, now = new Date()): { text: string; tone: 'ok' | 'warning' | 'danger' | 'past' } {
  const ms = due.getTime() - now.getTime();
  if (ms < 0) {
    const ago = -ms;
    if (ago < 60_000) return { text: 'Overdue by under a minute', tone: 'danger' };
    if (ago < 3_600_000) return { text: `Overdue by ${Math.round(ago / 60_000)} minutes`, tone: 'danger' };
    if (ago < 86_400_000) return { text: `Overdue by ${Math.round(ago / 3_600_000)} hours`, tone: 'danger' };
    const days = Math.round(ago / 86_400_000);
    return { text: `Overdue by ${days} day${days === 1 ? '' : 's'}`, tone: 'danger' };
  }
  if (ms < 3_600_000) return { text: `Due in ${Math.max(1, Math.round(ms / 60_000))} minutes`, tone: 'warning' };
  if (ms < 48 * 3_600_000) {
    const hours = Math.round(ms / 3_600_000);
    if (hours < 24) return { text: `Due in ${hours} hour${hours === 1 ? '' : 's'}`, tone: 'warning' };
    return { text: 'Due in 1 day', tone: 'warning' };
  }
  const days = Math.round(ms / 86_400_000);
  if (days <= 7) return { text: `Due in ${days} days`, tone: 'ok' };
  return { text: `Due ${formatShortDateTime(due)}`, tone: 'ok' };
}

export function earlyOrLate(submittedAt: number, due: Date): string {
  const ms = due.getTime() - submittedAt;
  if (Math.abs(ms) < 60_000) return 'Submitted on time';
  if (ms > 0) {
    const days = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    if (days > 0) return `Submitted ${days} day${days === 1 ? '' : 's'} early`;
    return `Submitted ${hours} hour${hours === 1 ? '' : 's'} early`;
  }
  const late = -ms;
  const days = Math.floor(late / 86_400_000);
  const hours = Math.floor((late % 86_400_000) / 3_600_000);
  if (days > 0) return `Submitted ${days} day${days === 1 ? '' : 's'} late`;
  return `Submitted ${hours} hour${hours === 1 ? '' : 's'} late`;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || 'there';
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
