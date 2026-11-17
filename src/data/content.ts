import type { Unit, Week } from './types';

function splitTopics(topics: string): string[] {
  return topics
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function learningOutcomes(week: Week): string[] {
  return splitTopics(week.topics)
    .slice(0, 6)
    .map((topic) => {
      const clean = topic.replace(/\([^)]*\)/g, '').trim();
      return `Explain and use ${clean}`;
    });
}

export function selfCheckQuestions(week: Week): string[] {
  const topics = splitTopics(week.topics);
  const a = topics[0] ?? "this week's first topic";
  const b = topics[1] ?? topics[0] ?? 'a key concept';
  const c = topics[2] ?? topics[0] ?? 'the main tool';
  const d = topics[3] ?? topics[1] ?? 'the lab technique';
  return [
    `Explain ${a} to a junior engineer with a concrete example from this week.`,
    `What breaks when ${b} is misconfigured, and how would you spot it?`,
    `Write the exact commands you would use for ${c}, and say what each one does.`,
    `What surprised you in the lab when working with ${d}, and why?`,
  ];
}

export function labSteps(
  unitId: string,
  weekIndex1Based: number,
  labTitle: string,
  isCapstoneScenario = false,
): string[] {
  if (isCapstoneScenario) {
    return [
      `Form a hypothesis for: ${labTitle}`,
      'Break the system on purpose in a controlled way',
      'Watch alerts, dashboards, logs and events',
      'Diagnose as if blind (alerts and symptoms only)',
      'Fix the fault and verify recovery',
      'Add a guard: alert, policy or test',
      'Write the postmortem using the template',
    ];
  }
  const folder = `${unitId}-labs/week-${String(weekIndex1Based).padStart(2, '0')}`;
  return [
    `Create the folder \`${folder}\` for this week's work`,
    `Do the lab: ${labTitle}`,
    'Break it on purpose, then fix it and note what you learned',
    'Save evidence (commands, screenshots or output)',
    'Write a short README covering goal, steps and result',
    'Commit your work and submit evidence in this app',
  ];
}

export function postmortemTemplate(): string {
  return `# Postmortem

## Summary
One or two sentences describing the incident.

## Impact
Who or what was affected, and for how long?

## Timeline
| Time | Event |
| --- | --- |
| | |

## Root cause
What made this possible?

## What went well
-

## What went poorly
-

## Where we got lucky
-

## Action items
| Action | Owner | Due |
| --- | --- | --- |
| | | |

## Guards added
Alert, policy or test that would catch this next time.
`;
}

export function estimateHours(week: Week): number {
  const n = splitTopics(week.topics).length;
  return Math.min(12, Math.max(5, 4 + n));
}

