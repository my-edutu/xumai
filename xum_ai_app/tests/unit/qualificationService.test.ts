import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQualificationAttempt, parseQualificationResult } from '../../src/services/qualificationModel';

const base = {
  attempt_id: 'test-attempt',
  expires_at: '2026-10-13T18:00:00Z',
  question_count: 10,
  questions: Array.from({ length:10 }, (_,i)=>({
    id: String(i+1), position:i+1, prompt:'Choose the correct training example',
    options:{A:'Option A',B:'Option B',C:'Option C',D:'Option D'},
  })),
};

test('valid ten-question exam is shown without key', () => {
  const result = parseQualificationAttempt(base);
  assert.equal('attempt_id' in result && result.attempt_id, 'test-attempt');
});

test('missing question or leaked answer key rejects the entire exam', () => {
  assert.throws(()=>parseQualificationAttempt({...base,questions:base.questions.slice(1)}));
  assert.throws(()=>parseQualificationAttempt({...base,questions:[
    {...base.questions[0],correct_choice:'A'},...base.questions.slice(1)]}));
});

test('duplicates and malformed grading fail closed', () => {
  assert.throws(()=>parseQualificationAttempt({...base,questions:[base.questions[0],base.questions[0],...base.questions.slice(2)]}));
  assert.throws(()=>parseQualificationResult({status:'graded',attempt_id:'id',total:10,correct:11,accuracy_percent:110}));
});

test('closed qualification emits clear unavailability', () => {
  const data=parseQualificationAttempt({status:'unavailable',reason:'QUESTION_BANK_UNAVAILABLE'});
  assert.equal(data.status,'unavailable');
});
