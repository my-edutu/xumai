import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessMonetizationEligibility,
  V1_ELIGIBILITY_POLICY,
  type VerifiedEligibilityEvidence,
} from '../../../supabase/functions/shared/monetization-policy';

const validEvidence: VerifiedEligibilityEvidence = {
  accountActive: true,
  verifiedAgeYears: 18,
  ageEvidenceVerified: true,
  emailVerified: true,
  phoneVerified: true,
  profileCompletenessPercent: 80,
  academyCompleted: true,
  gradedQualificationTasks: 10,
  qualificationAccuracyPercent: 80,
  approvedContributions: 10,
  acceptedTermsVersion: 'v1',
  acceptedDatasetLicenseVersion: 'v1',
  unresolvedSeriousPolicyViolations: 0,
  unresolvedDuplicateFlags: 0,
  unresolvedHighRiskFraudFlags: 0,
};

const assess = (overrides: Partial<VerifiedEligibilityEvidence> = {}) =>
  assessMonetizationEligibility({ ...validEvidence, ...overrides }, V1_ELIGIBILITY_POLICY);

test('eligible at each exact V1 threshold without activation or payout', () => {
  const result = assess();
  assert.equal(result.state, 'eligible');
  assert.equal(result.qualified, true);
  assert.deepEqual(result.unmet, []);
  assert.equal(result.progressPercent, 100);
});

test('signup without verified evidence fails closed', () => {
  const e = Object.fromEntries(Object.keys(validEvidence).map(key => [key, null])) as unknown as VerifiedEligibilityEvidence;
  const result = assessMonetizationEligibility(e, V1_ELIGIBILITY_POLICY);
  assert.equal(result.state, 'not_monetized');
  assert.ok(result.unmet.includes('minimum_age_verified'));
  assert.ok(result.unmet.includes('qualification_accuracy'));
  assert.ok(result.unmet.includes('no_unresolved_fraud_flags'));
});

test('below-threshold performance cannot qualify', () => {
  const result = assess({
    profileCompletenessPercent: 79,
    gradedQualificationTasks: 9,
    qualificationAccuracyPercent: 79,
    approvedContributions: 9,
  });
  assert.deepEqual(result.unmet, [
    'profile_complete', 'qualification_tasks', 'qualification_accuracy', 'approved_contributions',
  ]);
});

test('a typed phone number does not substitute for verified phone evidence', () => {
  const result = assess({ phoneVerified: false });
  assert.equal(result.qualified, false);
  assert.ok(result.unmet.includes('phone_verified'));
});

test('unknown fraud result blocks eligibility; resolved zero flags passes', () => {
  assert.ok(assess({ unresolvedHighRiskFraudFlags: null }).unmet.includes('no_unresolved_fraud_flags'));
  assert.ok(assess({ unresolvedDuplicateFlags: 1 }).unmet.includes('no_unresolved_duplicate_flags'));
  assert.ok(assess({ unresolvedSeriousPolicyViolations: 1 }).unmet.includes('no_serious_policy_violations'));
  assert.equal(assess().qualified, true);
});

test('outdated consent and unverifiable age block earning qualification', () => {
  const result = assess({ ageEvidenceVerified: false, acceptedTermsVersion: 'old',
    acceptedDatasetLicenseVersion: null });
  assert.ok(result.unmet.includes('minimum_age_verified'));
  assert.ok(result.unmet.includes('terms_accepted'));
  assert.ok(result.unmet.includes('dataset_license_accepted'));
});

test('invalid or misleading numeric scores cannot qualify', () => {
  assert.ok(assess({ qualificationAccuracyPercent: Number.NaN }).unmet.includes('qualification_accuracy'));
  assert.ok(assess({ qualificationAccuracyPercent: 105 }).unmet.includes('qualification_accuracy'));
  assert.ok(assess({ approvedContributions: 10.4 }).unmet.includes('approved_contributions'));
  assert.ok(assess({ unresolvedDuplicateFlags: -1 }).unmet.includes('no_unresolved_duplicate_flags'));
});

test('market-specific rules may not require phone but still enforce all remaining evidence', () => {
  const result = assessMonetizationEligibility(
    { ...validEvidence, phoneVerified: null },
    { ...V1_ELIGIBILITY_POLICY, requireVerifiedPhone: false, id: 'market-without-phone' },
  );
  assert.equal(result.qualified, true);
  assert.equal(result.policyId, 'market-without-phone');
  assert.equal(result.checks.some(x => x.requirement === 'phone_verified'), false);
});
