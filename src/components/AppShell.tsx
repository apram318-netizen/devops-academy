import { useEffect, useMemo, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  Bell,
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
} from 'lucide-preact';
import { useStore } from '../state/store';
import { parseHash, type Route } from '../router';
import { upcomingDeadlines, activityHref } from '../lib/activities';
import { currentProgramWeek, relativeDue } from '../lib/dates';
import { isDone } from '../lib/completion';
import { UNITS, unitColor } from '../data/curriculum';
import { unitProgressPercent } from '../lib/grades';
import { IconBtn } from './ui';
import { CourseIndex, courseUnitFromRoute } from './CourseIndex';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function routeTitle(route: Route): string {
  switch (route.name) {
    case 'dashboard':
      return 'Dashboard';
    case 'courses':
      return 'My courses';
    case 'calendar':
      return 'Calendar';
    case 'grades':
      return 'Grades';
    case 'settings':
      return 'Settings';
    case 'programWeek':
      return `Week ${route.week}`;
    case 'course':
    case 'week':
    case 'notes':
    case 'lab':
    case 'quiz':
    case 'assessment':
    case 'unitGrades':
    case 'guide':
      return UNITS.find((u) => u.id === route.unit)?.code ?? 'Course';
    default:
      return 'DevOps Academy';
  }
}

