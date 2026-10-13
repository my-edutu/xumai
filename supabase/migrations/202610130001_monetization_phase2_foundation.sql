-- XUM AI Monetization Phase 2: restricted staging-first foundation
-- IMPORTANT: DO NOT append this to supabase/apply_all.sql or execute against
-- production until Clerk subject mapping, RLS and financial path gates are tested.
-- This migration does not authorize qualification, earnings or withdrawals.
BEGIN;

CREATE SCHEMA IF NOT EXISTS xum_monetization;
REVOKE ALL ON SCHEMA xum_monetization FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA xum_monetization TO service_role;

-- Keep Clerk's string "sub" separate from the legacy users/auth.users UUID.
-- Only a trusted backend can create links after checking both identities.
CREATE TABLE IF NOT EXISTS xum_monetization.contributor_identity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_subject TEXT NOT NULL UNIQUE
        CHECK (clerk_subject ~ '^user_[A-Za-z0-9]+$'),
    legacy_user_id UUID UNIQUE,
    link_state TEXT NOT NULL DEFAULT 'pending'
        CHECK (link_state IN ('pending', 'verified', 'blocked')),
    verification_source TEXT,
    verification_reference TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        link_state <> 'verified' OR
        (legacy_user_id IS NOT NULL AND verified_at IS NOT NULL
         AND nullif(btrim(verification_source), '') IS NOT NULL
         AND nullif(btrim(verification_reference), '') IS NOT NULL)
    )
);

-- A single, operator-controlled switch; NOTHING is enabled on migration.
CREATE TABLE IF NOT EXISTS xum_monetization.program_controls (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    identity_bridge_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    qualification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    earnings_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    withdrawals_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (NOT qualification_enabled OR identity_bridge_enabled),
    CHECK (NOT earnings_enabled OR qualification_enabled),
    CHECK (NOT withdrawals_enabled OR earnings_enabled),
    -- Deliberate launch interlock: requires a FUTURE reviewed migration
    -- to remove after identity, balanced ledger and payout settlement QA.
    CONSTRAINT xum_financial_features_locked CHECK (
        earnings_enabled = FALSE AND withdrawals_enabled = FALSE
    )
);
INSERT INTO xum_monetization.program_controls(singleton) VALUES (TRUE)
ON CONFLICT (singleton) DO NOTHING;

-- Write-once versions; new terms/thresholds require a NEW record.
CREATE TABLE IF NOT EXISTS xum_monetization.policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_key TEXT NOT NULL UNIQUE CHECK (length(policy_key) BETWEEN 3 AND 100),
    country TEXT NOT NULL DEFAULT '*' CHECK (country = '*' OR country ~ '^[A-Z]{2}$'),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    minimum_age SMALLINT NOT NULL DEFAULT 18 CHECK (minimum_age BETWEEN 18 AND 120),
    minimum_profile_percent SMALLINT NOT NULL DEFAULT 80 CHECK (minimum_profile_percent BETWEEN 0 AND 100),
    minimum_qualification_tasks INTEGER NOT NULL DEFAULT 10 CHECK (minimum_qualification_tasks > 0),
    minimum_qualification_accuracy SMALLINT NOT NULL DEFAULT 80 CHECK (minimum_qualification_accuracy BETWEEN 0 AND 100),
    minimum_approved_contributions INTEGER NOT NULL DEFAULT 10 CHECK (minimum_approved_contributions >= 0),
    require_email_verification BOOLEAN NOT NULL DEFAULT TRUE,
    require_phone_verification BOOLEAN NOT NULL DEFAULT TRUE,
    require_academy BOOLEAN NOT NULL DEFAULT TRUE,
    terms_version TEXT NOT NULL CHECK (length(terms_version) BETWEEN 1 AND 100),
    dataset_license_version TEXT NOT NULL CHECK (length(dataset_license_version) BETWEEN 1 AND 100),
    effective_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT,
    CHECK (status <> 'published' OR effective_at IS NOT NULL)
);
INSERT INTO xum_monetization.policy_versions
    (policy_key,country,terms_version,dataset_license_version)
VALUES ('xum-v1-proposed','*','v1','v1')
ON CONFLICT (policy_key) DO NOTHING;

