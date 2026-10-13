import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, Text, TouchableOpacity, View, StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { QualificationExam } from '../components/QualificationExam';
import { useTheme } from '../context/ThemeContext';
import { ScreenName } from '../types';
import { supabase } from '../supabaseClient';
import {
  emptyMonetizationSnapshot, parseMonetizationSnapshot,
  type MonetizationCenterSnapshot,
} from '../services/monetizationCenterModel';

interface Props {
  onNavigate: (screen: ScreenName) => void;
  onBack: () => void;
}

const REASON_LABELS: Readonly<Record<string, string>> = {
  PROGRAM_DISABLED: 'Qualification enrollment is not open yet. Your existing tasks and profile remain accessible.',
  SERVICE_UNAVAILABLE: 'Monetization information could not be loaded. No earnings or withdrawals have been approved.',
  INVALID_RESPONSE: 'The eligibility service returned an unexpected response. Please try again later.',
  IDENTITY_UNVERIFIED: 'Your account identity still needs backend verification before qualification can be assessed.',
  ASSESSMENT_PENDING: 'Your verified qualification assessment is not available yet.',
  ASSESSED: 'This result is based on the latest verified server-side assessment.',
};

export const MonetizationCenterScreen: React.FC<Props> = ({ onNavigate, onBack }) => {
  const { theme } = useTheme();
  const [snapshot, setSnapshot] = useState<MonetizationCenterSnapshot>(emptyMonetizationSnapshot('PROGRAM_DISABLED'));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (active?: () => boolean) => {
    setLoading(true);
    try {
      // Backend resolves the signed-in Clerk subject. Never send an arbitrary
      // contributor ID, pass qualification evidence, or compute eligibility here.
      const { data, error } = await supabase.rpc('get_my_monetization_status_v1');
      if (active && !active()) return;
      setSnapshot(error ? emptyMonetizationSnapshot('SERVICE_UNAVAILABLE') : parseMonetizationSnapshot(data));
    } catch {
      if (!active || active()) setSnapshot(emptyMonetizationSnapshot('SERVICE_UNAVAILABLE'));
    } finally {
      if (!active || active()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void load(() => mounted);
    return () => { mounted = false; };
  }, [load]);

  const enrolled = snapshot.programAvailable;
  const isEligible = snapshot.status === 'eligible' && enrolled;
  const explanation = REASON_LABELS[snapshot.reason] ?? REASON_LABELS.ASSESSMENT_PENDING;
  const summary = isEligible ? 'Eligibility confirmed — earning activation pending'
    : enrolled ? 'Your monetization qualification' : 'Monetization enrollment is not open';
  const statusColor = isEligible ? theme.success : theme.warning;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.heading, { color: theme.text }]}>Monetization Center</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh eligibility"
          onPress={() => void load()} style={styles.iconButton} disabled={loading}>
          <MaterialIcons name="refresh" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.eyebrow}>
            <MaterialIcons name="verified-user" size={18} color={statusColor} />
            <Text style={[styles.eyebrowText, { color: statusColor }]}>
              {isEligible ? 'ELIGIBLE · ACTIVATION PENDING' : enrolled ? 'NOT YET QUALIFIED' : 'COMING SOON'}
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>{summary}</Text>
          {loading ? (
            <ActivityIndicator accessibilityLabel="Loading monetization status" color={theme.primary} style={styles.loader} />
          ) : (
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>{explanation}</Text>
          )}
          {snapshot.progressPercent !== null && !loading && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.between}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>Verified requirements completed</Text>
                <Text style={{ color: theme.text, fontWeight: '700' }}>{snapshot.progressPercent}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${snapshot.progressPercent}%`, backgroundColor: theme.primary }]} />
              </View>
            </View>
          )}
          {snapshot.checkedAt && (
            <Text style={[styles.caption, { color: theme.textTertiary }]}>Last assessed: {new Date(snapshot.checkedAt).toLocaleString()}</Text>
          )}
        </View>

        <Text style={[styles.sectionHeading, { color: theme.text }]}>Qualification checklist</Text>
        {snapshot.checks.length > 0 ? snapshot.checks.map(item => (
          <View key={item.key} style={[styles.requirement, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name={item.passed ? 'check-circle' : 'radio-button-unchecked'}
              size={23} color={item.passed ? theme.success : theme.textTertiary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>{item.title}</Text>
              {item.observed !== null && item.target !== null && (
                <Text style={[styles.caption, { color: theme.textSecondary }]}>
                  {String(item.observed)} / {String(item.target)} {item.passed ? '· Verified' : '· Required'}
                </Text>
              )}
            </View>
          </View>
        )) : (
          <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="hourglass-empty" color={theme.textTertiary} size={27} />
            <Text style={[styles.bodyText, { color: theme.textSecondary, textAlign: 'center' }]}>
              No verified assessment is available yet. A checklist will appear when the secure qualification service is active.
            </Text>
          </View>
        )}

        {!loading && snapshot.checks.length === 0 && (
          <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'stretch' }]}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.text }}>Planned V1 qualification guide</Text>
            <Text style={[styles.caption, { color: theme.textSecondary, lineHeight: 19 }]}>
              These are proposed launch requirements, not a verified assessment of your account:
            </Text>
            {[
              'Be 18+ with verified email and required phone verification',
              'Complete at least 80% of your profile and XUM training',
              'Pass 10 qualification assessments with at least 80% accuracy',
              'Have 10 approved contributions and current data-rights consent',
              'Clear outstanding serious policy, fraud and duplicate reviews',
            ].map(point => (
              <View key={point} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 8 }}>
                <MaterialIcons name="info-outline" size={16} color={theme.primary} />
                <Text style={{ flex: 1, fontSize: 12, lineHeight: 19, color: theme.textSecondary }}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        <QualificationExam enabled={snapshot.programAvailable && !loading}
          onCompleted={() => { void load(); }} />

        <Text style={[styles.sectionHeading, { color: theme.text }]}>Your earnings</Text>
        <View style={styles.grid}>
          {['Pending', 'Available', 'On Hold', 'Withdrawn'].map(label => (
            <View key={label} style={[styles.balanceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.caption, { color: theme.textSecondary }]}>{label}</Text>
              <Text style={[styles.balanceUnavailable, { color: theme.text }]}>Not available</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
          Verified ledger balances and withdrawals will appear when the financial service is connected. No amount is estimated from task activity or your legacy wallet.
        </Text>
        <View style={[styles.callout, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <MaterialIcons name="lock-outline" color={theme.textSecondary} size={24} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 4 }}>Withdrawals are not enabled here</Text>
            <Text style={[styles.bodyText, { color: theme.textSecondary }]}>
              Eligibility is not payment approval. Payouts require a verified ledger, identity checks and a separate secure activation.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          accessibilityRole="button" onPress={() => onNavigate(ScreenName.TASK_MARKETPLACE)}>
          <Text style={{ color: theme.textInverse, fontWeight: '700' }}>Explore tasks</Text>
          <MaterialIcons name="arrow-forward" color={theme.textInverse} size={19} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]}
          accessibilityRole="button" onPress={() => onNavigate(ScreenName.SUPPORT)}>
          <Text style={{ color: theme.text, fontWeight: '600' }}>Contact support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { paddingVertical: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  heading: { fontWeight: '800', fontSize: 17, flex: 1, textAlign: 'center' },
  iconButton: { padding: 8, minWidth: 38, alignItems: 'center' },
  content: { padding: 20, paddingBottom: 80, gap: 12 },
  hero: { padding: 20, borderWidth: 1, borderRadius: 18, marginBottom: 8 },
  eyebrow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  eyebrowText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { fontSize: 21, lineHeight: 27, fontWeight: '800', marginBottom: 9 },
  loader: { alignSelf: 'flex-start', marginTop: 10 },
  bodyText: { fontSize: 13, lineHeight: 21 },
  caption: { fontSize: 12, marginTop: 5 },
  sectionHeading: { fontSize: 18, fontWeight: '800', marginTop: 12, marginBottom: 2 },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 8, borderRadius: 10, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 10 },
  requirement: { borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  empty: { borderWidth: 1, borderRadius: 14, padding: 18, alignItems: 'center', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  balanceCard: { width: '48%', flexGrow: 1, borderWidth: 1, borderRadius: 12, padding: 14, minWidth: 135 },
  balanceUnavailable: { fontSize: 14, fontWeight: '700', marginTop: 7 },
  disclaimer: { fontSize: 12, lineHeight: 19 },
  callout: { padding: 16, borderWidth: 1, borderRadius: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  primaryButton: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, borderRadius: 12, paddingVertical: 15 },
  secondaryButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
