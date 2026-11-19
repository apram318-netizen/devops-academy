import { StoreProvider, useStore } from './state/store';
import { AppShell, useRoute } from './components/AppShell';
import { Dashboard } from './views/Dashboard';
import { Courses } from './views/Courses';
import { CourseHome } from './views/CourseHome';
import { WeekView } from './views/WeekView';
import { ProgramWeek } from './views/ProgramWeek';
import { NotesView } from './views/Notes';
import { LabView } from './views/Lab';
import { QuizView } from './views/Quiz';
import { AssessmentView } from './views/Assessment';
import { AllGrades, UnitGrades } from './views/Grades';
import { GuideView } from './views/Guide';
import { CalendarView } from './views/Calendar';
import { Settings } from './views/Settings';
import { ProjectView } from './views/Project';
import { PassphraseGate } from './components/PassphraseGate';

function Router() {
  const route = useRoute();
  const { ready } = useStore();

  if (!ready) {
    return (
      <div class="page">
        <p style={{ color: 'var(--text-muted)' }}>Loading your progress…</p>
      </div>
    );
  }

  let view;
  switch (route.name) {
    case 'dashboard':
      view = <Dashboard />;
      break;
    case 'courses':
      view = <Courses />;
      break;
    case 'course':
      view = <CourseHome unitId={route.unit} tab={route.tab} />;
      break;
    case 'week':
      view = <WeekView unitId={route.unit} week={route.week} />;
      break;
    case 'programWeek':
      view = <ProgramWeek week={route.week} />;
      break;
    case 'notes':
      view = <NotesView unitId={route.unit} week={route.week} />;
      break;
    case 'lab':
      view = <LabView unitId={route.unit} week={route.week} labIndex={route.lab} edit={route.edit} />;
      break;
    case 'quiz':
      view = (
        <QuizView
          unitId={route.unit}
          week={route.week}
          mode={route.mode}
          attemptIndex={route.attempt}
        />
      );
      break;
    case 'assessment':
      view = <AssessmentView unitId={route.unit} assessmentId={route.id} mode={route.mode} />;
      break;
    case 'unitGrades':
      view = <UnitGrades unitId={route.unit} />;
      break;
    case 'guide':
      view = <GuideView unitId={route.unit} />;
      break;
    case 'grades':
      view = <AllGrades />;
      break;
    case 'calendar':
      view = <CalendarView />;
      break;
    case 'settings':
      view = <Settings />;
      break;
    case 'project':
      view = <ProjectView focusTask={route.task} focusPhase={route.phase} />;
      break;
    default:
      view = (
        <div class="page">
          <h1 class="page-title">Page not found</h1>
          <p class="page-sub">
            <a href="#/">Back to dashboard</a>
          </p>
        </div>
      );
  }

  return (
    <>
      <PassphraseGate />
      <AppShell route={route}>{view}</AppShell>
    </>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Router />
    </StoreProvider>
  );
}
