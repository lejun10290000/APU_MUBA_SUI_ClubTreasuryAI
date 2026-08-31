# Stage 6 Implementation Plan — Approved Claim to Sui Payment

Stage 6 is **CURRENT for planning only**. This document defines the boundary that must be reviewed before implementation begins. It does not authorize a payout, modify Supabase, or change the verified Move deployment.

## Stage 5 Input Contract

Stage 6 starts only from a persisted claim with:

```text
status = approved_unpaid
decision = approve
payment_status = unpaid
approved_treasury_object_id
approved_category_reference
approved_recipient_sui_address
approved_amount_minor
approved_currency = USDC
```

The `approved_*` values are immutable and are the only source for payout treasury, category, recipient, amount, and currency. AI output, editable form data, request payload values, and current receipt extraction must never override the approved snapshot.

## Important Preflight Finding

The current Stage 5 live-positive claim used the `marketing` category, while the previously verified Stage 3 demo Treasury was confirmed with the `events` category. Do **not** attempt to pay that accepted Stage 5 claim unless a read-only Testnet check proves its approved treasury and category match the actual on-chain object.

The Stage 6 live test should preferably use a fresh synthetic claim tied to a clean Testnet Treasury whose object ID, category reference, allocation, remaining balance, and owning TreasurerCap are verified before approval.

## Recommended MVP Architecture

```text
Approved-unpaid claim
        ↓
Server prepares one payment attempt under a row lock
        ↓
Client reads only the immutable approved snapshot
        ↓
Connected Testnet treasurer selects a matching wallet-owned TreasurerCap
        ↓
App builds exactly one payout transaction
        ↓
Wallet explicitly signs once
        ↓
Server validates signed transaction semantics and computes its digest
        ↓
Digest/attempt is persisted before Sui submission
        ↓
Signed transaction is relayed to Sui Testnet
        ↓
Finality and exact PayoutEvent fields are verified
        ↓
One short database transaction marks paid and synchronizes budget state
```

The server may relay a wallet-signed transaction, but it must never hold a private key or sign for the user.

## Payment State Machine

Keep the claim financially truthful:

```text
approved_unpaid + unpaid
    └─ confirmed matching Testnet payout → paid + paid
```

Use a separate payment-attempt record for operational states:

```text
prepared
  ├─ wallet rejected → cancelled
  └─ exact signed bytes validated; digest stored → signed
       ├─ submitted to Testnet → submitted
       │    ├─ matching confirmed success → confirmed
       │    ├─ checkpointed failure → failed
       │    └─ confirmation unknown → reconciliation_required
       └─ not broadcast and digest absent after a bounded check → failed
```

Rules:

- only one active attempt may exist per claim
- `unpaid` remains true until a confirmed matching on-chain payout is verified
- `reconciliation_required` blocks a new transaction; it never means paid or failed
- a checkpointed failure may be retried through a new attempt
- an ambiguous submission must be reconciled by its existing digest before any retry
- once paid, all future prepare/submit/finalize calls return the existing confirmed result

## Planned Supabase Migration

Create the migration with the Supabase CLI command discovered through `supabase migration new --help`; do not invent the timestamp manually.

The migration should:

1. Extend claim status/payment constraints to allow a terminal paid state while preserving the immutable approved snapshot.
2. Add public payment evidence to the claim or a joined payment record: confirmed transaction digest and paid timestamp.
3. Add a `claim_payment_attempts` table with UUID primary key, indexed foreign keys, the initiating user, selected public TreasurerCap object ID, expected approved snapshot fields, transaction digest, attempt status, timestamps, and safe normalized failure metadata.
4. Add a unique digest constraint and a partial unique index that permits at most one active attempt per claim.
5. Enable RLS and permit authorized treasury members to read only attempts for accessible treasuries.
6. Keep attempt writes behind narrowly granted RPCs/server routes. Any `SECURITY DEFINER` function must set an empty search path, check `auth.uid()` and treasurer role explicitly, revoke default `PUBLIC`/`anon` execution, and grant only the intended authenticated call.
7. Use short database transactions. Never hold a row lock while calling Sui or waiting for wallet input.
8. Finalize in a single short transaction with a consistent lock order: claim, payment attempt, then budget category.
9. Make finalization idempotent for the same claim and digest.
10. Update `budget_categories.spent_minor` only after verified finality, preferably from the confirmed event's `category_remaining` value after validating it against the stored allocation.

Do not expose signed transaction bytes or wallet signatures through normal table reads. If the relay design temporarily persists executable signed material for crash recovery, keep it server-only, minimize retention, clear it after settlement, and document the risk before implementation.