export function renderInlineCode(text: string): string {
  return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function weekOverview(week: Week): string {
  const topics = splitTopics(week.topics);
  const focus = topics.slice(0, 3).join(', ');
  return `This week you focus on ${focus || week.t}. Work through the notes first, then the lab, then check yourself with the quiz. Aim to finish evidence before Sunday 11:59 PM.`;
}

export function studyPlan(week: Week): string[] {
  const hours = estimateHours(week);
  const read = Math.max(2, Math.round(hours * 0.35));
  const lab = Math.max(2, Math.round(hours * 0.45));
  const quiz = Math.max(1, hours - read - lab);
  return [
    `Day 1 to 2: read the notes and try every command (${read} hours)`,
    `Day 3 to 5: complete the lab, break it, fix it, and write evidence (${lab} hours)`,
    `Day 6 to 7: finish self-check answers and take the quiz (${quiz} hours)`,
  ];
}

export type StudyResource = { title: string; url: string; why: string };

/** Unit resources plus topic-aware extras for the week. */
export function studyResources(unit: Unit, week: Week): StudyResource[] {
  const base: StudyResource[] = unit.res.map(([title, url]) => ({
    title,
    url,
    why: 'Core reading for this unit',
  }));

  const t = `${week.t} ${week.topics}`.toLowerCase();
  const extras: StudyResource[] = [];

  const add = (title: string, url: string, why: string) => {
    if (!extras.some((e) => e.url === url) && !base.some((e) => e.url === url)) {
      extras.push({ title, url, why });
    }
  };

  if (/linux|bash|shell|filesystem|systemd|ssh|cron|perm/.test(t)) {
    add('Linux man pages', 'https://man7.org/linux/man-pages/', 'Look up exact flags while you practise');
    add('ExplainShell', 'https://explainshell.com/', 'Paste a command to see what each part does');
  }
  if (/network|tcp|udp|dns|http|tls|firewall|vpn|subnet/.test(t)) {
    add('Cloudflare Learning Centre', 'https://www.cloudflare.com/learning/', 'Clear primers on DNS, TLS and HTTP');
    add('Practical Networking', 'https://www.practicalnetworking.net/', 'Subnetting and packet path drills');
  }
  if (/git|docker|python|go|container/.test(t)) {
    add('Docker getting started', 'https://docs.docker.com/get-started/', 'Official container walkthrough');
    add('Pro Git book', 'https://git-scm.com/book/en/v2', 'Deep dive when Git history gets messy');
  }
  if (/aws|iam|vpc|ec2|s3|rds|lambda|cloud/.test(t)) {
    add('AWS Well-Architected', 'https://aws.amazon.com/architecture/well-architected/', 'How production systems are judged');
    add('AWS Free Tier docs', 'https://aws.amazon.com/free/', 'Stay inside free limits while you lab');
  }
  if (/kubernetes|k8s|eks|helm|pod|ingress/.test(t)) {
    add('Kubernetes docs', 'https://kubernetes.io/docs/home/', 'Official reference while you kubectl');
    add('Killercoda', 'https://killercoda.com/', 'Browser labs for CKA-style practice');
  }
  if (/terraform|ansible|iac/.test(t)) {
    add('HashiCorp tutorials', 'https://developer.hashicorp.com/terraform/tutorials', 'Guided Terraform labs');
  }
  if (/ci\/cd|github actions|jenkins|argo|gitops/.test(t)) {
    add('GitHub Actions docs', 'https://docs.github.com/actions', 'Workflow syntax and examples');
  }
  if (/sre|prometheus|grafana|alert|incident|security|observ/.test(t)) {
    add('Google SRE books', 'https://sre.google/books/', 'Free chapters on SLOs and incidents');
  }
  if (/failure|postmortem|chaos|capstone|game day/.test(t)) {
    add('k8s.af failure stories', 'https://k8s.af', 'Real outages to study and write up');
  }

  return [...base, ...extras].slice(0, 8);
}

export function labBrief(labTitle: string, week: Week, isScenario: boolean): {
  summary: string;
  deliverables: string[];
  tips: string[];
} {
  if (isScenario) {
    return {
      summary:
        'Run each failure scenario with the 7-step method. Treat alerts and logs as your only clues, then leave a guard so the same fault cannot silently return.',
      deliverables: [
        'Checklist of completed scenarios',
        'Evidence (commands, screenshots or alert screenshots)',
        'One postmortem per scenario using the template',
      ],
      tips: week.notes.slice(0, 4),
    };
  }
  return {
    summary: `Complete this hands-on lab: ${labTitle}. Work in your lab folder, capture real output, and submit evidence here before the Sunday deadline.`,
    deliverables: [
      'Working solution that matches the lab goal',
      'Evidence files (terminal output, screenshots or short demo clip)',
      'README with what you did, what broke, and how you fixed it',
      'Optional: repo link in the online text box',
    ],
    tips: [
      ...week.notes.slice(0, 3),
      'If something fails, change one variable at a time and write it down.',
    ],
  };
}

export function whatToSubmitLab(): string[] {
  return [
    'Screenshots or pasted command output that prove the lab works',
    'Your README or lab write-up',
    'Links to a repo or gist (optional, in the text box)',
  ];
}
