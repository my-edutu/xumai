-- Phase 4: real qualification assessments; withdrawals and reward posting remain LOCKED.
-- Staging first. Requires foundation + verified admin migrations 001 and 002.
-- Do not apply to an unidentified Supabase project.
BEGIN;

CREATE TABLE IF NOT EXISTS xum_monetization.qualification_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  questions_per_attempt smallint NOT NULL DEFAULT 10 CHECK (questions_per_attempt BETWEEN 10 AND 30),
  max_attempts_per_24h smallint NOT NULL DEFAULT 3 CHECK (max_attempts_per_24h BETWEEN 1 AND 10),
  attempt_minutes smallint NOT NULL DEFAULT 20 CHECK (attempt_minutes BETWEEN 5 AND 90)
);
INSERT INTO xum_monetization.qualification_settings(singleton) VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS xum_monetization.qualification_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL DEFAULT 'general' CHECK (subject ~ '^[a-z][a-z0-9_]{2,48}$'),
  prompt text NOT NULL CHECK (length(btrim(prompt)) BETWEEN 12 AND 1200),
  options jsonb NOT NULL CHECK (
    jsonb_typeof(options)='object'
    AND options ?& ARRAY['A','B','C','D']
    AND options = jsonb_build_object('A',options->'A','B',options->'B','C',options->'C','D',options->'D')
  ),
  correct_choice text NOT NULL CHECK (correct_choice IN ('A','B','C','D')),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text,
  source_reference text UNIQUE CHECK (length(btrim(source_reference)) >= 8)
);
-- Questions/correct choices are inaccessible to browser roles.

CREATE TABLE IF NOT EXISTS xum_monetization.qualification_activation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by text NOT NULL CHECK (requested_by ~ '^user_[A-Za-z0-9]+$'),
  reviewed_by text CHECK (reviewed_by ~ '^user_[A-Za-z0-9]+$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now()+interval '48 hours'),
  approved_at timestamptz,
  request_key text NOT NULL UNIQUE CHECK (length(request_key) BETWEEN 12 AND 128),
  CHECK (reviewed_by IS NULL OR reviewed_by <> requested_by),
  CHECK ((reviewed_by IS NULL AND approved_at IS NULL) OR (reviewed_by IS NOT NULL AND approved_at IS NOT NULL))
);
-- Two independently granted operators, ready question bank, and a published
-- policy are required; there is no button to activate a withdrawal rail.

CREATE TABLE IF NOT EXISTS xum_monetization.qualification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_link_id uuid NOT NULL REFERENCES xum_monetization.contributor_identity_links(id),
  policy_version_id uuid NOT NULL REFERENCES xum_monetization.policy_versions(id),
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started','completed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  correct_count smallint CHECK (correct_count >= 0),
  total_count smallint NOT NULL CHECK (total_count BETWEEN 10 AND 30),
  accuracy_percent numeric(5,2) CHECK (accuracy_percent BETWEEN 0 AND 100),
  submission_key text UNIQUE,
  CHECK ((status='started' AND completed_at IS NULL AND correct_count IS NULL AND accuracy_percent IS NULL AND submission_key IS NULL)
    OR (status='completed' AND completed_at IS NOT NULL AND correct_count IS NOT NULL
      AND accuracy_percent IS NOT NULL AND submission_key IS NOT NULL AND correct_count <= total_count))
);
CREATE INDEX IF NOT EXISTS idx_xum_qual_attempts_person
 ON xum_monetization.qualification_attempts(identity_link_id,started_at DESC);

CREATE TABLE IF NOT EXISTS xum_monetization.qualification_attempt_questions (
  attempt_id uuid NOT NULL REFERENCES xum_monetization.qualification_attempts(id),
  question_id uuid NOT NULL REFERENCES xum_monetization.qualification_questions(id),
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 30),
  answer_choice text CHECK (answer_choice IN ('A','B','C','D')),
  PRIMARY KEY (attempt_id,question_id),
  UNIQUE (attempt_id,position)
);
-- The server snapshots the chosen questions and never exposes correct_choice.

