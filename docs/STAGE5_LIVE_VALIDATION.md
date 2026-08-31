# Stage 5 Live Supabase Validation

Stage 5 is implemented and verified locally, but it remains **CURRENT** until this owner-controlled acceptance gate passes against a real Supabase project. Use only a synthetic receipt. Do not use a real member's private financial evidence.

## Preconditions

1. Resume the Supabase project and wait until its status is healthy.
2. In Supabase Auth settings, enable Anonymous Sign-ins for the MVP wallet-auth bridge.
3. Keep `AI_MODE=mock` and `GEMINI_LIVE_REQUESTS_ENABLED=false`; this validation does not need a Gemini call.
4. Confirm `.env.local` is ignored and contains the live project URL, publishable key, server-only secret, and `NEXT_PUBLIC_CLAIM_DATA_MODE=live`.
5. Never paste, print, commit, or screenshot the server secret.

## Apply and Verify the Schema

1. Apply `supabase/migrations/20260830163748_stage5_claim_receipt_workflow.sql` to the owner-controlled project.
2. Confirm the tables `wallet_profiles`, `wallet_nonces`, `treasuries`, `treasury_members`, `budget_categories`, and `claims` exist.
3. Confirm RLS is enabled on all six public tables.
4. Confirm the `receipts` bucket exists, is private, limits files to 10 MB, and accepts only JPEG, PNG, and WebP.
5. Regenerate `src/lib/supabase/database.types.ts` from the applied live schema and compare it with the checked-in contract.
6. Run Supabase security and performance advisors; resolve any finding caused by this migration or record why it is not applicable.

## Run the Human Browser Check

1. Start the app and open `http://localhost:3000/dashboard/claims/new`.
2. Connect a Sui Testnet wallet. The live app should ask for one message signature to bind the wallet identity; this is not a transaction and costs no gas. Standard key and zkLogin wallets are supported, with zkLogin verified through Sui Testnet GraphQL.
3. Enter a unique external reference and valid treasury/category setup values.
4. Enter a valid Sui recipient, member name, description, merchant, and positive USDC amount.
5. Attach a small synthetic JPEG, PNG, or WebP receipt and submit once.
6. Confirm the app shows one persisted claim and does not show success for any half-finished submission.
7. Reopen the claim review page and confirm the member, amount, category, description, receipt summary, AI result, deterministic checks, duplicate result, recommendation, and reasons are present.
8. Enter a short human decision note, approve the claim, and confirm the UI says **Approved — payment not yet executed**.

## Inspect Supabase Evidence

For the submitted claim, verify:

- exactly one claim row exists for the external/idempotency reference
- `receipt_hash` is 64 lowercase hexadecimal characters
- `receipt_path`, MIME type, and byte size are stored
- the Storage object exists only in the private `receipts` bucket
- no permanent public receipt URL exists
- analysis, duplicate evidence, recommendation, and reasons are persisted
- the human decision, decision note, and decision timestamp are persisted
- `approved_treasury_object_id`, `approved_category_reference`, `approved_recipient_sui_address`, `approved_amount_minor`, and `approved_currency` are populated
- `payment_status` remains `unpaid`

## Negative Checks

1. Submit the same external reference again: no second payable claim or uncontrolled receipt object may be created.
2. Submit the same receipt bytes with a new external reference: the result must be non-Approve.
3. Try an oversized or unsupported file: the request must fail before success is shown.
4. Use an invalid recipient address: validation must reject it.
5. Confirm an AI failure/invalid output path leaves the claim persisted in manual Review.
6. Confirm receipt evidence fields cannot be changed after creation.
7. Confirm an approved payout snapshot cannot be changed after approval.

## Forbidden Stage 5 Side Effects

During every check:

- no wallet transaction approval popup
- no Sui transaction construction or execution
- no Testnet payout
- no transaction digest
- no `paid` status

## Completion Record

Record the date, Supabase project reference (never a secret), migration version, synthetic claim ID, receipt object path, receipt hash, recommendation, human decision, and final unpaid status in `docs/PROJECT_STATUS.md` or the Stage 5 handoff report.

Positive-path acceptance passed on 31 August 2026 against project `arldlnqiywhcuungvgei`. The sanitized claim/storage/recommendation/decision record and advisor dispositions are recorded in `docs/PROJECT_STATUS.md`. Live check 2 passed when the same receipt bytes under a new request reference produced an exact-duplicate `Reject` claim that remained unpaid. Transaction-wrapped live checks 6 and 7 also passed: the receipt-evidence and approved-payout-snapshot triggers rejected mutations, the transaction was rolled back, and the claim remained unchanged. Negative checks 1, 3, 4, and 5 remain outstanding.

Only after every item passes may the team mark Stage 5 COMPLETE and plan Stage 6.
