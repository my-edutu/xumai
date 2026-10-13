import { supabase } from '../supabaseClient';
import { parseQualificationAttempt, parseQualificationResult } from './qualificationModel';
import type { QualificationAttempt, QualificationUnavailability, QualificationResult, Choice } from './qualificationModel';
export * from './qualificationModel';
const choices: Choice[] = ['A','B','C','D'];

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
