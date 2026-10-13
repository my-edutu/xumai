/**
 * Render-only contract for XUM's read-only monetization status RPC.
 *
 * Important: this is NOT an authorization decision. Rewards and withdrawals
 * must be gated by the future backend ledger, identity bridge and payout API.
 * Never fabricate progress or balances when verified evidence is unavailable.
 */

export const REQUIREMENT_TITLES: Readonly<Record<string, string>> = {
  account_active: 'Account active',
  minimum_age_verified: 'Age verified (18+)',
  email_verified: 'Email verified',
  phone_verified: 'Phone verified',
  profile_complete: 'Profile complete',
  academy_complete: 'XUM training completed',
  qualification_tasks: 'Qualification assessments',
  qualification_accuracy: 'Qualification accuracy',
  approved_contributions: 'Approved contributions',
  terms_accepted: 'Contributor terms accepted',
  dataset_license_accepted: 'Data rights agreement accepted',
  no_serious_policy_violations: 'Policy compliance',
  no_unresolved_duplicate_flags: 'Duplicate checks clear',
  no_unresolved_fraud_flags: 'Integrity checks clear',
};

export interface MonetizationRequirementDisplay {
  key: string;
  title: string;
  passed: boolean;
  observed: number | boolean | string | null;
  target: number | boolean | string | null;
}
export interface MonetizationCenterSnapshot {
  status: 'not_monetized' | 'eligible';
  reason: string;
  programAvailable: boolean;
  /** Undefined until the server supplies a trusted assessment. */
  progressPercent: number | null;
  checks: MonetizationRequirementDisplay[];
  unmet: string[];
  checkedAt: string | null;
  policyVersionId: string | null;
  canWithdraw: false;
}
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;

const atom = (v: unknown): string | number | boolean | null =>
  v === null || typeof v === 'string' || typeof v === 'boolean' ||
  (typeof v === 'number' && Number.isFinite(v)) ? v as string | number | boolean | null : null;

export function emptyMonetizationSnapshot(reason = 'SERVICE_UNAVAILABLE'): MonetizationCenterSnapshot {
  return {
    status: 'not_monetized', reason, programAvailable: false,
    progressPercent: null, checks: [], unmet: [], checkedAt: null,
    policyVersionId: null, canWithdraw: false,
  };
}

export function parseMonetizationSnapshot(value: unknown): MonetizationCenterSnapshot {
  const input = record(value);
  if (!input) return emptyMonetizationSnapshot('INVALID_RESPONSE');
  const available = input.program_available === true;
  if (!available) return emptyMonetizationSnapshot(
    typeof input.reason === 'string' ? input.reason : 'PROGRAM_DISABLED'
  );
  const rawChecks = Array.isArray(input.checks) ? input.checks : [];
  const checks: MonetizationRequirementDisplay[] = [];
  const seen = new Set<string>();
  for (const raw of rawChecks) {
    const item = record(raw);
    if (!item || typeof item.requirement !== 'string' ||
        !Object.prototype.hasOwnProperty.call(REQUIREMENT_TITLES, item.requirement) ||
        typeof item.passed !== 'boolean' || seen.has(item.requirement)) continue;
    seen.add(item.requirement);
    checks.push({
      key: item.requirement,
      title: REQUIREMENT_TITLES[item.requirement],
      passed: item.passed,
      observed: atom(item.observed),
      target: atom(item.target),
    });
  }
  const fromServer = input.status === 'eligible' && checks.length > 0 &&
    checks.every(c => c.passed) && input.reason === 'ASSESSED';
  const validatedAssessment = input.reason === 'ASSESSED' && checks.length > 0;
  const unmet = validatedAssessment
    ? checks.filter(c => !c.passed).map(c => c.key)
    : [];
  return {
    status: fromServer ? 'eligible' : 'not_monetized',
    reason: typeof input.reason === 'string' ? input.reason : 'ASSESSMENT_PENDING',
    programAvailable: true,
    progressPercent: validatedAssessment
      ? Math.round(checks.filter(c => c.passed).length / checks.length * 100) : null,
    checks: validatedAssessment ? checks : [],
    unmet,
    checkedAt: typeof input.checked_at === 'string' ? input.checked_at : null,
    policyVersionId: typeof input.policy_version_id === 'string' ? input.policy_version_id : null,
    canWithdraw: false,
  };
}
