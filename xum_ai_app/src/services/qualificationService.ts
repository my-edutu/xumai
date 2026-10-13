import { supabase } from '../supabaseClient';

export type Choice = 'A' | 'B' | 'C' | 'D';
export interface QualificationQuestion {
  id: string;
  prompt: string;
  options: Record<Choice, string>;
  position: number;
}
export interface QualificationAttempt {
  attempt_id: string;
  expires_at: string;
  question_count: number;
  questions: QualificationQuestion[];
}
export interface QualificationResult {
  status: 'graded';
  attempt_id: string;
  accuracy_percent: number;
  correct: number;
  total: number;
}
export interface QualificationUnavailability {
  status: 'unavailable';
  reason: string;
}
const choices: Choice[] = ['A','B','C','D'];
const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

export function parseQualificationAttempt(input: unknown): QualificationAttempt | QualificationUnavailability {
  if (!isRecord(input)) throw new Error('Invalid assessment server response.');
  if (input.status === 'unavailable') {
    return { status: 'unavailable', reason: typeof input.reason === 'string' ? input.reason : 'ASSESSMENT_UNAVAILABLE' };
  }
  if (typeof input.attempt_id !== 'string' || typeof input.expires_at !== 'string' ||
      !Number.isInteger(input.question_count) || !Array.isArray(input.questions) ||
      input.questions.length !== input.question_count || input.question_count < 10) {
    throw new Error('Incomplete qualification assessment.');
  }
  const questions = input.questions.map(v => {
    if (!isRecord(v) || typeof v.id !== 'string' || typeof v.prompt !== 'string' ||
        typeof v.position !== 'number' || !isRecord(v.options) ||
        choices.some(key => typeof (v.options as Record<string,unknown>)[key] !== 'string') ||
        Object.keys(v.options).length !== 4 || 'correct_choice' in v) {
      throw new Error('Invalid or unsafe assessment question.');
    }
    return v as unknown as QualificationQuestion;
  });
  if (new Set(questions.map(q => q.id)).size !== questions.length ||
      !Number.isFinite(Date.parse(input.expires_at))) {
    throw new Error('Invalid assessment question set.');
  }
  return {
    attempt_id: input.attempt_id,
    expires_at: input.expires_at,
    question_count: input.question_count as number,
    questions: questions.sort((a,b) => a.position-b.position),
  };
}

export function parseQualificationResult(input: unknown): QualificationResult {
  if (!isRecord(input) || input.status !== 'graded' ||
      typeof input.attempt_id !== 'string' ||
      typeof input.accuracy_percent !== 'number' ||
      typeof input.correct !== 'number' ||
      typeof input.total !== 'number' ||
      !Number.isInteger(input.correct) || !Number.isInteger(input.total) ||
      input.total < 10 || input.correct < 0 || input.correct > input.total ||
      input.accuracy_percent < 0 || input.accuracy_percent > 100) {
    throw new Error('Invalid qualification grading response.');
  }
  return input as unknown as QualificationResult;
}

export const QualificationService = {
  async start(): Promise<QualificationAttempt | QualificationUnavailability> {
    const { data, error } = await supabase.rpc('start_my_qualification_v1');
    if (error) throw new Error(error.message || 'Unable to start qualification.');
    return parseQualificationAttempt(data);
  },
  async submit(attempt: QualificationAttempt, selected: Record<string, Choice>, eventKey: string): Promise<QualificationResult> {
    if (!eventKey || eventKey.length < 12 || Object.keys(selected).length !== attempt.questions.length ||
        attempt.questions.some(q => !choices.includes(selected[q.id]))) {
      throw new Error('Please answer all qualification questions before submitting.');
    }
    const { data, error } = await supabase.rpc('submit_my_qualification_v1', {
      p_attempt_id: attempt.attempt_id,
      p_submission_key: eventKey,
      p_answers: attempt.questions.map(q => ({ question_id: q.id, answer: selected[q.id] })),
    });
    if (error) throw new Error(error.message || 'Unable to submit qualification.');
    return parseQualificationResult(data);
  },
};