## Planned API Boundaries

Suggested route responsibilities:

- `POST /api/claims/[claimId]/payment/prepare`
  - require the verified Supabase wallet session
  - require owner/treasurer membership
  - lock and validate the approved-unpaid claim
  - create or return the one active attempt and immutable snapshot
- `POST /api/claims/[claimId]/payment/submit`
  - validate the attempt and authenticated wallet
  - decode and validate the exact signed transaction against the approved snapshot, configured package, USDC type, Testnet network, and selected TreasurerCap
  - compute the digest from exact transaction bytes and persist it before broadcast
  - relay, wait for finality, and validate the exact `PayoutEvent`
- `POST /api/claims/[claimId]/payment/reconcile`
  - query the existing digest only
  - finalize a confirmed matching payout or retain a safe non-terminal state
  - never build a replacement transaction while the outcome is ambiguous

Every response must use normalized, non-secret errors and must not return signed bytes, signatures, private receipt URLs, or server credentials.

## Sui Integration Work

Reuse the verified Stage 3 foundations:

- `treasuryTransactionService.buildPayout()`
- Testnet-only wallet/network guard
- configured package and native Testnet USDC type
- confirmed-transaction wait boundary
- typed explorer URL helper

Required changes:

1. Discover a wallet-owned `TreasurerCap<USDC>` and verify on-chain that it belongs to the approved treasury and connected treasurer.
2. Build the payout exclusively from `approved_*` values plus the verified capability object ID.
3. Separate signing, digest persistence/submission, and confirmation so a digest is not lost when confirmation is interrupted.
4. Parse exactly one matching `PayoutEvent` and validate treasury ID, category reference, recipient, amount, category remaining, and treasury balance.
5. Treat wallet rejection, execution failure, confirmation timeout, event mismatch, and database synchronization failure as distinct states.

The current Move `PayoutEvent` does not contain a claim reference, and the `payout` entry point has no claim-level idempotency key. The initial Stage 6 implementation should preserve the verified package only if the digest-first attempt ledger and no-blind-retry rule are accepted as sufficient. If safe reconciliation cannot be demonstrated, stop and review a Move package upgrade that adds an opaque claim reference before enabling retries.

## UI Work

On the existing claim review page:

- show the payout action only for `approved_unpaid` claims
- display the immutable recipient, category, amount, treasury, and currency before signing
- require a connected Sui Testnet wallet that matches an authorized treasurer
- show separate states for ready, awaiting signature, submitted, confirming, reconciliation required, failed, and paid
- disable duplicate clicks while an attempt is active
- after confirmation, show the transaction digest and Testnet explorer link
- never show paid before server-side finality/event verification and atomic database finalization succeed

## Automated Verification

Add unit/integration coverage for:

- only approved-unpaid claims can prepare payment
- non-treasurer and wrong-wallet attempts are rejected
- payout input uses only immutable approved values
- wrong network, invalid capability, event mismatch, and insufficient budget fail safely
- wallet rejection leaves the claim unpaid
- digest is persisted before broadcast
- the same digest finalizes idempotently
- a second active attempt or second payout after paid is rejected
- ambiguous confirmation routes to reconciliation and blocks blind retry
- database finalization updates claim/payment evidence and budget exactly once
- mock mode performs no live Sui transaction
- existing Stage 3 and Stage 5 behavior remains green

Run lint, strict TypeScript, unit/integration tests, production build, Playwright smoke tests, Move tests when Move code changes, migration validation, RLS/advisor checks, formatting, and `git diff --check`.

## Owner-Controlled Live Acceptance

Use only synthetic data and a small Testnet amount.

1. Verify the new migration, RLS, grants, indexes, and generated database types.
2. Create or select a clean Testnet Treasury with a matching wallet-owned TreasurerCap and funded/confirmed category.
3. Submit and approve one new synthetic claim whose approved snapshot exactly matches that on-chain treasury/category.
4. Sign one explicit wallet transaction.
5. Confirm one Testnet USDC payout and exact `PayoutEvent`.
6. Confirm claim/payment status becomes paid only after finality, the digest/explorer link is stored, and budget state changes exactly once.
7. Refresh and reconcile by the same digest; confirm no second payout occurs.
8. Exercise wallet rejection, wrong wallet/network, insufficient category balance, duplicate-click, and interrupted-confirmation paths.

## Exit Criteria

Stage 6 is complete only when the approved-claim-to-Testnet-USDC workflow succeeds end to end, retries cannot create an uncontrolled second payout, uncertain outcomes reconcile by digest, database budget state changes only after verified on-chain success, AI cannot bypass approval, and the owner-controlled live evidence is recorded.
