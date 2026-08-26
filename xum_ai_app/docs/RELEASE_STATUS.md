# XUM AI release status

Updated 2026-08-26.

## Ready in the repository

- `npm run build` now runs the canonical Expo/Metro web export used by Vercel.
- Web environment validation fails clearly when publishable Supabase or Clerk values are missing.
- The client TypeScript gate passes, and the unit gate covers web font loading and OTP format validation.
- Native font assets are kept out of the browser code path.
- The Vite config no longer embeds Gemini or other private AI credentials.
- Withdrawal completion is fail-closed and requires server verification for the specific withdrawal ID; no hard-coded or client-only OTP is accepted.
- API-key generation uses cryptographic random bytes, stores only a digest, scopes keys by company, and removes public read access from the documented SQL policies.
- Client-side media checks are explicitly labeled as heuristics/unavailable; they cannot be treated as authoritative quality approval.
- Prompt Genius no longer fabricates local AI output or deployment success; it requires the authenticated `generate-prompts` Edge Function and server-side `GEMINI_API_KEY`.
- Withdrawal requests now enter through an authenticated `request-withdrawal` Edge Function; the database challenge RPC stores only a digest and rolls back escrow if email delivery fails.

## Blocked before production launch

The configured Supabase project (`gkhemshbwmealgxczykk`) could not be reached during the read-only verification run (`fetch failed`). Until connectivity is restored and staging is available, these items cannot be certified:

- Apply and test the API-key policy migration and the `verify_withdrawal_otp` RPC.
- Deploy and authenticated-test the `generate-prompts` Edge Function with a server-only Gemini key.
- Deploy and authenticated-test `request-withdrawal` with `RESEND_API_KEY`/`RESEND_FROM_EMAIL`, including expiry, retry lockout, and delivery rollback.
- Configure the server-side OTP delivery provider, expiration, retry limits, and payout provider/webhooks.
- Generate database types from the live schema and verify RLS with contributor, company, admin, and anonymous sessions.
- Resolve and verify the identity contract: the canonical root schema uses UUID `users.id` values linked to `auth.users`, while Clerk user IDs are string identifiers; the Clerk-to-Supabase JWT/mapping strategy must be proven before authenticated flows can be certified.
- Run end-to-end contributor, company, and admin journeys against seeded staging data.

## Product work still required

- Server-owned audio/image/video quality analysis and persisted analyzer results.
- Atomic database-backed validation task claiming, gold tasks, validator accuracy, and consensus reward idempotency.
- Real company team invitations/roles, marketplace purchases, signed dataset exports, and audit trails.
- Admin moderation/fraud workflows, notification deep links, privacy/account deletion, and operational runbooks.
- Accessibility/performance pass and either a separate Vite runtime repair or removal of the optional Vite path.

These are tracked in [`ROADMAP.md`](./ROADMAP.md) and should remain release blockers rather than being represented by mock or simulated success states.
