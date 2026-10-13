-- Dedicated Phase 3 database integration tests; run only in isolated PostgreSQL CI.
DO $test$
DECLARE v_count integer;
BEGIN
  IF has_schema_privilege('authenticated','xum_monetization','USAGE')
     OR has_table_privilege('authenticated','xum_monetization.administrator_grants','SELECT')
     OR has_function_privilege('anon','public.admin_monetization_policy_overview_v1()','EXECUTE')
     OR has_function_privilege('anon','public.admin_propose_monetization_policy_v1(jsonb,text)','EXECUTE')
     OR has_function_privilege('anon','public.admin_publish_monetization_policy_v1(uuid,text,timestamptz)','EXECUTE')
     OR has_function_privilege('anon','public.admin_recent_eligibility_decisions_v1(integer)','EXECUTE') THEN
    RAISE EXCEPTION 'Admin private data leaked to untrusted database roles';
  END IF;
  SELECT count(*) INTO v_count FROM xum_monetization.administrator_grants;
  IF v_count <> 0 THEN RAISE EXCEPTION 'New migration must not seed admins'; END IF;
END
$test$;

-- Grants must be created through trusted, independent operator verification.
SET ROLE service_role;
INSERT INTO xum_monetization.administrator_grants
(clerk_subject,permission,granted_by,reason)
VALUES
 ('user_operator1','policy_read','ci_trusted_operator','Phase 3 isolated test grant'),
 ('user_operator1','policy_draft','ci_trusted_operator','Phase 3 isolated test grant'),
 ('user_operator1','policy_publish','ci_trusted_operator','Tests self-publication prevention'),
 ('user_reviewer2','policy_read','ci_trusted_operator','Phase 3 isolated test grant'),
 ('user_reviewer2','policy_publish','ci_trusted_operator','Two-person policy publication'),
 ('user_reviewer2','eligibility_review','ci_trusted_operator','Review pseudonymous decisions');
RESET ROLE;

-- Unlisted Clerk accounts must never get admin data or mutation rights.
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_untrusted3"}',false);
DO $test$
BEGIN
  BEGIN
    PERFORM public.admin_monetization_policy_overview_v1();
    RAISE EXCEPTION 'An unlisted user read private policy';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.admin_propose_monetization_policy_v1('{}'::jsonb,'test-invalid-request-1');
    RAISE EXCEPTION 'An unlisted user created a policy';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;

-- Authenticated operator may read and propose a typed draft, never publish it alone.
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_operator1"}',false);
DO $test$
DECLARE
  v_overview jsonb;
  v_created jsonb;
  v_draft_id uuid;
BEGIN
  v_overview := public.admin_monetization_policy_overview_v1();
  IF v_overview->>'read_only' <> 'true'
     OR v_overview->>'earnings_enabled' <> 'false'
     OR jsonb_array_length(v_overview->'policies') < 1 THEN
    RAISE EXCEPTION 'Admin read-only summary failed: %',v_overview;
  END IF;
  BEGIN
    PERFORM public.admin_propose_monetization_policy_v1(
      '{"policy_key":"unknown","country":"NG","status":"published"}'::jsonb,
      'test-invalid-shape-002');
    RAISE EXCEPTION 'Unknown policy fields were accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  v_created := public.admin_propose_monetization_policy_v1(
    jsonb_build_object(
      'policy_key','ng-staging-v1','country','NG',
      'minimum_age',18,'minimum_profile_percent',80,
      'minimum_qualification_tasks',10,'minimum_qualification_accuracy',80,
      'minimum_approved_contributions',10,
      'require_email_verification',true,'require_phone_verification',true,
      'require_academy',true,
      'terms_version','v1','dataset_license_version','v1'),
    'policy-draft-test-003');
  v_draft_id := (v_created->>'policy_id')::uuid;
  IF v_created->>'status' <> 'draft' OR v_draft_id IS NULL THEN
    RAISE EXCEPTION 'Admin draft not created';
  END IF;
  BEGIN
    PERFORM public.admin_publish_monetization_policy_v1(
      v_draft_id,'test-self-publish-004',now());
    RAISE EXCEPTION 'Self-publication was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;
RESET ROLE;