-- Immutable after submission, excluding only tightly-scoped test data operations.
CREATE OR REPLACE FUNCTION xum_monetization.reject_qual_attempt_change()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $function$
BEGIN
  IF TG_OP='DELETE' OR OLD.status='completed'
     OR (OLD.status='started' AND (
       NEW.identity_link_id<>OLD.identity_link_id
       OR NEW.policy_version_id<>OLD.policy_version_id
       OR NEW.started_at<>OLD.started_at
       OR NEW.expires_at<>OLD.expires_at
       OR NEW.total_count<>OLD.total_count)) THEN
    RAISE EXCEPTION 'Qualification assessment history cannot be overwritten';
  END IF;
  RETURN NEW;
END
$function$;
DROP TRIGGER IF EXISTS xum_qualification_attempt_guard ON xum_monetization.qualification_attempts;
CREATE TRIGGER xum_qualification_attempt_guard BEFORE UPDATE OR DELETE
 ON xum_monetization.qualification_attempts FOR EACH ROW
 EXECUTE FUNCTION xum_monetization.reject_qual_attempt_change();

-- Return only the authorised participant's own current attempt and the
-- published prompts/options. Correct answers are NEVER included.
CREATE OR REPLACE FUNCTION xum_monetization.question_payload(p_attempt uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path=pg_catalog,xum_monetization
AS $function$
  SELECT jsonb_build_object(
    'attempt_id',a.id,'expires_at',a.expires_at,'question_count',a.total_count,
    'questions',COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id',q.id,'prompt',q.prompt,'options',q.options,'position',aq.position
       ) ORDER BY aq.position)
       FROM xum_monetization.qualification_attempt_questions aq
       JOIN xum_monetization.qualification_questions q ON q.id=aq.question_id
       WHERE aq.attempt_id=a.id),'[]'::jsonb)
  ) FROM xum_monetization.qualification_attempts a WHERE a.id=p_attempt
$function$;

CREATE OR REPLACE FUNCTION public.start_my_qualification_v1()
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog,public,xum_monetization
AS $function$
DECLARE
 v_claims jsonb; v_sub text; v_link uuid; v_policy uuid; v_attempt uuid;
 v_flags xum_monetization.program_controls%ROWTYPE;
 v_config xum_monetization.qualification_settings%ROWTYPE;
 v_country jsonb; v_count integer;
