-- Withdrawal freeze for XUM qualification pilot.
-- STAGING FIRST. This revokes direct browser access to known legacy withdrawal
-- entry points. It does not mutate wallet balances, existing payout requests or
-- incoming funding. Verify all live functions/roles BEFORE production apply.
BEGIN;
DO $block$
DECLARE f record;
BEGIN
 FOR f IN
   SELECT p.oid::regprocedure AS signature
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.prokind='f'
     AND p.proname IN (
       'request_withdrawal_with_otp','verify_withdrawal_otp',
       'initiate_withdrawal','create_withdrawal_request','withdraw_funds',
       'withdraw_earnings','execute_withdrawal','process_withdrawal',
       'finalize_withdrawal_batch'
     )
 LOOP
   EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',f.signature);
 END LOOP;
END
$block$;
-- Note: no new payout service implementation; this is a protective deny-list,
-- not proof that all legacy finance endpoints are closed. Audit live pg_proc,
-- payment provider webhooks and service-role paths before release.
COMMIT;
