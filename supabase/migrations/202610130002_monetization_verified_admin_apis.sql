-- Phase 3 / staging only: authenticated policy administration and verified evidence evaluation.
-- Requires 202610130001. DO NOT enable earnings or withdrawals.
BEGIN;

CREATE TABLE IF NOT EXISTS xum_monetization.administrator_grants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_subject text NOT NULL CHECK (clerk_subject ~ '^user_[A-Za-z0-9]+$'),
    permission text NOT NULL CHECK (permission IN ('policy_read', 'policy_draft', 'policy_publish', 'eligibility_review')),
    granted_by text NOT NULL CHECK (length(btrim(granted_by)) >= 3),
    reason text NOT NULL CHECK (length(btrim(reason)) >= 5),
    granted_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz,
    revoked_at timestamptz,
    UNIQUE (clerk_subject, permission),
    CHECK (expires_at IS NULL OR expires_at > granted_at)
);
ALTER TABLE xum_monetization.administrator_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON xum_monetization.administrator_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON xum_monetization.administrator_grants TO service_role;
-- Provision/revoke grants only with trusted service-role tooling after identity verification.
-- Do not accept client-supplied emails, publicMetadata or arbitrary user IDs.

CREATE UNIQUE INDEX IF NOT EXISTS idx_xum_verified_evidence_source_once
    ON xum_monetization.verified_evidence (identity_link_id, signal, evidence_reference);

CREATE OR REPLACE FUNCTION xum_monetization.assert_admin_permission(p_permission text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, xum_monetization
AS $function$
DECLARE v_claims jsonb; v_sub text;
BEGIN
    v_claims := auth.jwt();
    v_sub := v_claims ->> 'sub';
    IF v_claims ->> 'role' IS DISTINCT FROM 'authenticated'
       OR v_sub IS NULL OR v_sub !~ '^user_[A-Za-z0-9]+$'
       OR NOT EXISTS (
           SELECT 1 FROM xum_monetization.administrator_grants
           WHERE clerk_subject=v_sub AND permission=p_permission
             AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())
       ) THEN
        RAISE EXCEPTION 'Not authorized for monetization administration'
            USING ERRCODE='42501';
    END IF;
    RETURN v_sub;
END
$function$;

-- This sanitized admin RPC contains NO payment identity, user bank details or wallet data.
CREATE OR REPLACE FUNCTION public.admin_monetization_policy_overview_v1()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, xum_monetization
AS $function$
DECLARE v_actor text; v_control record; v_policies jsonb;
BEGIN
    v_actor := xum_monetization.assert_admin_permission('policy_read');
    SELECT * INTO v_control FROM xum_monetization.program_controls WHERE singleton;
    SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC, p.id DESC), '[]'::jsonb)
    INTO v_policies FROM (
        SELECT id, policy_key, country, status, minimum_age, minimum_profile_percent,
            minimum_qualification_tasks, minimum_qualification_accuracy,
            minimum_approved_contributions, require_email_verification,
            require_phone_verification, require_academy, terms_version,
            dataset_license_version, effective_at, created_at, created_by
        FROM xum_monetization.policy_versions ORDER BY created_at DESC, id DESC LIMIT 50
    ) p;
    RETURN jsonb_build_object(
        'read_only', true,
        'identity_bridge_enabled', COALESCE(v_control.identity_bridge_enabled,false),
        'qualification_enabled', COALESCE(v_control.qualification_enabled,false),
        'earnings_enabled', false,
        'withdrawals_enabled', false,
        'policies',v_policies
    );
END
$function$;

