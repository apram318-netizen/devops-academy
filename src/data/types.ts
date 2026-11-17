export type Week = {
  t: string;
  topics: string;
  labs: string[];
  notes: string[];
};

export type Unit = {
  id: string;
  code: string;
  name: string;
  sem: number;
  cat: string;
  color: string;
  start: number;
  labWeight: number;
  quizWeight: number;
  summary: string;
  res: [string, string][];
  weeks: Week[];
};

export type Assessment = {
  id: string;
  unit: string;
  n: string;
  title: string;
  due: number;
  weight: number;
  brief: string;
  crit: string[];
  tpl?: boolean;
  exam?: boolean;
  cert?: boolean;
};

export type QuizQuestion = [string, string[], number, string?];