BEGIN
 v_claims:=auth.jwt();
 v_sub:=v_claims->>'sub';
 IF v_claims->>'role' IS DISTINCT FROM 'authenticated'
    OR v_sub IS NULL OR v_sub !~ '^user_[A-Za-z0-9]+$' THEN
   RAISE EXCEPTION 'Valid Clerk session required' USING ERRCODE='28000';
 END IF;
 SELECT * INTO v_flags FROM xum_monetization.program_controls WHERE singleton;
 IF NOT FOUND OR NOT v_flags.identity_bridge_enabled OR NOT v_flags.qualification_enabled
    OR v_flags.earnings_enabled OR v_flags.withdrawals_enabled THEN
   RETURN jsonb_build_object('status','unavailable','reason','QUALIFICATION_DISABLED');
 END IF;
 SELECT id INTO v_link FROM xum_monetization.contributor_identity_links
  WHERE clerk_subject=v_sub AND link_state='verified' AND verified_at IS NOT NULL FOR UPDATE;
 IF NOT FOUND THEN
   RETURN jsonb_build_object('status','unavailable','reason','IDENTITY_UNVERIFIED');
 END IF;
 SELECT * INTO v_config FROM xum_monetization.qualification_settings WHERE singleton;
 IF NOT FOUND THEN RAISE EXCEPTION 'Missing qualification configuration'; END IF;
 SELECT id INTO v_attempt FROM xum_monetization.qualification_attempts
  WHERE identity_link_id=v_link AND status='started' AND expires_at>now()
  ORDER BY started_at DESC LIMIT 1;
 IF FOUND THEN RETURN xum_monetization.question_payload(v_attempt); END IF;
 SELECT count(*) INTO v_count FROM xum_monetization.qualification_attempts
  WHERE identity_link_id=v_link AND started_at>now()-interval '24 hours';
 IF v_count >= v_config.max_attempts_per_24h THEN
   RETURN jsonb_build_object('status','unavailable','reason','ATTEMPT_LIMIT');
 END IF;
 SELECT count(*) INTO v_count FROM xum_monetization.qualification_questions WHERE active;
 IF v_count < v_config.questions_per_attempt THEN
   RETURN jsonb_build_object('status','unavailable','reason','QUESTION_BANK_UNAVAILABLE');
 END IF;
 v_country:=xum_monetization.latest_verified_signal(v_link,'residence_country');
 SELECT id INTO v_policy FROM xum_monetization.policy_versions
  WHERE status='published' AND effective_at <= now()
    AND (country='*' OR to_jsonb(country)=v_country)
  ORDER BY CASE WHEN country='*' THEN 1 ELSE 0 END,
     effective_at DESC,created_at DESC,id DESC LIMIT 1;
 IF NOT FOUND THEN
   RETURN jsonb_build_object('status','unavailable','reason','POLICY_UNAVAILABLE');
 END IF;
 INSERT INTO xum_monetization.qualification_attempts
  (identity_link_id,policy_version_id,total_count,expires_at)
 VALUES (v_link,v_policy,v_config.questions_per_attempt,
      now()+(v_config.attempt_minutes * interval '1 minute'))
 RETURNING id INTO v_attempt;
 INSERT INTO xum_monetization.qualification_attempt_questions(attempt_id,question_id,position)
 SELECT v_attempt,id,row_number() OVER ()::smallint
 FROM (
   SELECT id FROM xum_monetization.qualification_questions
   WHERE active ORDER BY random() LIMIT v_config.questions_per_attempt
 ) chosen;
 RETURN xum_monetization.question_payload(v_attempt);
END
$function$;

-- Answers must exactly match the server-issued question set. Submissions are
-- idempotent, one-shot, time-boxed, and cannot trigger any wallet posting.
CREATE OR REPLACE FUNCTION public.submit_my_qualification_v1(
 p_attempt_id uuid,p_answers jsonb,p_submission_key text
) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog,public,xum_monetization
AS $function$
DECLARE
 v_claims jsonb; v_sub text; v_link uuid;
 v_attempt xum_monetization.qualification_attempts%ROWTYPE;
 v_flags xum_monetization.program_controls%ROWTYPE;
 v_total integer; v_correct integer; v_accuracy numeric(5,2);
 v_items integer; v_distinct integer; v_result jsonb;
