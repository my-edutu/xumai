-- Isolated PostgreSQL test fixtures. Never run on a live project.
-- Prerequisites: Supabase-like mock JWT helper, migrations 001, 002, 003.
SET ROLE service_role;
INSERT INTO xum_monetization.administrator_grants
 (clerk_subject,permission,granted_by,reason)
VALUES
 ('user_adminone','policy_draft','ci_operator','Isolated admin policy tests'),
 ('user_adminone','policy_publish','ci_operator','Isolated activation first approval'),
 ('user_admintwo','policy_publish','ci_operator','Independent policy publish'),
 ('user_admintwo','policy_read','ci_operator','Read drafts to independently approve'),
 ('user_admintwo','eligibility_review','ci_operator','Isolated activation second approval');
INSERT INTO xum_monetization.contributor_identity_links
 (clerk_subject,legacy_user_id,link_state,verification_source,verification_reference,verified_at)
VALUES
 ('user_qualworker','66666666-6666-4666-8666-666666666666','verified','trusted_ci','identity-proof-one',now()),
 ('user_otherworker','77777777-7777-4777-8777-777777777777','verified','trusted_ci','identity-proof-two',now());
-- 12 active questions, all four-letter multiple choice, no actual production question content.
INSERT INTO xum_monetization.qualification_questions
 (source_reference,prompt,options,correct_choice,active,created_by,reviewed_by,reviewed_at)
SELECT 'ci-qual-question-'||n,
 'For test item '||n||', which option is correct in this isolated test?',
 '{"A":"Correct CI option","B":"Incorrect","C":"Incorrect","D":"Incorrect"}'::jsonb,
 'A',true,'trusted_ci','independent_ci_reviewer',now()
FROM generate_series(1,12) n;
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_qualworker"}',false);
DO $test$
DECLARE r jsonb;
BEGIN
 r:=public.start_my_qualification_v1();
 IF r->>'reason'<>'QUALIFICATION_DISABLED' THEN
   RAISE EXCEPTION 'Exam opened without two-person activation: %',r;
 END IF;
 BEGIN
   INSERT INTO xum_monetization.qualification_questions
     (prompt,options,correct_choice,source_reference)
   VALUES ('Malicious supplied test prompt',
     '{"A":"A","B":"B","C":"C","D":"D"}','A','malicious-test');
   RAISE EXCEPTION 'Authenticated user could forge gold test';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END
$test$;
RESET ROLE;

-- Create an operator-proposed draft using signed/permissioned RPC.
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_adminone"}',false);
DO $test$
BEGIN
 PERFORM public.admin_propose_monetization_policy_v1(
  jsonb_build_object(
   'policy_key','qualification-ci-v1','country','*',
   'minimum_age',18,'minimum_profile_percent',80,
   'minimum_qualification_tasks',10,'minimum_qualification_accuracy',80,
   'minimum_approved_contributions',10,'require_email_verification',true,
   'require_phone_verification',true,'require_academy',true,
   'terms_version','v1','dataset_license_version','v1'),
  'qualification-policy-draft-test-001');
END
$test$;
RESET ROLE;

-- Distinct publisher authorizes the version. This alone does NOT open tests.
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_admintwo"}',false);
DO $test$
DECLARE draft_id uuid; r jsonb;
BEGIN
 SELECT (value->>'id')::uuid INTO draft_id
 FROM jsonb_array_elements(public.admin_monetization_policy_overview_v1()->'policies')
 WHERE value->>'policy_key'='qualification-ci-v1';
 r:=public.admin_publish_monetization_policy_v1(
  draft_id,'qualification-policy-publish-002',now());
 IF r->>'status'<>'published' THEN RAISE EXCEPTION 'Could not publish valid policy'; END IF;
END
$test$;
RESET ROLE;

CREATE TEMP TABLE ci_activation_request(id uuid);
GRANT SELECT, INSERT ON ci_activation_request TO authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_adminone"}',false);
INSERT INTO pg_temp.ci_activation_request(id)
SELECT (public.admin_request_qualification_activation_v1('qualification-activation-003')->>'request_id')::uuid;
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_adminone"}',false);
DO $test$
DECLARE request_id uuid;
BEGIN
 -- Exact request ID cannot be read through private tables, so a second
 -- authenticated endpoint is not used here; independent approval is tested
 -- with a trusted CI setup lookup below.
 IF has_schema_privilege('authenticated','xum_monetization','USAGE') THEN
   RAISE EXCEPTION 'Client can enumerate private activation requests';
 END IF;
END
$test$;
RESET ROLE;

SET ROLE service_role;
-- In CI only, the trusted provisioner finds the pending activation ID.
DO $test$
DECLARE req_id uuid; r jsonb;
BEGIN
 SELECT id INTO req_id FROM xum_monetization.qualification_activation_requests
 WHERE request_key='qualification-activation-003';
 IF req_id IS NULL THEN RAISE EXCEPTION 'Activation request missing'; END IF;
