/**
 * XUM Monetization V1 — deterministic qualification assessment.
 *
 * This is a server-side policy building block, NOT a payment authorization
 * endpoint. Only feed verified evidence from trusted database/provider records.
 * An eligibility result is not monetization activation or permission to withdraw.
 *
 * Intentionally no Supabase client/RPC wiring yet: current Clerk subject mapping
 * and legacy wallet/payout paths must be reconciled first.
 */

export type EligibilityRequirement =
  | 'account_active'
  | 'minimum_age_verified'
  | 'email_verified'
  | 'phone_verified'
  | 'profile_complete'
  | 'academy_complete'
  | 'qualification_tasks'
  | 'qualification_accuracy'
  | 'approved_contributions'
  | 'terms_accepted'
  | 'dataset_license_accepted'
  | 'no_serious_policy_violations'
  | 'no_unresolved_duplicate_flags'
  | 'no_unresolved_fraud_flags';

export interface MonetizationPolicy {
  readonly id: string;
  readonly requiredAge: number;
  readonly requireVerifiedPhone: boolean;
  readonly minimumProfilePercent: number;
  readonly minimumQualificationTasks: number;
  readonly minimumQualificationAccuracyPercent: number;
  readonly minimumApprovedContributions: number;
  readonly termsVersion: string;
  readonly datasetLicenseVersion: string;
}

export interface VerifiedEligibilityEvidence {
  readonly accountActive: boolean | null;
  readonly verifiedAgeYears: number | null;
  readonly ageEvidenceVerified: boolean | null;
  readonly emailVerified: boolean | null;
  readonly phoneVerified: boolean | null;
  readonly profileCompletenessPercent: number | null;
  readonly academyCompleted: boolean | null;
  readonly gradedQualificationTasks: number | null;
  readonly qualificationAccuracyPercent: number | null;
  readonly approvedContributions: number | null;
  readonly acceptedTermsVersion: string | null;
  readonly acceptedDatasetLicenseVersion: string | null;
  readonly unresolvedSeriousPolicyViolations: number | null;
  readonly unresolvedDuplicateFlags: number | null;
  readonly unresolvedHighRiskFraudFlags: number | null;
}

export interface EligibilityCheck {
  readonly requirement: EligibilityRequirement;
  readonly passed: boolean;
  readonly observed: number | boolean | string | null;
  readonly target: number | boolean | string;
}

export interface EligibilityAssessment {
  readonly state: 'not_monetized' | 'eligible';
  readonly policyId: string;
  readonly qualified: boolean;
  readonly checks: ReadonlyArray<EligibilityCheck>;
  readonly unmet: ReadonlyArray<EligibilityRequirement>;
  readonly passedCount: number;
  readonly totalCount: number;
  readonly progressPercent: number;
}

export const V1_ELIGIBILITY_POLICY: MonetizationPolicy = Object.freeze({
  id: 'xum-v1-proposed',
  requiredAge: 18,
  requireVerifiedPhone: true,
  minimumProfilePercent: 80,
  minimumQualificationTasks: 10,
  minimumQualificationAccuracyPercent: 80,
  minimumApprovedContributions: 10,
  termsVersion: 'v1',
  datasetLicenseVersion: 'v1',
});

const validThreshold = (value: number | null, target: number): boolean =>
  value !== null && Number.isFinite(value) && value >= 0 && value >= target;

const clearedCount = (count: number | null): boolean =>
  count !== null && Number.isSafeInteger(count) && count === 0;

export function assessMonetizationEligibility(
  evidence: VerifiedEligibilityEvidence,
  policy: MonetizationPolicy,
): EligibilityAssessment {
  const checks: EligibilityCheck[] = [];
  const add = (
    requirement: EligibilityRequirement,
    passed: boolean,
    observed: EligibilityCheck['observed'],
    target: EligibilityCheck['target'],
  ): void => { checks.push({ requirement, passed, observed, target }); };

  add('account_active', evidence.accountActive === true, evidence.accountActive, true);
  add('minimum_age_verified',
      evidence.ageEvidenceVerified === true && validThreshold(evidence.verifiedAgeYears, policy.requiredAge),
      evidence.verifiedAgeYears,
      policy.requiredAge);
  add('email_verified', evidence.emailVerified === true, evidence.emailVerified, true);
  if (policy.requireVerifiedPhone) {
    add('phone_verified', evidence.phoneVerified === true, evidence.phoneVerified, true);
  }
  add('profile_complete',
      validThreshold(evidence.profileCompletenessPercent, policy.minimumProfilePercent) &&
        evidence.profileCompletenessPercent! <= 100,
      evidence.profileCompletenessPercent, policy.minimumProfilePercent);
  add('academy_complete', evidence.academyCompleted === true, evidence.academyCompleted, true);
  add('qualification_tasks',
      Number.isSafeInteger(evidence.gradedQualificationTasks) &&
        validThreshold(evidence.gradedQualificationTasks, policy.minimumQualificationTasks),
      evidence.gradedQualificationTasks, policy.minimumQualificationTasks);
  add('qualification_accuracy',
      validThreshold(evidence.qualificationAccuracyPercent, policy.minimumQualificationAccuracyPercent) &&
        evidence.qualificationAccuracyPercent! <= 100,
      evidence.qualificationAccuracyPercent, policy.minimumQualificationAccuracyPercent);
  add('approved_contributions',
      Number.isSafeInteger(evidence.approvedContributions) &&
        validThreshold(evidence.approvedContributions, policy.minimumApprovedContributions),
      evidence.approvedContributions, policy.minimumApprovedContributions);
  add('terms_accepted',
      evidence.acceptedTermsVersion === policy.termsVersion,
      evidence.acceptedTermsVersion, policy.termsVersion);
  add('dataset_license_accepted',
      evidence.acceptedDatasetLicenseVersion === policy.datasetLicenseVersion,
      evidence.acceptedDatasetLicenseVersion, policy.datasetLicenseVersion);
  add('no_serious_policy_violations',
      clearedCount(evidence.unresolvedSeriousPolicyViolations),
      evidence.unresolvedSeriousPolicyViolations, 0);
  add('no_unresolved_duplicate_flags',
      clearedCount(evidence.unresolvedDuplicateFlags),
      evidence.unresolvedDuplicateFlags, 0);
  add('no_unresolved_fraud_flags',
      clearedCount(evidence.unresolvedHighRiskFraudFlags),
      evidence.unresolvedHighRiskFraudFlags, 0);

  const unmet = checks.filter(check => !check.passed).map(check => check.requirement);
  const passedCount = checks.length - unmet.length;
  const qualified = unmet.length === 0;

  return {
    state: qualified ? 'eligible' : 'not_monetized',
    policyId: policy.id,
    qualified,
    checks,
    unmet,
    passedCount,
    totalCount: checks.length,
    progressPercent: checks.length ? Math.round((passedCount / checks.length) * 100) : 0,
  };
}