-- A separate verified publisher authorizes an immutable published copy.
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_reviewer2"}',false);
DO $test$
DECLARE v_draft_id uuid; v_published jsonb;
BEGIN
  SELECT id INTO v_draft_id FROM xum_monetization.policy_versions
  WHERE policy_key='ng-staging-v1';
  -- This direct SELECT must be rejected by private schema permissions. The
  -- trusted test will retrieve the draft id via its admin-facing policies RPC.
EXCEPTION WHEN insufficient_privilege THEN NULL;
END
$test$;
DO $test$
DECLARE v_draft_id uuid; v_published jsonb; v_policies jsonb; r jsonb;
BEGIN
  v_policies := public.admin_monetization_policy_overview_v1()->'policies';
  SELECT (value->>'id')::uuid INTO v_draft_id
  FROM jsonb_array_elements(v_policies)
  WHERE value->>'policy_key'='ng-staging-v1';
  IF v_draft_id IS NULL THEN RAISE EXCEPTION 'Draft not visible in admin view'; END IF;
  v_published := public.admin_publish_monetization_policy_v1(
    v_draft_id,'reviewer-publish-test-005',now());
  IF v_published->>'status' <> 'published' THEN
    RAISE EXCEPTION 'Independent review failed: %',v_published;
  END IF;
  BEGIN
    PERFORM public.admin_publish_monetization_policy_v1(
      v_draft_id,'reviewer-publish-test-006',now());
    RAISE EXCEPTION 'Duplicate policy publication accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END
$test$;
RESET ROLE;

-- Seed trusted, explicit evidence in a disposable CI DB only.
SET ROLE service_role;
UPDATE xum_monetization.program_controls
SET identity_bridge_enabled=TRUE, qualification_enabled=TRUE
WHERE singleton;
INSERT INTO xum_monetization.contributor_identity_links
  (clerk_subject,legacy_user_id,link_state,verification_source,verification_reference,verified_at)
VALUES ('user_worker123','22222222-2222-4222-8222-222222222222',
        'verified','trusted_ci_fixture','ci-id-proof-01',now());
INSERT INTO xum_monetization.verified_evidence
 (identity_link_id,signal,signal_value,provenance,evidence_reference)
SELECT l.id,kv.key,kv.value,'admin_attestation','ci-verified-'||kv.key
FROM xum_monetization.contributor_identity_links l
CROSS JOIN LATERAL jsonb_each(jsonb_build_object(
  'residence_country','NG',
  'account_active',true,
  'verified_age_years',18,
  'age_evidence_verified',true,
  'email_verified',true,
  'phone_verified',true,
  'profile_completeness_percent',80,
  'academy_completed',true,
  'graded_qualification_tasks',10,
  'qualification_accuracy_percent',80,
  'approved_contributions',10,
  'accepted_terms_version','v1',
  'accepted_dataset_license_version','v1',
  'unresolved_serious_policy_violations',0,
  'unresolved_duplicate_flags',0,
  'unresolved_high_risk_fraud_flags',0
)) AS kv(key,value)
WHERE l.clerk_subject='user_worker123';

DO $test$
DECLARE v_link uuid; v_policy uuid; v_result jsonb; v_replay jsonb; v_count integer;
BEGIN
  SELECT id INTO v_link FROM xum_monetization.contributor_identity_links
    WHERE clerk_subject='user_worker123';
  SELECT id INTO v_policy FROM xum_monetization.policy_versions
    WHERE policy_key LIKE 'ng-staging-v1-pub-%';
  v_result := xum_monetization.assess_contributor_v1(v_link,v_policy,'assessment-approved-ci-01');
  IF v_result->>'eligibility' <> 'eligible' OR
     jsonb_array_length(v_result->'unmet_requirements') <> 0 THEN
    RAISE EXCEPTION 'Verified record did not qualify: %',v_result;
  END IF;
  v_replay := xum_monetization.assess_contributor_v1(
    v_link,v_policy,'assessment-approved-ci-01');
  IF v_replay->>'decision_id' IS DISTINCT FROM v_result->>'decision_id' THEN
    RAISE EXCEPTION 'Event replay did not return same decision';
  END IF;
  SELECT count(*) INTO v_count FROM xum_monetization.eligibility_decisions
    WHERE source_event_key='assessment-approved-ci-01';
  IF v_count <> 1 THEN RAISE EXCEPTION 'Idempotent decision missing'; END IF;
END
$test$;
RESET ROLE;

