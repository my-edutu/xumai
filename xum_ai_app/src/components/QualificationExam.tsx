import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../context/ThemeContext';
import {
  QualificationService, type Choice, type QualificationAttempt,
  type QualificationResult,
} from '../services/qualificationService';

const OPTIONS: Choice[] = ['A','B','C','D'];
const MESSAGES: Record<string,string> = {
  QUALIFICATION_DISABLED: 'Qualification assessments are not open yet.',
  IDENTITY_UNVERIFIED: 'Your verified account identity must be linked before you can start.',
  QUESTION_BANK_UNAVAILABLE: 'Qualification tasks are being prepared. Please check back later.',
  ATTEMPT_LIMIT: 'You have reached the daily assessment limit. Try again after 24 hours.',
  POLICY_UNAVAILABLE: 'A reviewed qualification policy is not available yet.',
  ASSESSMENT_UNAVAILABLE: 'Qualification is temporarily unavailable.',
};

interface Props { enabled: boolean; onCompleted: () => void; }
export const QualificationExam: React.FC<Props> = ({ enabled, onCompleted }) => {
  const { theme } = useTheme();
  const [attempt, setAttempt] = useState<QualificationAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [result, setResult] = useState<QualificationResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submissionKey, setSubmissionKey] = useState<string | null>(null);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await QualificationService.start();
      if (response.status === 'unavailable') {
        setNotice(MESSAGES[response.reason] || 'Qualification cannot be started yet.');
        return;
      }
      setResult(null);
      setAttempt(response);
      setAnswers({});
      setSubmissionKey(null);
    } catch {
      setNotice('Unable to reach the secure qualification service. Please try again later.');
    } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!attempt || busy || Object.keys(answers).length !== attempt.questions.length) return;
    setBusy(true);
    setNotice(null);
    const key = submissionKey ?? Crypto.randomUUID();
    setSubmissionKey(key);
    try {
      const graded = await QualificationService.submit(attempt, answers, key);
      setResult(graded);
      setAttempt(null);
      setSubmissionKey(null);
      onCompleted();
    } catch {
      setNotice('Your answers could not be submitted. Please retry without changing them, or contact support if the attempt expired.');
    } finally { setBusy(false); }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.titleRow}>
        <MaterialIcons name="school" size={23} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>XUM Qualification Assessment</Text>
      </View>
      {result ? (
        <View style={styles.stack}>
          <Text style={[styles.result, { color: theme.text }]}>{result.accuracy_percent}% accuracy</Text>
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            {result.correct} of {result.total} answers correct. Your verified score has been recorded.
            This assessment does not automatically approve earnings or unlock withdrawals.
          </Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => void start()}
            disabled={!enabled || busy} style={[styles.action, { backgroundColor: theme.primary }]}>
            <Text style={{ color: theme.textInverse, fontWeight: '700' }}>Try another assessment</Text>
          </TouchableOpacity>
        </View>
      ) : attempt ? (
        <View style={styles.stack}>
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            {attempt.question_count} questions · Submit before {new Date(attempt.expires_at).toLocaleTimeString()}.
            Your answers are graded securely. Assessment work is not paid.
          </Text>
          {attempt.questions.map((question, i) => (
            <View key={question.id} style={[styles.question, { borderColor: theme.border }]}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                {i+1}. {question.prompt}
              </Text>
              {OPTIONS.map(option => (
                <TouchableOpacity key={option} accessibilityRole="radio"
                  accessibilityState={{ selected: answers[question.id] === option }}
                  onPress={() => setAnswers(current => ({ ...current, [question.id]: option }))}
                  disabled={busy}
                  style={[styles.option, {
                    borderColor: answers[question.id] === option ? theme.primary : theme.border,
                    backgroundColor: answers[question.id] === option ? theme.surfaceHighlight : theme.surface,
                  }]}>
                  <MaterialIcons name={answers[question.id] === option ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={20} color={answers[question.id] === option ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.optionText, { color: theme.text }]}>
                    {option}. {question.options[option]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            Answered {Object.keys(answers).length} / {attempt.question_count}
          </Text>
          <TouchableOpacity accessibilityRole="button" disabled={busy || Object.keys(answers).length !== attempt.question_count}
            onPress={() => void submit()} style={[styles.action, {
              backgroundColor: theme.primary,
              opacity: busy || Object.keys(answers).length !== attempt.question_count ? 0.55 : 1,
            }]}>
            <Text style={{ color: theme.textInverse, fontWeight: '800' }}>Submit assessment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.stack}>
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            Pass the verified qualification exercise to build your contributor score.
            Qualified work and withdrawals are separate from this training.
          </Text>
          <TouchableOpacity accessibilityRole="button" disabled={!enabled || busy}
            onPress={() => void start()} style={[styles.action, {
              backgroundColor: theme.primary, opacity: !enabled || busy ? 0.5 : 1,
            }]}>
            {busy ? <ActivityIndicator color={theme.textInverse} /> :
              <Text style={{ color: theme.textInverse, fontWeight: '800' }}>
                {enabled ? 'Start qualification assessment' : 'Assessment not open yet'}
              </Text>}
          </TouchableOpacity>
        </View>
      )}
      {notice && (
        <View style={[styles.notice, { borderColor: theme.border }]}>
          <MaterialIcons name="info-outline" size={19} color={theme.warning} />
          <Text style={{ flex: 1, color: theme.textSecondary, fontSize: 13, lineHeight: 20 }}>{notice}</Text>
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 18, borderRadius: 18, marginTop: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 17, fontWeight: '800', flex: 1 },
  stack: { gap: 12, marginTop: 14 },
  note: { fontSize: 12, lineHeight: 20 },
  question: { borderWidth: 1, padding: 13, borderRadius: 12, gap: 9 },
  questionTitle: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  option: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionText: { fontSize: 13, lineHeight: 19, flex: 1 },
  action: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  result: { fontSize: 24, fontWeight: '800' },
  notice: { flexDirection: 'row', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12 },
});