BEGIN
 v_claims:=auth.jwt();
 v_sub:=v_claims->>'sub';
 IF v_claims->>'role' IS DISTINCT FROM 'authenticated'
    OR v_sub IS NULL OR v_sub !~ '^user_[A-Za-z0-9]+$' THEN
   RAISE EXCEPTION 'Valid Clerk session required' USING ERRCODE='28000';
 END IF;
 IF p_submission_key IS NULL OR length(p_submission_key) NOT BETWEEN 12 AND 128
   OR jsonb_typeof(p_answers) IS DISTINCT FROM 'array' THEN
   RAISE EXCEPTION 'Invalid qualification submission' USING ERRCODE='22023';
 END IF;
 SELECT * INTO v_flags FROM xum_monetization.program_controls WHERE singleton;
 IF NOT FOUND OR NOT v_flags.qualification_enabled
   OR v_flags.earnings_enabled OR v_flags.withdrawals_enabled THEN
   RAISE EXCEPTION 'Qualification is disabled' USING ERRCODE='55000';
 END IF;
 SELECT id INTO v_link FROM xum_monetization.contributor_identity_links
   WHERE clerk_subject=v_sub AND link_state='verified';
 IF NOT FOUND THEN RAISE EXCEPTION 'Verified identity required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_attempt FROM xum_monetization.qualification_attempts
   WHERE id=p_attempt_id AND identity_link_id=v_link FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Assessment not found' USING ERRCODE='42501'; END IF;
 IF v_attempt.status='completed' THEN
   IF v_attempt.submission_key<>p_submission_key THEN
     RAISE EXCEPTION 'Assessment already submitted' USING ERRCODE='23505';
   END IF;
   RETURN jsonb_build_object('status','graded','attempt_id',v_attempt.id,
     'accuracy_percent',v_attempt.accuracy_percent,
     'correct',v_attempt.correct_count,'total',v_attempt.total_count);
 END IF;
 IF v_attempt.expires_at <= now() THEN
   RAISE EXCEPTION 'Assessment expired' USING ERRCODE='22023';
 END IF;
 SELECT count(*),count(DISTINCT value->>'question_id')
 INTO v_items,v_distinct FROM jsonb_array_elements(p_answers);
 IF v_items<>v_attempt.total_count OR v_distinct<>v_items OR
    EXISTS (
       SELECT 1 FROM jsonb_array_elements(p_answers) AS response(value)
       WHERE jsonb_typeof(response.value) <> 'object'
          OR (SELECT count(*) FROM jsonb_object_keys(response.value))<>2
          OR NOT response ?& ARRAY['question_id','answer']
          OR jsonb_typeof(response.value->'question_id') <> 'string'
          OR (response.value->>'question_id') !~* '^[a-f0-9-]{36}$'
          OR jsonb_typeof(response.value->'answer') <> 'string'
          OR (response.value->>'answer') NOT IN ('A','B','C','D')
          OR NOT EXISTS (
            SELECT 1 FROM xum_monetization.qualification_attempt_questions aq
            WHERE aq.attempt_id=v_attempt.id
               AND aq.question_id::text=response.value->>'question_id'
          )
    ) THEN
   RAISE EXCEPTION 'Incorrect answer set' USING ERRCODE='22023';
 END IF;
 UPDATE xum_monetization.qualification_attempt_questions aq
 SET answer_choice=response.value->>'answer'
 FROM jsonb_array_elements(p_answers) AS response(value)
 WHERE aq.attempt_id=v_attempt.id AND aq.question_id::text=response.value->>'question_id';
 SELECT count(*),count(*) FILTER(WHERE aq.answer_choice=q.correct_choice)
 INTO v_total,v_correct
 FROM xum_monetization.qualification_attempt_questions aq
 JOIN xum_monetization.qualification_questions q ON q.id=aq.question_id
 WHERE aq.attempt_id=v_attempt.id;
 IF v_total<>v_attempt.total_count THEN
   RAISE EXCEPTION 'Incomplete assessment question set' USING ERRCODE='22023';
 END IF;
 v_accuracy:=round(100.0*v_correct/v_total,2);
 UPDATE xum_monetization.qualification_attempts
 SET status='completed',completed_at=now(),correct_count=v_correct,
     accuracy_percent=v_accuracy,submission_key=p_submission_key
 WHERE id=v_attempt.id;
 -- Authoritative exam scoring is the ONLY producer of these two signals.
 -- No correctness feedback or answer key is returned to the browser.
 INSERT INTO xum_monetization.verified_evidence
  (identity_link_id,signal,signal_value,provenance,evidence_reference)
 VALUES
  (v_link,'graded_qualification_tasks',to_jsonb(v_total),'qualification_scoring','exam:'||v_attempt.id::text||':tasks'),
  (v_link,'qualification_accuracy_percent',to_jsonb(v_accuracy),'qualification_scoring','exam:'||v_attempt.id::text||':accuracy');
 INSERT INTO xum_monetization.audit_events
   (event_key,event_type,actor_subject,identity_link_id,payload)
 VALUES ('exam:'||p_submission_key,'qualification_exam_scored',v_sub,v_link,
   jsonb_build_object('attempt_id',v_attempt.id,'total',v_total,'correct',v_correct));
 RETURN jsonb_build_object('status','graded','attempt_id',v_attempt.id,
    'accuracy_percent',v_accuracy,'correct',v_correct,'total',v_total);
END
$function$;

