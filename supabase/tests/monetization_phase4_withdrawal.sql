DO $test$
BEGIN
  IF has_function_privilege('authenticated','public.request_withdrawal_with_otp()','EXECUTE')
     OR has_function_privilege('anon','public.request_withdrawal_with_otp()','EXECUTE') THEN
     RAISE EXCEPTION 'Legacy withdrawal endpoint is still callable from clients';
  END IF;
  IF NOT (SELECT qualification_enabled FROM xum_monetization.program_controls WHERE singleton) THEN
     RAISE EXCEPTION 'Qualification pilot did not activate';
  END IF;
  IF (SELECT earnings_enabled OR withdrawals_enabled
      FROM xum_monetization.program_controls WHERE singleton) THEN
     RAISE EXCEPTION 'Qualification accidentally enabled financial settlement';
  END IF;
END
$test$;
SELECT 'Withdrawal RPC freeze + qualification independence passed' AS outcome;