-- Independent, restricted provenance entries, not self-attested profile input.
CREATE TABLE IF NOT EXISTS xum_monetization.verified_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_link_id UUID NOT NULL REFERENCES xum_monetization.contributor_identity_links(id),
    signal TEXT NOT NULL CHECK (signal ~ '^[a-z][a-z0-9_]{2,63}$'),
    signal_value JSONB NOT NULL,
    provenance TEXT NOT NULL CHECK (length(btrim(provenance)) >= 3),
    evidence_reference TEXT NOT NULL CHECK (length(btrim(evidence_reference)) >= 3),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (expires_at IS NULL OR expires_at > verified_at)
);
CREATE INDEX IF NOT EXISTS idx_xum_verified_evidence_link
 ON xum_monetization.verified_evidence(identity_link_id,signal,verified_at DESC);

-- Decisions are auditable snapshots, not an authorization to post earnings.
CREATE TABLE IF NOT EXISTS xum_monetization.eligibility_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_link_id UUID NOT NULL REFERENCES xum_monetization.contributor_identity_links(id),
    policy_version_id UUID NOT NULL REFERENCES xum_monetization.policy_versions(id),
    eligibility TEXT NOT NULL CHECK (eligibility IN ('not_monetized','eligible')),
    requirement_results JSONB NOT NULL CHECK (jsonb_typeof(requirement_results) = 'array'),
    unmet_requirements JSONB NOT NULL CHECK (jsonb_typeof(unmet_requirements) = 'array'),
    evidence_digest TEXT NOT NULL CHECK (evidence_digest ~ '^[a-f0-9]{64}$'),
    source_event_key TEXT NOT NULL UNIQUE CHECK (length(source_event_key) >= 8),
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xum_decisions_latest
 ON xum_monetization.eligibility_decisions(identity_link_id,assessed_at DESC,id);

CREATE TABLE IF NOT EXISTS xum_monetization.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key TEXT NOT NULL UNIQUE CHECK (length(event_key) >= 8),
    event_type TEXT NOT NULL CHECK (event_type ~ '^[a-z][a-z0-9_]{2,99}$'),
    actor_subject TEXT,
    identity_link_id UUID REFERENCES xum_monetization.contributor_identity_links(id),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
    happened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Withdrawal rule is configurable but payment rails start explicitly disabled.
-- Integer minor units: 500000 kobo = NGN 5,000.
CREATE TABLE IF NOT EXISTS xum_monetization.country_payment_rails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country TEXT NOT NULL CHECK (country ~ '^[A-Z]{2}$'),
    currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    rail TEXT NOT NULL CHECK (rail ~ '^[a-z][a-z_]{2,50}$'),
    min_withdrawal_minor BIGINT NOT NULL CHECK (min_withdrawal_minor > 0),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(country,currency,rail)
);
INSERT INTO xum_monetization.country_payment_rails
 (country,currency,rail,min_withdrawal_minor,enabled)
VALUES ('NG','NGN','bank_transfer',500000,FALSE)
ON CONFLICT (country,currency,rail) DO NOTHING;

-- Never overwrite a recorded qualification outcome, fraud evidence or audit.
CREATE OR REPLACE FUNCTION xum_monetization.reject_immutable_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
    RAISE EXCEPTION 'XUM monetization history is append-only; use a new event';
END $$;

DROP TRIGGER IF EXISTS xum_decision_immutable ON xum_monetization.eligibility_decisions;
CREATE TRIGGER xum_decision_immutable BEFORE UPDATE OR DELETE
 ON xum_monetization.eligibility_decisions
 FOR EACH ROW EXECUTE FUNCTION xum_monetization.reject_immutable_change();

DROP TRIGGER IF EXISTS xum_audit_immutable ON xum_monetization.audit_events;
CREATE TRIGGER xum_audit_immutable BEFORE UPDATE OR DELETE
 ON xum_monetization.audit_events
 FOR EACH ROW EXECUTE FUNCTION xum_monetization.reject_immutable_change();