-- Two independently verified administrators may open qualification. This
-- does not enable paid rewards, withdraw requests, or provider payouts.
CREATE OR REPLACE FUNCTION public.admin_request_qualification_activation_v1(p_request_key text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog,public,xum_monetization
AS $function$
DECLARE v_actor text; v_id uuid;
BEGIN
 v_actor:=xum_monetization.assert_admin_permission('policy_publish');
 IF p_request_key IS NULL OR length(p_request_key) NOT BETWEEN 12 AND 128 THEN
   RAISE EXCEPTION 'Invalid activation request key' USING ERRCODE='22023';
 END IF;
 INSERT INTO xum_monetization.qualification_activation_requests(requested_by,request_key)
 VALUES(v_actor,p_request_key) RETURNING id INTO v_id;
 RETURN jsonb_build_object('request_id',v_id,'state','pending_second_review');
END
$function$;

CREATE OR REPLACE FUNCTION public.admin_confirm_qualification_activation_v1(p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path=pg_catalog,public,xum_monetization
AS $function$
DECLARE v_actor text; v_request xum_monetization.qualification_activation_requests%ROWTYPE;
 v_settings xum_monetization.qualification_settings%ROWTYPE; v_count integer;
BEGIN
 v_actor:=xum_monetization.assert_admin_permission('eligibility_review');
 SELECT * INTO v_request FROM xum_monetization.qualification_activation_requests
 WHERE id=p_request_id FOR UPDATE;
 IF NOT FOUND OR v_request.approved_at IS NOT NULL OR
   v_request.expires_at <= now() OR v_request.requested_by=v_actor THEN
   RAISE EXCEPTION 'Independent unexpired activation approval required' USING ERRCODE='42501';
 END IF;
 SELECT * INTO v_settings FROM xum_monetization.qualification_settings WHERE singleton;
 SELECT count(*) INTO v_count FROM xum_monetization.qualification_questions WHERE active;
 IF v_count < v_settings.questions_per_attempt THEN
   RAISE EXCEPTION 'Insufficient reviewed qualification questions' USING ERRCODE='55000';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM xum_monetization.policy_versions
   WHERE status='published' AND effective_at <= now()) THEN
   RAISE EXCEPTION 'A published active qualification policy is required' USING ERRCODE='55000';
 END IF;
 UPDATE xum_monetization.program_controls
 SET identity_bridge_enabled=true,qualification_enabled=true,modified_at=now()
 WHERE singleton AND earnings_enabled=false AND withdrawals_enabled=false;
 IF NOT FOUND THEN
   RAISE EXCEPTION 'Monetization financial kill switch is not locked' USING ERRCODE='55000';
 END IF;
 UPDATE xum_monetization.qualification_activation_requests
 SET reviewed_by=v_actor,approved_at=now() WHERE id=p_request_id;
 INSERT INTO xum_monetization.audit_events
  (event_key,event_type,actor_subject,payload)
 VALUES ('activation:'||p_request_id::text,'qualification_activated',v_actor,
  jsonb_build_object('request_id',p_request_id,'initiated_by',v_request.requested_by,
    'earnings_enabled',false,'withdrawals_enabled',false));
 RETURN jsonb_build_object('state','qualification_active',
    'earnings_enabled',false,'withdrawals_enabled',false);
END
$function$;

-- Never allow self-service users to view the bank or change answer keys.
REVOKE ALL ON ALL TABLES IN SCHEMA xum_monetization FROM PUBLIC,anon,authenticated;
ALTER TABLE xum_monetization.qualification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.qualification_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.qualification_activation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.qualification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE xum_monetization.qualification_attempt_questions ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA xum_monetization TO service_role;
REVOKE ALL ON FUNCTION xum_monetization.question_payload(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION xum_monetization.question_payload(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.start_my_qualification_v1() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.start_my_qualification_v1() TO authenticated;
REVOKE ALL ON FUNCTION public.submit_my_qualification_v1(uuid,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_my_qualification_v1(uuid,jsonb,text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_request_qualification_activation_v1(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_request_qualification_activation_v1(text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_confirm_qualification_activation_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_confirm_qualification_activation_v1(uuid) TO authenticated;

COMMIT;