export function AppShell({
  route,
  children,
}: {
  route: Route;
  children: ComponentChildren;
}) {
  const { state, saveStatus, saveError, folderNeedsReconnect, cloudReady, exportBackup, reconnectFolder } =
    useStore();
  const [navOpen, setNavOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const courseUnit = courseUnitFromRoute(route);
  const inCourse = Boolean(courseUnit);

  useEffect(() => {
    const theme = state.prefs.theme;
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [state.prefs.theme]);

  useEffect(() => {
    setNavOpen(false);
  }, [route]);

  const dueItems = useMemo(() => {
    const now = new Date();
    return upcomingDeadlines(state.prefs.start, now, 7)
      .filter(({ activity }) => {
        if (isDone(state, activity.id)) return false;
        if (activity.kind === 'assignment' || activity.kind === 'exam') {
          if (state.subs[activity.id]?.status === 'submitted') return false;
        }
        return true;
      })
      .slice(0, 12);
  }, [state]);

  const overdueOrDue = dueItems.filter(({ due }) => due.getTime() - Date.now() < 7 * 86400000);
  const bellCount = overdueOrDue.length;
  const week = currentProgramWeek(state.prefs.start) || 1;

  const primaryNav = [
    { href: '#/', label: 'Dashboard', icon: LayoutDashboard, active: route.name === 'dashboard' },
    {
      href: '#/courses',
      label: 'My courses',
      icon: BookOpen,
      active: route.name === 'courses' || inCourse,
    },
    { href: '#/calendar', label: 'Calendar', icon: CalendarDays, active: route.name === 'calendar' },
    { href: '#/grades', label: 'Grades', icon: GraduationCap, active: route.name === 'grades' },
    { href: '#/settings', label: 'Preferences', icon: SettingsIcon, active: route.name === 'settings' },
  ];

  const myCourses = useMemo(() => {
    return UNITS.filter((u) => !state.ui.hidden.includes(u.id)).map((u) => ({
      ...u,
      pct: unitProgressPercent(state, u.id),
    }));
  }, [state]);

  const saveLabel =
    saveStatus === 'cloud'
      ? cloudReady
        ? 'Live sync on'
        : 'Saved to cloud'
      : saveStatus === 'folder' && state.storage.folderName
        ? `Saved to folder: ${state.storage.folderName}`
        : saveStatus === 'error'
          ? 'Not saving'
          : 'Saved to this browser';

  const shellClass = ['shell', navCollapsed ? 'shell-nav-collapsed' : '', inCourse ? 'shell-in-course' : '']
    .filter(Boolean)
    .join(' ');

  const sidebar = (
    <>
      <div class="nav-brand">
        <a class="topbar-brand" href="#/" onClick={() => setNavOpen(false)}>
          <span class="logo-mark">
            <GraduationCap size={14} strokeWidth={1.75} color="white" />
          </span>
          {!navCollapsed && <span>DevOps Academy</span>}
        </a>
      </div>

      {!inCourse && (
        <nav class="nav-primary" aria-label="Site">
          {primaryNav.map((n) => {
            const Icon = n.icon;
            return (
              <a
                key={n.href}
                href={n.href}
                class={`nav-item ${n.active ? 'active' : ''}`}
                title={n.label}
                onClick={() => setNavOpen(false)}
              >
                <Icon size={18} strokeWidth={1.75} />
                {!navCollapsed && <span>{n.label}</span>}
              </a>
            );
          })}
        </nav>
      )}

      {!navCollapsed && !inCourse && (
        <>
          <div class="nav-section-label">My courses</div>
          <div class="nav-courses">
            {myCourses.map((u) => (
              <a
                key={u.id}
                href={`#/course/${u.id}`}
                class="nav-course"
                onClick={() => setNavOpen(false)}
              >
                <span class="nav-course-dot" style={{ background: unitColor(u.code) }} />
                <span class="nav-course-body">
                  <span class="nav-course-code">{u.code}</span>
                  <span class="nav-course-name">{u.name}</span>
                </span>
                <span class="nav-course-pct">{u.pct}%</span>
              </a>
            ))}
          </div>
        </>
      )}

      {!navCollapsed && inCourse && courseUnit && (
        <div class="nav-course-panel">
          <CourseIndex
            unitId={courseUnit}
            route={route}
            showBack
            onNavigate={() => setNavOpen(false)}
          />
        </div>
      )}

      {navCollapsed && inCourse && (
        <nav class="nav-primary" aria-label="Course shortcuts">
          <a class="nav-item" href="#/courses" title="My courses" onClick={() => setNavOpen(false)}>
            <BookOpen size={18} strokeWidth={1.75} />
          </a>
          <a
            class="nav-item active"
            href={`#/course/${courseUnit}`}
            title="Course home"
            onClick={() => setNavOpen(false)}
          >
            <GraduationCap size={18} strokeWidth={1.75} />
          </a>
        </nav>
      )}

      <div class="nav-footer">
        <button
          type="button"
          class="nav-collapse-btn"
          onClick={() => setNavCollapsed((v) => !v)}
          aria-label={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {navCollapsed ? <PanelLeftOpen size={18} strokeWidth={1.75} /> : <PanelLeftClose size={18} strokeWidth={1.75} />}
          {!navCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <div class={shellClass}>
      <aside class={`site-nav ${navOpen ? 'open' : ''}`} aria-label="Site navigation">
        {sidebar}
      </aside>
      {navOpen && (
        <button type="button" class="nav-backdrop" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
      )}

      <div class="shell-main">
        <header class="topbar">
          <IconBtn label="Open navigation" class="menu-toggle" onClick={() => setNavOpen(true)}>
            <Menu size={20} strokeWidth={1.75} />
          </IconBtn>
          <div class="topbar-context">
            <div class="topbar-page">{routeTitle(route)}</div>
            {week > 0 && route.name === 'dashboard' && (
              <div class="topbar-meta">Week {week} of 30</div>
            )}
            {state.storage.cloud.enabled && (
              <div class="topbar-meta">Cloud sync on</div>
            )}
          </div>
          <div class="topbar-right">
            <div style={{ position: 'relative' }}>
              <IconBtn label="Notifications" onClick={() => setBellOpen((v) => !v)}>
                <Bell size={20} strokeWidth={1.75} />
                {bellCount > 0 && <span class="bell-count">{bellCount > 9 ? '9+' : bellCount}</span>}
              </IconBtn>
              {bellOpen && (
                <div class="menu" style={{ right: 0, width: 320 }} role="dialog" aria-label="Due soon">
                  {overdueOrDue.length === 0 ? (
                    <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>
                      Nothing due in the next 7 days
                    </div>
                  ) : (
                    overdueOrDue.slice(0, 8).map(({ activity, due }) => {
                      const rel = relativeDue(due);
                      return (
                        <a
                          key={activity.id}
                          href={activityHref(activity)}
                          onClick={() => setBellOpen(false)}
                          style={{
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            height: 'auto',
                            padding: '10px',
                          }}
                        >
                          <span>{activity.title}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {activity.unitCode} · {rel.text}
                          </span>
                        </a>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <a class="avatar" href="#/settings" aria-label="Preferences">
              {initials(state.prefs.name)}
            </a>
          </div>
        </header>

        {saveError && (
          <div class="banner banner-danger">
            Could not save your progress. {saveError}
            <button type="button" class="btn btn-ghost" style={{ height: 28, color: 'inherit' }} onClick={() => void exportBackup()}>
              Export backup
            </button>
          </div>
        )}
        {folderNeedsReconnect && (
          <div class="banner banner-info">
            Folder sync paused.
            <button type="button" class="btn btn-ghost" style={{ height: 28, color: 'inherit' }} onClick={() => void reconnectFolder()}>
              Reconnect folder
            </button>
          </div>
        )}
        <div class="shell-body">
          <main class="shell-content">{children}</main>
        </div>

        <footer class="footer">
          <span aria-live="polite">
            <span class={`save-dot ${saveStatus === 'error' ? 'error' : ''}`} />
            {saveLabel}
          </span>
          <a href="#/settings">Preferences</a>
        </footer>
      </div>
    </div>
  );
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash());
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}