DROP TRIGGER IF EXISTS xum_evidence_immutable ON xum_monetization.verified_evidence;
CREATE TRIGGER xum_evidence_immutable BEFORE UPDATE OR DELETE
 ON xum_monetization.verified_evidence
 FOR EACH ROW EXECUTE FUNCTION xum_monetization.reject_immutable_change();

CREATE OR REPLACE FUNCTION xum_monetization.reject_policy_history_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
    -- A published rule set must be a NEW row with a new policy_key and an
    -- effective timestamp. Editing drafts in place would evade the audit trail.
    RAISE EXCEPTION 'Monetization policy is append-only; create a new version';
END $;

DROP TRIGGER IF EXISTS xum_policy_immutable ON xum_monetization.policy_versions;
CREATE TRIGGER xum_policy_immutable BEFORE UPDATE OR DELETE
 ON xum_monetization.policy_versions
 FOR EACH ROW EXECUTE FUNCTION xum_monetization.reject_policy_history_change();

-- No access to private identity/evidence/decisions for clients.
REVOKE ALL ON ALL TABLES IN SCHEMA xum_monetization FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA xum_monetization FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA xum_monetization TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA xum_monetization TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA xum_monetization
 REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA xum_monetization
 REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER TABLE xum_monetization.contributor_identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.program_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.verified_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.eligibility_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.country_payment_rails ENABLE ROW LEVEL SECURITY;
-- No authenticated/anon SELECT/INSERT/UPDATE/DELETE policies; service-role access only.

-- A read-only RPC authenticated as a verified Clerk subject, with NO user ID
-- parameter (prevents asking for other users' status). Default is non-monetized.
CREATE OR REPLACE FUNCTION public.get_my_monetization_status_v1()
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, xum_monetization
AS $$
DECLARE
    v_claims JSONB;
    v_subject TEXT;
    v_flags xum_monetization.program_controls%ROWTYPE;
    v_link UUID;
    v_decision xum_monetization.eligibility_decisions%ROWTYPE;
BEGIN
    v_claims := auth.jwt();
    v_subject := v_claims ->> 'sub';
    IF v_claims ->> 'role' IS DISTINCT FROM 'authenticated'
       OR v_subject IS NULL OR v_subject !~ '^user_[A-Za-z0-9]+$' THEN
        RAISE EXCEPTION 'Verified authenticated Clerk session required'
            USING ERRCODE = '28000';
    END IF;

    SELECT * INTO v_flags FROM xum_monetization.program_controls WHERE singleton;
    IF NOT FOUND OR NOT v_flags.identity_bridge_enabled
        OR NOT v_flags.qualification_enabled THEN
        RETURN jsonb_build_object('status','not_monetized',
            'program_available',false,'can_withdraw',false,
            'reason','PROGRAM_DISABLED');
    END IF;

    SELECT id INTO v_link
    FROM xum_monetization.contributor_identity_links
    WHERE clerk_subject=v_subject AND link_state='verified' AND verified_at IS NOT NULL;
    IF v_link IS NULL THEN
        RETURN jsonb_build_object('status','not_monetized',
            'program_available',true,'can_withdraw',false,
            'reason','IDENTITY_UNVERIFIED');
    END IF;

    SELECT d.* INTO v_decision
    FROM xum_monetization.eligibility_decisions d
    JOIN xum_monetization.policy_versions p ON p.id=d.policy_version_id
    WHERE d.identity_link_id=v_link AND p.status='published'
      AND p.effective_at <= now()
    ORDER BY d.assessed_at DESC,d.id DESC LIMIT 1;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status','not_monetized',
            'program_available',true,'can_withdraw',false,
            'reason','ASSESSMENT_PENDING');
    END IF;

    RETURN jsonb_build_object(
       'status',v_decision.eligibility,
       'program_available',true,
       'can_withdraw',false, -- phase 3 payout gate is not implemented
       'reason','ASSESSED',
       'policy_version_id',v_decision.policy_version_id,
       'checked_at',v_decision.assessed_at,
       'unmet_requirements',v_decision.unmet_requirements,
       'checks',v_decision.requirement_results
    );
END $$;

REVOKE ALL ON FUNCTION public.get_my_monetization_status_v1() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_monetization_status_v1() TO authenticated;

COMMIT;