END
$test$;
RESET ROLE;

-- To confirm, fetch the request ID from a trusted fixture in tests and call the
-- operator-scope RPC. Do not let any frontend query the raw activation table.
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_admintwo"}',false);
DO $test$
DECLARE req_id uuid; r jsonb;
BEGIN
 -- The safe API returns request_id to requester. Test uses a temporary
 -- privileged helper only in CI so no production cross-user lookup is needed.
 SELECT id INTO req_id FROM pg_temp.ci_activation_request LIMIT 1;
 r:=public.admin_confirm_qualification_activation_v1(req_id);
 IF r->>'state'<>'qualification_active'
    OR r->>'earnings_enabled'<>'false' OR r->>'withdrawals_enabled'<>'false' THEN
   RAISE EXCEPTION 'Activation changed financial gates: %',r;
 END IF;
END
$test$;
RESET ROLE;

-- Validate typed answers, same-person access, answer-key confidentiality.
CREATE TEMP TABLE ci_worker_attempt(id uuid);
GRANT SELECT, INSERT ON ci_worker_attempt TO authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_qualworker"}',false);
DO $test$
DECLARE r jsonb; attempt_id uuid;
BEGIN
 r:=public.start_my_qualification_v1();
 IF jsonb_array_length(r->'questions')<>10 OR r ? 'correct_choice'
     OR (r->'questions'->0) ? 'correct_choice' THEN
   RAISE EXCEPTION 'Question payload leaked answers or incorrect task count: %',r;
 END IF;
 IF has_schema_privilege('authenticated','xum_monetization','USAGE') THEN
   RAISE EXCEPTION 'Answer key table visible to contributor';
 END IF;
 IF public.start_my_qualification_v1()->>'attempt_id' IS DISTINCT FROM r->>'attempt_id' THEN
   RAISE EXCEPTION 'Reopening current exam created duplicate attempt';
 END IF;
 INSERT INTO pg_temp.ci_worker_attempt VALUES ((r->>'attempt_id')::uuid);
END
$test$;
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_otherworker"}',false);
DO $test$
DECLARE r jsonb;
BEGIN
 BEGIN
   PERFORM public.submit_my_qualification_v1(
      (SELECT id FROM pg_temp.ci_worker_attempt LIMIT 1),
      '[]'::jsonb,'unauthorized-attempt-004');
   RAISE EXCEPTION 'Another user submitted workers exam';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END
$test$;
RESET ROLE;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"role":"authenticated","sub":"user_qualworker"}',false);
DO $test$
DECLARE r jsonb; r2 jsonb; attempt_id uuid; answers jsonb;
BEGIN
 r:=public.start_my_qualification_v1();
 attempt_id:=(r->>'attempt_id')::uuid;
 SELECT jsonb_agg(jsonb_build_object('question_id',value->>'id','answer','A'))
   INTO answers FROM jsonb_array_elements(r->'questions');
 r:=public.submit_my_qualification_v1(attempt_id,answers,'exam-approved-submission-005');
 IF r->>'status'<>'graded' OR (r->>'accuracy_percent')::numeric<>100
     OR (r->>'correct')::integer<>10 THEN
    RAISE EXCEPTION 'Verified scoring failed: %',r;
 END IF;
 r2:=public.submit_my_qualification_v1(attempt_id,answers,'exam-approved-submission-005');
 IF r2 IS DISTINCT FROM r THEN RAISE EXCEPTION 'Retry was not idempotent'; END IF;
 BEGIN
   PERFORM public.submit_my_qualification_v1(attempt_id,answers,'exam-replay-different-006');
   RAISE EXCEPTION 'Accepted repeat submission with a changed event key';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
END
$test$;
RESET ROLE;

SET ROLE service_role;
DO $test$
DECLARE link_id uuid; c integer; r record;
BEGIN
 SELECT id INTO link_id FROM xum_monetization.contributor_identity_links
    WHERE clerk_subject='user_qualworker';
 SELECT count(*) INTO c FROM xum_monetization.verified_evidence
 WHERE identity_link_id=link_id AND provenance='qualification_scoring';
 IF c<>2 THEN RAISE EXCEPTION 'Expected exactly two verified qualification signals, got %',c; END IF;
 SELECT * INTO r FROM xum_monetization.program_controls WHERE singleton;
 IF NOT r.qualification_enabled OR r.earnings_enabled OR r.withdrawals_enabled THEN
   RAISE EXCEPTION 'Financial controls were unlocked by qualification activation';
 END IF;
END
$test$;
RESET ROLE;
SELECT 'XUM qualification exam and withdrawal-lock tests passed' AS result;