-- Administrators can PROPOSE immutable drafts only. A separate reviewer must publish.
-- All numeric and type constraints are enforced by table checks and explicit casts.
CREATE OR REPLACE FUNCTION public.admin_propose_monetization_policy_v1(
    p_proposal jsonb, p_request_key text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public, xum_monetization
AS $function$
DECLARE v_actor text; v_policy_id uuid; v_key text;
BEGIN
    v_actor := xum_monetization.assert_admin_permission('policy_draft');
    IF jsonb_typeof(p_proposal) IS DISTINCT FROM 'object'
       OR p_request_key IS NULL OR length(p_request_key) < 12
       OR length(p_request_key) > 128
       OR (SELECT count(*) FROM jsonb_object_keys(p_proposal)) <> 11
       OR NOT p_proposal ?& ARRAY[
         'policy_key','country','minimum_age','minimum_profile_percent',
         'minimum_qualification_tasks','minimum_qualification_accuracy',
         'minimum_approved_contributions','require_email_verification',
         'require_phone_verification','require_academy','terms_version'
       ] THEN
       -- dataset license is required as a 12th field; checked separately below.
       -- Conservative: fail closed on incomplete/unknown field sets.
       NULL;
    END IF;
    IF jsonb_typeof(p_proposal) IS DISTINCT FROM 'object'
       OR p_request_key IS NULL OR length(p_request_key) NOT BETWEEN 12 AND 128
       OR (SELECT count(*) FROM jsonb_object_keys(p_proposal)) <> 12
       OR NOT p_proposal ?& ARRAY[
         'policy_key','country','minimum_age','minimum_profile_percent',
         'minimum_qualification_tasks','minimum_qualification_accuracy',
         'minimum_approved_contributions','require_email_verification',
         'require_phone_verification','require_academy','terms_version',
         'dataset_license_version'
       ]
       OR jsonb_typeof(p_proposal->'policy_key') <> 'string'
       OR jsonb_typeof(p_proposal->'country') <> 'string'
       OR jsonb_typeof(p_proposal->'terms_version') <> 'string'
       OR jsonb_typeof(p_proposal->'dataset_license_version') <> 'string'
       OR EXISTS (
           SELECT 1 FROM jsonb_each(p_proposal) j
           WHERE (j.key IN ('minimum_age','minimum_profile_percent',
             'minimum_qualification_tasks','minimum_qualification_accuracy','minimum_approved_contributions')
             AND (jsonb_typeof(j.value) <> 'number' OR j.value::text !~ '^[0-9]+$'))
             OR (j.key IN ('require_email_verification','require_phone_verification','require_academy')
             AND jsonb_typeof(j.value) <> 'boolean')
       ) THEN
        RAISE EXCEPTION 'Invalid policy proposal shape' USING ERRCODE='22023';
    END IF;
    v_key := p_proposal->>'policy_key';
    INSERT INTO xum_monetization.policy_versions(
       policy_key,country,status,minimum_age,minimum_profile_percent,
       minimum_qualification_tasks,minimum_qualification_accuracy,
       minimum_approved_contributions,require_email_verification,
       require_phone_verification,require_academy,terms_version,
       dataset_license_version,created_by)
    VALUES (
       v_key,p_proposal->>'country','draft',
       (p_proposal->>'minimum_age')::smallint,
       (p_proposal->>'minimum_profile_percent')::smallint,
       (p_proposal->>'minimum_qualification_tasks')::integer,
       (p_proposal->>'minimum_qualification_accuracy')::smallint,
       (p_proposal->>'minimum_approved_contributions')::integer,
       (p_proposal->>'require_email_verification')::boolean,
       (p_proposal->>'require_phone_verification')::boolean,
       (p_proposal->>'require_academy')::boolean,
       p_proposal->>'terms_version',p_proposal->>'dataset_license_version',v_actor
    ) RETURNING id INTO v_policy_id;
    INSERT INTO xum_monetization.audit_events(event_key,event_type,actor_subject,payload)
      VALUES (p_request_key,'policy_drafted',v_actor,
        jsonb_build_object('policy_id',v_policy_id,'policy_key',v_key));
    RETURN jsonb_build_object('policy_id',v_policy_id,'status','draft');
END
$function$;

-- Reviewer cannot publish their own draft. Publishing creates a NEW immutable
-- record; neither operation toggles qualification or payout feature flags.
CREATE OR REPLACE FUNCTION public.admin_publish_monetization_policy_v1(
    p_draft_id uuid, p_request_key text, p_effective_at timestamptz
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public, xum_monetization
AS $function$
DECLARE v_actor text; v_draft record; v_new_id uuid; v_new_key text;
BEGIN
    v_actor := xum_monetization.assert_admin_permission('policy_publish');
    IF p_request_key IS NULL OR length(p_request_key) NOT BETWEEN 12 AND 128
       OR p_effective_at IS NULL OR p_effective_at < now() THEN
        RAISE EXCEPTION 'Invalid publication request' USING ERRCODE='22023';
    END IF;
    SELECT * INTO v_draft
    FROM xum_monetization.policy_versions
    WHERE id=p_draft_id AND status='draft' FOR SHARE;
    IF NOT FOUND OR v_draft.created_by IS NULL OR v_draft.created_by = v_actor THEN
        RAISE EXCEPTION 'Independent reviewer and valid draft required' USING ERRCODE='42501';
    END IF;
    v_new_key := left(v_draft.policy_key,55)||'-pub-'||replace(v_draft.id::text,'-','');
    INSERT INTO xum_monetization.policy_versions(
       policy_key,country,status,minimum_age,minimum_profile_percent,
       minimum_qualification_tasks,minimum_qualification_accuracy,
       minimum_approved_contributions,require_email_verification,
       require_phone_verification,require_academy,terms_version,
       dataset_license_version,effective_at,created_by)
    VALUES (
       v_new_key,v_draft.country,'published',v_draft.minimum_age,
       v_draft.minimum_profile_percent,v_draft.minimum_qualification_tasks,
       v_draft.minimum_qualification_accuracy,v_draft.minimum_approved_contributions,
       v_draft.require_email_verification,v_draft.require_phone_verification,
       v_draft.require_academy,v_draft.terms_version,
       v_draft.dataset_license_version,p_effective_at,v_actor
    ) RETURNING id INTO v_new_id;
    INSERT INTO xum_monetization.audit_events(event_key,event_type,actor_subject,payload)
    VALUES (p_request_key,'policy_published',v_actor,
      jsonb_build_object('policy_id',v_new_id,'source_draft_id',p_draft_id,'effective_at',p_effective_at));
    RETURN jsonb_build_object('policy_id',v_new_id,'status','published',
      'effective_at',p_effective_at);
END
$function$;

CREATE OR REPLACE FUNCTION xum_monetization.latest_verified_signal(
   p_identity_link_id uuid, p_signal text
) RETURNS jsonb LANGUAGE sql STABLE
SET search_path = pg_catalog, xum_monetization
AS $function$
    SELECT signal_value FROM xum_monetization.verified_evidence
    WHERE identity_link_id=p_identity_link_id AND signal=p_signal
      AND verified_at <= now() AND (expires_at IS NULL OR expires_at > now())
      AND provenance <> 'self_reported'
    ORDER BY verified_at DESC, recorded_at DESC, id DESC
    LIMIT 1
$function$;

-- Trusted service-role operation; no browser execute grant.
-- Only *verified provenance* is included; missing signals are never accepted.
CREATE OR REPLACE FUNCTION xum_monetization.assess_contributor_v1(
   p_identity_link_id uuid, p_policy_id uuid, p_event_key text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, xum_monetization
AS $function$
DECLARE
   p xum_monetization.policy_versions%ROWTYPE;
   c xum_monetization.program_controls%ROWTYPE;
   v_link_state text;
   v_email jsonb; v_phone jsonb; v_age jsonb; v_age_valid jsonb;
   v_profile jsonb; v_academy jsonb; v_qualification jsonb; v_accuracy jsonb;
   v_approved jsonb; v_terms jsonb; v_license jsonb; v_account jsonb;
   v_violations jsonb; v_duplicates jsonb; v_fraud jsonb;
   v_checks jsonb; v_unmet jsonb; v_digest text; v_decision_id uuid;
   v_eligible boolean;
BEGIN
   IF p_event_key IS NULL OR length(p_event_key) NOT BETWEEN 12 AND 128 THEN
      RAISE EXCEPTION 'Invalid source event ID' USING ERRCODE='22023';
   END IF;
   SELECT * INTO c FROM xum_monetization.program_controls WHERE singleton;
   IF NOT FOUND OR NOT c.identity_bridge_enabled OR NOT c.qualification_enabled THEN
      RAISE EXCEPTION 'Qualification processing is disabled' USING ERRCODE='55000';
   END IF;
   SELECT link_state INTO v_link_state FROM xum_monetization.contributor_identity_links
     WHERE id=p_identity_link_id FOR UPDATE;
   IF v_link_state IS DISTINCT FROM 'verified' THEN
      RAISE EXCEPTION 'Verified identity link is required' USING ERRCODE='42501';
   END IF;
   SELECT * INTO p FROM xum_monetization.policy_versions
     WHERE id=p_policy_id AND status='published' AND effective_at <= now();
   IF NOT FOUND THEN
      RAISE EXCEPTION 'Active published policy required' USING ERRCODE='22023';
   END IF;
   v_account := xum_monetization.latest_verified_signal(p_identity_link_id,'account_active');
   v_age := xum_monetization.latest_verified_signal(p_identity_link_id,'verified_age_years');
   v_age_valid := xum_monetization.latest_verified_signal(p_identity_link_id,'age_evidence_verified');
   v_email := xum_monetization.latest_verified_signal(p_identity_link_id,'email_verified');
   v_phone := xum_monetization.latest_verified_signal(p_identity_link_id,'phone_verified');
   v_profile := xum_monetization.latest_verified_signal(p_identity_link_id,'profile_completeness_percent');
   v_academy := xum_monetization.latest_verified_signal(p_identity_link_id,'academy_completed');
   v_qualification := xum_monetization.latest_verified_signal(p_identity_link_id,'graded_qualification_tasks');
   v_accuracy := xum_monetization.latest_verified_signal(p_identity_link_id,'qualification_accuracy_percent');
   v_approved := xum_monetization.latest_verified_signal(p_identity_link_id,'approved_contributions');
   v_terms := xum_monetization.latest_verified_signal(p_identity_link_id,'accepted_terms_version');
   v_license := xum_monetization.latest_verified_signal(p_identity_link_id,'accepted_dataset_license_version');
   v_violations := xum_monetization.latest_verified_signal(p_identity_link_id,'unresolved_serious_policy_violations');
   v_duplicates := xum_monetization.latest_verified_signal(p_identity_link_id,'unresolved_duplicate_flags');
   v_fraud := xum_monetization.latest_verified_signal(p_identity_link_id,'unresolved_high_risk_fraud_flags');

   -- Numeric fields use strict JSON integer or bounded decimal format, no strings.
   -- Invalid JSON schema is a failed requirement, not a cast error or empty score.
   v_checks := jsonb_build_array(
    jsonb_build_object('requirement','account_active','passed',v_account='true'::jsonb,'observed',v_account,'target',true),
    jsonb_build_object('requirement','minimum_age_verified','passed',
      v_age_valid='true'::jsonb AND jsonb_typeof(v_age)='number'
      AND CASE WHEN v_age::text ~ '^[0-9]+$' THEN (v_age#>>'{}')::numeric >= p.minimum_age ELSE false END,
      'observed',v_age,'target',p.minimum_age),
    jsonb_build_object('requirement','email_verified','passed',NOT p.require_email_verification OR v_email='true'::jsonb,'observed',v_email,'target',true),
    jsonb_build_object('requirement','phone_verified','passed',NOT p.require_phone_verification OR v_phone='true'::jsonb,'observed',v_phone,'target',true),
    jsonb_build_object('requirement','profile_complete','passed',
      jsonb_typeof(v_profile)='number' AND
      CASE WHEN v_profile::text ~ '^[0-9]+(\.[0-9]+)?$'
      THEN (v_profile#>>'{}')::numeric BETWEEN p.minimum_profile_percent AND 100 ELSE false END,
      'observed',v_profile,'target',p.minimum_profile_percent),
    jsonb_build_object('requirement','academy_complete','passed',NOT p.require_academy OR v_academy='true'::jsonb,'observed',v_academy,'target',true),
    jsonb_build_object('requirement','qualification_tasks','passed',
      CASE WHEN v_qualification::text ~ '^[0-9]+$' THEN (v_qualification#>>'{}')::numeric >= p.minimum_qualification_tasks ELSE false END,
      'observed',v_qualification,'target',p.minimum_qualification_tasks),
    jsonb_build_object('requirement','qualification_accuracy','passed',
      CASE WHEN v_accuracy::text ~ '^[0-9]+(\.[0-9]+)?$' THEN (v_accuracy#>>'{}')::numeric BETWEEN p.minimum_qualification_accuracy AND 100 ELSE false END,
      'observed',v_accuracy,'target',p.minimum_qualification_accuracy),
    jsonb_build_object('requirement','approved_contributions','passed',
      CASE WHEN v_approved::text ~ '^[0-9]+$' THEN (v_approved#>>'{}')::numeric >= p.minimum_approved_contributions ELSE false END,
      'observed',v_approved,'target',p.minimum_approved_contributions),
    jsonb_build_object('requirement','terms_accepted','passed',v_terms=to_jsonb(p.terms_version),'observed',v_terms,'target',p.terms_version),
    jsonb_build_object('requirement','dataset_license_accepted','passed',v_license=to_jsonb(p.dataset_license_version),'observed',v_license,'target',p.dataset_license_version),
    jsonb_build_object('requirement','no_serious_policy_violations','passed',v_violations='0'::jsonb,'observed',v_violations,'target',0),
    jsonb_build_object('requirement','no_unresolved_duplicate_flags','passed',v_duplicates='0'::jsonb,'observed',v_duplicates,'target',0),
    jsonb_build_object('requirement','no_unresolved_fraud_flags','passed',v_fraud='0'::jsonb,'observed',v_fraud,'target',0)
   );
   -- jsonb booleans may be null when evidence is missing; treat null as false.
   SELECT COALESCE(jsonb_agg(value->>'requirement') FILTER (
     WHERE value->>'passed' IS DISTINCT FROM 'true'), '[]'::jsonb)
   INTO v_unmet FROM jsonb_array_elements(v_checks);
   v_eligible := jsonb_array_length(v_unmet)=0;
   -- Digest includes exact evidence values, policy and assessed checklist.
   v_digest := encode(digest(p_policy_id::text||':'||p_identity_link_id::text||':'||v_checks::text,'sha256'),'hex');
   INSERT INTO xum_monetization.eligibility_decisions
     (identity_link_id,policy_version_id,eligibility,requirement_results,
      unmet_requirements,evidence_digest,source_event_key)
   VALUES (p_identity_link_id,p_policy_id,
      CASE WHEN v_eligible THEN 'eligible' ELSE 'not_monetized' END,
      v_checks,v_unmet,v_digest,p_event_key)
   RETURNING id INTO v_decision_id;
   INSERT INTO xum_monetization.audit_events(event_key,event_type,actor_subject,
      identity_link_id,payload)
   VALUES ('assessment:'||p_event_key,'eligibility_assessed','trusted_service',
      p_identity_link_id,jsonb_build_object('policy_id',p_policy_id,
         'decision_id',v_decision_id,'qualified',v_eligible));
   RETURN jsonb_build_object('decision_id',v_decision_id,'eligibility',
     CASE WHEN v_eligible THEN 'eligible' ELSE 'not_monetized' END,
     'unmet_requirements',v_unmet);
END
$function$;

-- Keep private functions non-callable from the public API.
REVOKE ALL ON FUNCTION xum_monetization.assert_admin_permission(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION xum_monetization.latest_verified_signal(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION xum_monetization.assess_contributor_v1(uuid,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION xum_monetization.assess_contributor_v1(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION xum_monetization.latest_verified_signal(uuid,text) TO service_role;

REVOKE ALL ON FUNCTION public.admin_monetization_policy_overview_v1() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_monetization_policy_overview_v1() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_propose_monetization_policy_v1(jsonb,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_propose_monetization_policy_v1(jsonb,text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_publish_monetization_policy_v1(uuid,text,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_publish_monetization_policy_v1(uuid,text,timestamptz) TO authenticated;

COMMIT;