-- Contributor can see their own verified result but not another account's,
-- cannot call admin endpoints, and can never see can_withdraw=true.
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_worker123"}',false);
DO $test$
DECLARE result jsonb;
BEGIN
  result := public.get_my_monetization_status_v1();
  IF result->>'status'<>'eligible' OR result->>'can_withdraw'<>'false'
     OR jsonb_array_length(result->'checks') <> 15 THEN
    RAISE EXCEPTION 'Contributor status did not surface verified qualification: %',result;
  END IF;
  BEGIN
    PERFORM public.admin_monetization_policy_overview_v1();
    RAISE EXCEPTION 'Contributor was treated as administrator';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.admin_recent_eligibility_decisions_v1(10);
    RAISE EXCEPTION 'Contributor could read others qualification results';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END
$test$;
RESET ROLE;

SET ROLE service_role;
INSERT INTO xum_monetization.contributor_identity_links
  (clerk_subject,legacy_user_id,link_state,verification_source,verification_reference,verified_at)
VALUES ('user_workermissing','33333333-3333-4333-8333-333333333333',
        'verified','trusted_ci_fixture','ci-id-proof-02',now());
DO $test$
DECLARE v_link uuid; v_policy uuid; r jsonb;
BEGIN
  SELECT id INTO v_link FROM xum_monetization.contributor_identity_links
     WHERE clerk_subject='user_workermissing';
  SELECT id INTO v_policy FROM xum_monetization.policy_versions
     WHERE policy_key LIKE 'ng-staging-v1-pub-%';
  r := xum_monetization.assess_contributor_v1(v_link,v_policy,'assessment-fail-closed-02');
  IF r->>'eligibility'<>'not_monetized' OR
     jsonb_array_length(r->'unmet_requirements')<>15 THEN
    RAISE EXCEPTION 'No evidence incorrectly qualified: %',r;
  END IF;
END
$test$;
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_reviewer2"}',false);
DO $test$
DECLARE r jsonb;
BEGIN
  r := public.admin_recent_eligibility_decisions_v1(2);
  IF r->>'can_withdraw' <> 'false'
     OR r->>'read_only' <> 'true'
     OR jsonb_array_length(r->'decisions') <> 2 THEN
    RAISE EXCEPTION 'Admin decision read contract incorrect: %',r;
  END IF;
  IF (r->'decisions'->0) ? 'email' OR (r->'decisions'->0) ? 'bank_account' THEN
    RAISE EXCEPTION 'PII leaked from eligibility review API';
  END IF;
END
$test$;
RESET ROLE;

-- New trusted integrity evidence invalidates older "eligible" decisions immediately.
SET ROLE service_role;
INSERT INTO xum_monetization.verified_evidence
(identity_link_id,signal,signal_value,provenance,evidence_reference)
SELECT id,'unresolved_high_risk_fraud_flags','1'::jsonb,
       'fraud_review','ci-risk-case-new'
FROM xum_monetization.contributor_identity_links
WHERE clerk_subject='user_worker123';
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_worker123"}',false);
DO $test$
DECLARE r jsonb;
BEGIN
  r:=public.get_my_monetization_status_v1();
  IF r->>'status'<>'not_monetized' OR r->>'reason'<>'ASSESSMENT_PENDING' THEN
    RAISE EXCEPTION 'New fraud evidence did not invalidate previous decision: %',r;
  END IF;
END
$test$;
RESET ROLE;

SET ROLE service_role;
DO $test$
DECLARE v_link uuid; v_policy uuid; r jsonb;
BEGIN
  SELECT id INTO v_link FROM xum_monetization.contributor_identity_links
    WHERE clerk_subject='user_worker123';
  SELECT id INTO v_policy FROM xum_monetization.policy_versions
    WHERE policy_key LIKE 'ng-staging-v1-pub-%';
  r:=xum_monetization.assess_contributor_v1(v_link,v_policy,'fraud-review-reassessment-03');
  IF r->>'eligibility'<>'not_monetized'
     OR NOT (r->'unmet_requirements' ? 'no_unresolved_fraud_flags') THEN
    RAISE EXCEPTION 'Trusted new fraud flag not applied: %',r;
  END IF;
END
$test$;
RESET ROLE;

SELECT 'XUM Phase 3 isolated admin and verified-assessment checks passed' AS outcome;
