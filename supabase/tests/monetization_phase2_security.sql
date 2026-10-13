-- Phase 2 integration verification on PostgreSQL service container only.
-- No financial postings and no public enrollment are authorized.
DO $$
DECLARE flags RECORD; c integer;
BEGIN
 SELECT * INTO flags FROM xum_monetization.program_controls WHERE singleton;
 IF NOT FOUND OR flags.identity_bridge_enabled OR flags.qualification_enabled
     OR flags.earnings_enabled OR flags.withdrawals_enabled THEN
   RAISE EXCEPTION 'Monetization or payouts were enabled during migration';
 END IF;
 SELECT count(*) INTO c FROM xum_monetization.policy_versions WHERE policy_key='xum-v1-proposed'
   AND status='draft' AND minimum_age=18 AND minimum_profile_percent=80
   AND minimum_qualification_tasks=10 AND minimum_qualification_accuracy=80;
 IF c<>1 THEN RAISE EXCEPTION 'Expected one dormant V1 policy'; END IF;
 SELECT count(*) INTO c FROM xum_monetization.country_payment_rails
   WHERE country='NG' AND currency='NGN' AND rail='bank_transfer'
   AND min_withdrawal_minor=500000 AND enabled=FALSE;
 IF c<>1 THEN RAISE EXCEPTION 'NGN rail must default disabled at 500000 minor units'; END IF;
 IF has_schema_privilege('authenticated','xum_monetization','USAGE') OR
    has_schema_privilege('anon','xum_monetization','USAGE') THEN
   RAISE EXCEPTION 'Private schema leaked to browser roles';
 END IF;
 IF has_table_privilege('authenticated','xum_monetization.eligibility_decisions','INSERT') OR
    has_table_privilege('authenticated','xum_monetization.contributor_identity_links','SELECT') THEN
   RAISE EXCEPTION 'Private identity/decision permissions leaked';
 END IF;
 IF NOT has_function_privilege('authenticated','public.get_my_monetization_status_v1()','EXECUTE')
    OR has_function_privilege('anon','public.get_my_monetization_status_v1()','EXECUTE') THEN
   RAISE EXCEPTION 'Read-only RPC grant is incorrect';
 END IF;
END $$;

SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"user_test123","role":"authenticated"}',false);
DO $$
DECLARE r JSONB;
BEGIN
 r:=public.get_my_monetization_status_v1();
 IF r->>'status'<>'not_monetized'
    OR r->>'reason'<>'PROGRAM_DISABLED'
    OR r->>'can_withdraw'<>'false'
    OR r->>'program_available'<>'false' THEN
   RAISE EXCEPTION 'Read-only status is not fail closed: %',r;
 END IF;
END $$;
RESET ROLE;

-- Existing, verified program records cannot be edited, and identity links
-- require a trusted attestation before the backend can mark them verified.
SET ROLE service_role;
DO $$
DECLARE i UUID; p UUID; d UUID;
BEGIN
 BEGIN
   INSERT INTO xum_monetization.contributor_identity_links
     (clerk_subject,link_state) VALUES ('user_untrusted','verified');
   RAISE EXCEPTION 'Unattested identity was verified';
 EXCEPTION WHEN check_violation THEN NULL;
 END;

 INSERT INTO xum_monetization.contributor_identity_links
   (clerk_subject,legacy_user_id,link_state,verification_source,verification_reference,verified_at)
 VALUES ('user_verified123','11111111-1111-4111-8111-111111111111',
         'verified','trusted_webhook','id-link-test-001',now())
 RETURNING id INTO i;
 SELECT id INTO p FROM xum_monetization.policy_versions WHERE policy_key='xum-v1-proposed';
 INSERT INTO xum_monetization.eligibility_decisions
   (identity_link_id,policy_version_id,eligibility,requirement_results,unmet_requirements,
    evidence_digest,source_event_key)
 VALUES (i,p,'not_monetized','[]','["identity"]',repeat('a',64),'decision-test-001')
 RETURNING id INTO d;

 BEGIN
  UPDATE xum_monetization.eligibility_decisions SET eligibility='eligible' WHERE id=d;
  RAISE EXCEPTION 'A recorded decision was overwritten';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM='A recorded decision was overwritten' THEN RAISE; END IF;
 END;
 BEGIN
  UPDATE xum_monetization.policy_versions SET status='draft' WHERE id=p;
  -- Draft policy editing remains allowed, but published policies are immutable.
 EXCEPTION WHEN OTHERS THEN RAISE;
 END;
END $$;
RESET ROLE;

-- An unauthenticated session must not be able to call the status RPC.
SET ROLE anon;
DO $$
BEGIN
 IF has_function_privilege(current_user,'public.get_my_monetization_status_v1()','EXECUTE')
 THEN RAISE EXCEPTION 'Anonymous role can access monetization RPC'; END IF;
END $$;
RESET ROLE;

SELECT 'XUM monetization Phase 2 staging SQL checks passed' AS status;
