import type { QuizQuestion } from './types';
import raw from './quizzes.json';

export const QUIZZES: Record<string, QuizQuestion[]> = raw as unknown as Record<string, QuizQuestion[]>;

/** weekIndex is 1-based within the unit (matches quiz-bank keys). */
export function getQuiz(unitId: string, weekIndex1Based: number): QuizQuestion[] | undefined {
  return QUIZZES[`${unitId}-${weekIndex1Based}`];
}
