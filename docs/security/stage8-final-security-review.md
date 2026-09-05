# Stage 8 Final Security Review

Date: 2026-09-05

## Scope

Final submission-focused review of the live ClubTreasury AI boundaries touched by Stage 8: claim access, treasurer decisions, receipt privacy, Gemini/Supabase secrets, approved-payment snapshots, Sui payout evidence, Supabase RLS, and exposed SECURITY DEFINER RPCs.

No production schema migration or authorization change was applied during this review.

## Application authorization

- Live claim repositories are constructed only after `requireSupabaseUserId` succeeds and the session resolves to a verified wallet principal with `resolveVerifiedWalletIdentity`.
- Claim decision routes delegate to the authenticated repository; the database `decide_claim` RPC independently requires `public.can_manage_treasury(claim_row.treasury_id)`.
- Member submission remains a separate flow from treasurer decision and payout controls.
- Receipt previews are generated through the authorized receipt URL helper and remain private rather than public objects.

## AI and server secrets

- Gemini calls remain server-side through `@google/genai`.
- `/api/health` exposes only safe booleans such as `apiKeyConfigured`, plus the non-secret configured model name. It never returns the Gemini API key, Supabase secret key, database credentials, wallet private keys, or auth tokens.
- Gemini remains advisory: budget generation returns an editable draft only, and receipt analysis cannot approve, reject, sign, or execute a payout.

## Payment integrity

- Claim approval persists an approved snapshot containing the treasury object, category reference, recipient address, amount, and currency.
- Payout construction consumes the approved snapshot rather than mutable claim form fields.
- Approval and payment remain separate states: `approved_unpaid` precedes any wallet signature.
- The wallet signature is explicit and the claim becomes paid only after Sui finality/event reconciliation succeeds.
- Existing reconciliation behavior prevents blind duplicate payout retries when chain state is uncertain.

## Supabase security advisor findings

The production project `arldlnqiywhcuungvgei` was reviewed with the Supabase security advisor on 2026-09-05.

### RLS enabled with no policy

`public.wallet_nonces` has RLS enabled but no policy. This is currently treated as a deny-by-default table rather than an exposure. No policy was added during final polish because the existing server workflow does not require direct browser-table access.

Remediation reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

### Authenticated SECURITY DEFINER RPC warnings

The advisor flags `can_access_treasury`, `can_manage_treasury`, `current_wallet_user_id`, `decide_claim`, `finalize_claim_payment`, `prepare_claim_payment`, `replace_treasury_budget`, and `transition_claim_payment_attempt` because authenticated users can execute SECURITY DEFINER functions.

These warnings were reviewed rather than blindly revoked. The application intentionally uses authenticated RPCs for privileged operations while the functions perform internal identity/role/state checks. Revoking them without an architectural replacement would break the live application. Any future hardening should move helper-only functions out of the exposed API surface or narrow grants individually after dedicated regression testing.

Remediation reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

### Anonymous-access-policy advisor warnings

The advisor reports policies on `budget_categories`, `claim_payment_attempts`, `claims`, `treasuries`, `treasury_members`, `treasury_sui_activations`, `wallet_profiles`, and `storage.objects` as potentially available to roles that permit anonymous sign-ins. The policy predicates still rely on the wallet/session authorization model, but this deserves a separate authorization-policy review if anonymous Supabase Auth sign-in is ever enabled for production users.

No RLS policy was changed during submission polish because the current live flow is already smoke-tested and the advisor output alone is not sufficient evidence that a specific policy is exploitable.

Advisor reference: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins

### Leaked password protection

Supabase reports leaked-password protection disabled. ClubTreasury currently authenticates the product flow through wallet-linked sessions rather than asking users to create product passwords, so this was not changed during the feature branch. It should be enabled if password-based Supabase Auth becomes part of the production user journey.

Remediation reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Result

No new critical application vulnerability was identified that requires a Stage 8 production migration. Existing high-value boundaries remain intact: authenticated verified-wallet identity, role-checked decisions, private receipt evidence, immutable payout snapshots, explicit wallet signatures, and finality-before-paid reconciliation.

The remaining advisor warnings are documented follow-up items, not silently ignored issues. Any privilege/RLS changes should be isolated, regression-tested, and separately approved rather than bundled into judge-facing polish.
