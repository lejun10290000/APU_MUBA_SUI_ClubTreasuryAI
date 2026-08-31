# Stage 6 Approved Claim Payout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn one persisted human-approved `approved_unpaid` claim into exactly one verified Sui Testnet USDC payout, with digest-first recovery and idempotent database finalization.

**Architecture:** Preserve the verified Stage 3 Move package for the MVP. Stage 6 adds a Supabase payment-attempt ledger and a digest-first server relay boundary around the existing wallet-signed payout transaction. The claim remains `approved_unpaid`/`unpaid` until the exact Sui `PayoutEvent` is finalized and one atomic database transaction marks the attempt confirmed, the claim paid, and the budget synchronized exactly once.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Supabase PostgreSQL/RLS, `@mysten/sui` 2.27.0, Sui Testnet native USDC, Vitest, Playwright.

**Spec:** `docs/STAGE6_IMPLEMENTATION_PLAN.md`

## Global Constraints

- Preserve the existing verified Move package unless interruption/reconciliation tests prove the no-upgrade design unsafe.
- Never use AI output, editable form data, or request-body payout fields to override the immutable `approved_*` snapshot.
- A payment may prepare only when `status = approved_unpaid`, `decision = approve`, `payment_status = unpaid`, and all required `approved_*` fields exist.
- Only one active payment attempt may exist per claim.
- Persist the transaction digest before broadcast.
- Ambiguous submission must reconcile by the existing digest; never build a replacement transaction blindly.
- The server may relay wallet-signed bytes but never holds a private key and never signs for the user.
- Never mark a claim paid until Sui finality, exact event verification, and atomic database finalization all succeed.
- Normal CI and mock tests perform zero live Sui payouts.
- Do not use the old Stage 5 positive claim for the live payout unless a read-only check proves its approved category matches the on-chain Treasury. Prefer a new synthetic claim tied to a clean matching Testnet treasury/category.

---

### Task 1: Define the Stage 6 payment domain and repository contract

**Files:**
- Create: `src/domain/stage6-payments.ts`
- Modify: `src/lib/claims/types.ts`
- Modify: `src/lib/claims/index.ts`
- Test: `tests/unit/stage6-payments.test.ts`

**Interfaces:**
- Produces `PaymentAttemptStatus`, `PaymentAttempt`, `ApprovedPayoutSnapshot`, `PreparePaymentResult`, and validation helpers used by repository/API/Sui tasks.
- Extends `ClaimRepository` with Stage 6 operations without changing Stage 5 submission/review behavior.

- [ ] **Step 1: Write failing domain tests**

Cover these behaviors:

```ts
it("accepts only a complete approved-unpaid payout snapshot", () => {
  expect(parseApprovedPayoutSnapshot(validApprovedClaim)).toEqual({
    treasuryObjectId: validApprovedClaim.approvedTreasuryObjectId,
    categoryReference: validApprovedClaim.approvedCategoryReference,
    recipientSuiAddress: validApprovedClaim.approvedRecipientSuiAddress,
    amountMinor: validApprovedClaim.approvedAmountMinor,
    currency: "USDC",
  });
});

it("rejects a claim that is not approved_unpaid and unpaid", () => {
  expect(() => parseApprovedPayoutSnapshot({ ...validApprovedClaim, paymentStatus: "paid" }))
    .toThrow(/not eligible/i);
});

it("recognizes reconciliation_required as an active attempt state", () => {
  expect(isActivePaymentAttemptStatus("reconciliation_required")).toBe(true);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `corepack pnpm vitest run tests/unit/stage6-payments.test.ts`

Expected: FAIL because the Stage 6 payment domain does not exist yet.

- [ ] **Step 3: Implement the minimal domain types and validation**

Define statuses exactly:

```ts
type PaymentAttemptStatus =
  | "prepared"
  | "signed"
  | "submitted"
  | "confirmed"
  | "cancelled"
  | "failed"
  | "reconciliation_required";
```

Treat `prepared`, `signed`, `submitted`, and `reconciliation_required` as active for the one-active-attempt rule.

- [ ] **Step 4: Extend `ClaimRepository` with explicit Stage 6 methods**

Add interfaces for:

```ts
preparePaymentAttempt(claimId: string): Promise<PreparePaymentResult>;
getPaymentAttempt(attemptId: string): Promise<PaymentAttempt | null>;
markPaymentAttemptSigned(attemptId: string, digest: string, treasurerCapObjectId: string): Promise<PaymentAttempt>;
markPaymentAttemptSubmitted(attemptId: string): Promise<PaymentAttempt>;
markPaymentAttemptReconciliationRequired(attemptId: string, code: string): Promise<PaymentAttempt>;
markPaymentAttemptFailed(attemptId: string, code: string): Promise<PaymentAttempt>;
finalizeConfirmedPayment(input: ConfirmedPaymentInput): Promise<PersistedClaim>;
```

- [ ] **Step 5: Run focused + existing claim tests and verify GREEN**

Run: `corepack pnpm vitest run tests/unit/stage6-payments.test.ts tests/unit/claims*.test.ts`

- [ ] **Step 6: Commit**

```bash
git add src/domain/stage6-payments.ts src/lib/claims/types.ts src/lib/claims/index.ts tests/unit/stage6-payments.test.ts
git commit -m "feat(stage6): define payment attempt domain"
```

---

### Task 2: Add the Supabase Stage 6 payment-attempt migration

**Files:**
- Create: `supabase/migrations/<cli-generated>_stage6_claim_payments.sql`
- Modify: generated Supabase database types file used by the repository
- Test: `tests/unit/stage6-payment-schema.test.ts` or the repository's existing migration/RLS test location

**Interfaces:**
- Produces `claim_payment_attempts` and narrowly granted RPCs used by the Supabase repository.
- Preserves Stage 5 immutable approved snapshot fields and receipt evidence.

- [ ] **Step 1: Generate the migration name using the installed Supabase CLI**

Run: `corepack pnpm exec supabase migration new stage6_claim_payments`

Do not invent a timestamp manually.

- [ ] **Step 2: Write failing schema/RLS expectations**

Tests/inspection must require:

```text
claim_payment_attempts table
unique transaction_digest
one-active-attempt partial unique index per claim
RLS enabled
PUBLIC/anon execute revoked for privileged RPCs
auth.uid() + owner/treasurer authorization
paid status/payment constraints
confirmed digest + paid_at evidence
```

- [ ] **Step 3: Implement the migration**

The table must store at minimum:

```text
id uuid primary key
claim_id uuid not null
initiated_by uuid not null
treasurer_cap_object_id text
expected_treasury_object_id text not null
expected_category_reference text not null
expected_recipient_sui_address text not null
expected_amount_minor bigint not null
expected_currency text not null check expected_currency = 'USDC'
transaction_digest text unique
status text not null
failure_code text
created_at timestamptz
updated_at timestamptz
confirmed_at timestamptz
```

Create RPC boundaries for prepare, attempt transition, and confirmed finalization. Finalization must lock in consistent order: claim → attempt → budget category. Network calls stay outside transactions.

- [ ] **Step 4: Regenerate checked-in database types using the repository's existing Supabase workflow**

- [ ] **Step 5: Validate migration and RLS locally/against the configured development path without performing a payout**

- [ ] **Step 6: Run focused tests and verify GREEN**

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations src tests
git commit -m "feat(stage6): add payment attempt persistence"
```

---

### Task 3: Implement mock and Supabase repository Stage 6 state transitions

**Files:**
- Modify: `src/lib/claims/mock-repository.ts`
- Modify: `src/lib/claims/supabase-repository.ts`
- Modify: `src/lib/claims/map-claim.ts` if paid evidence must be mapped
- Test: `tests/unit/claims-stage6-repository.test.ts`

**Interfaces:**
- Consumes domain interfaces from Task 1 and RPC/table schema from Task 2.
- Produces idempotent repository methods for API routes.

- [ ] **Step 1: Write failing repository tests**

Required cases:

```ts
it("prepares exactly one active attempt for an eligible claim", async () => {});
it("returns the existing active attempt on duplicate prepare", async () => {});
it("rejects prepare after claim is paid", async () => {});
it("stores digest before submitted status", async () => {});
it("finalizes the same claim and digest exactly once", async () => {});
it("does not increment budget twice on repeated finalization", async () => {});
```

- [ ] **Step 2: Run tests and verify RED**

- [ ] **Step 3: Implement mock repository transitions first**

The mock path must model the exact production state machine but never call Sui.

- [ ] **Step 4: Implement Supabase repository methods through narrow RPCs**

Do not expose signed bytes/signatures through normal table reads.

- [ ] **Step 5: Run repository + Stage 5 regression tests and verify GREEN**

- [ ] **Step 6: Commit**

```bash
git add src/lib/claims tests/unit/claims-stage6-repository.test.ts
git commit -m "feat(stage6): persist payment attempt state"
```

---

### Task 4: Add prepare/reconcile payment API routes

**Files:**
- Create: `app/api/claims/[claimId]/payment/prepare/route.ts`
- Create: `app/api/claims/[claimId]/payment/reconcile/route.ts`
- Create or modify focused server helpers under `src/lib/claims/payment/`
- Test: `tests/unit/stage6-payment-routes.test.ts`

**Interfaces:**
- `prepare` returns `attemptId` plus immutable approved snapshot only.
- `reconcile` accepts an attempt/claim identifier and queries only the already-persisted digest; it never builds a replacement transaction.

- [ ] **Step 1: Write failing route/service tests**

Cover eligible claim, wrong role/wallet, paid claim, duplicate prepare, reconciliation without digest, and reconciliation-required blocking a new attempt.

- [ ] **Step 2: Run tests and verify RED**

- [ ] **Step 3: Implement prepare route/service**

Require the verified Supabase wallet session and owner/treasurer membership.

- [ ] **Step 4: Implement reconcile route/service with an injected Sui status reader**

In unit tests use a fake reader. No live Sui request in normal CI.

- [ ] **Step 5: Run focused + regression tests and verify GREEN**

- [ ] **Step 6: Commit**

```bash
git add app/api/claims src/lib/claims/payment tests/unit/stage6-payment-routes.test.ts
git commit -m "feat(stage6): add payment prepare and reconcile APIs"
```

---

### Task 5: Separate wallet signing, digest verification, relay, and finality

**Files:**
- Modify: `src/lib/sui/transaction-service.ts`
- Modify: `src/lib/sui/transactions.ts`
- Modify: `src/lib/sui/execution.ts`
- Create: `src/lib/sui/payout-verification.ts`
- Test: `tests/unit/stage6-sui-payout.test.ts`

**Interfaces:**
- Reuses `treasuryTransactionService.buildPayout()`.
- Produces helpers to verify TreasurerCap ownership, validate signed transaction semantics against the immutable snapshot, compute/store digest before relay, and validate the exact `PayoutEvent` after finality.

- [ ] **Step 1: Write failing Sui tests using fake transaction/client data**

Required cases:

```ts
it("builds payout only from approved snapshot values", async () => {});
it("rejects a TreasurerCap for a different treasury", async () => {});
it("rejects wrong network or wrong USDC type", async () => {});
it("requires digest persistence before relay is invoked", async () => {});
it("rejects a successful transaction with mismatched PayoutEvent fields", async () => {});
it("accepts exactly one matching PayoutEvent", async () => {});
```

- [ ] **Step 2: Run tests and verify RED**

- [ ] **Step 3: Implement on-chain capability verification**

Verify connected wallet owns the selected `TreasurerCap<USDC>` and that the cap points to the approved treasury.

- [ ] **Step 4: Refactor execution boundary so signing, digest persistence, submission, and confirmation are separate operations**

Do not change Move code.

- [ ] **Step 5: Implement exact event verification**

Validate treasury ID, category reference, recipient, amount, category remaining, treasury balance, and expected asset.

- [ ] **Step 6: Run Stage 3 + Stage 6 Sui tests and verify GREEN**

- [ ] **Step 7: Commit**

```bash
git add src/lib/sui tests/unit/stage6-sui-payout.test.ts
git commit -m "feat(stage6): add recoverable Sui payout execution"
```

---

### Task 6: Add submit API with digest-first relay and idempotent finalization

**Files:**
- Create: `app/api/claims/[claimId]/payment/submit/route.ts`
- Modify: `src/lib/claims/payment/*`
- Test: `tests/unit/stage6-payment-submit.test.ts`

**Interfaces:**
- Consumes wallet-signed transaction bytes from the client, validates them server-side, persists digest, then relays.
- Returns normalized public status/digest evidence only; never returns signed bytes or signatures.

- [ ] **Step 1: Write failing submit tests**

Cover wallet rejection/no bytes, wrong semantics, digest persistence failure, relay failure before known broadcast, confirmed failure, confirmation timeout, exact event mismatch, successful finalization, and repeated same-digest finalization.

- [ ] **Step 2: Run tests and verify RED**

- [ ] **Step 3: Implement signed transaction semantic verification**

Every transaction field must match the immutable approved snapshot plus verified package/USDC/cap/network configuration.

- [ ] **Step 4: Persist digest and mark signed before any relay call**

- [ ] **Step 5: Relay and transition to submitted**

- [ ] **Step 6: Wait for finality and validate exact event**

Timeout/unknown becomes `reconciliation_required`; it never becomes `failed` merely because the response was lost.

- [ ] **Step 7: Finalize database state exactly once**

Only confirmed matching payout may set claim/payment `paid` and synchronize budget.

- [ ] **Step 8: Run submit + repository + Sui tests and verify GREEN**

- [ ] **Step 9: Commit**

```bash
git add app/api/claims src/lib/claims/payment tests/unit/stage6-payment-submit.test.ts
git commit -m "feat(stage6): submit approved claim payouts safely"
```

---

### Task 7: Add the minimal Stage 6 claim payout UI

**Files:**
- Modify: `src/components/claim-review-panel.tsx`
- Modify related page/client helpers only as necessary
- Test: existing component tests plus `tests/unit/claim-payment-ui.test.tsx`
- Modify: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Shows payout only for `approved_unpaid` claims.
- Uses prepare → wallet sign → submit → reconcile APIs.
- Displays immutable payout snapshot and truthful operational states.

- [ ] **Step 1: Write failing UI tests**

Cover:

```text
no payout button for unapproved/rejected/paid claim
approved_unpaid shows immutable treasury/category/recipient/amount/currency
button disabled during active attempt
wallet rejection leaves Unpaid
submitted/confirming state never says Paid
reconciliation_required shows recovery action, not retry payout
paid shows digest + explorer link and no second payout action
```

- [ ] **Step 2: Run tests and verify RED**

- [ ] **Step 3: Implement the minimum Stage 6 UI without broad visual redesign**

State labels: `Ready`, `Awaiting wallet signature`, `Submitted`, `Confirming`, `Reconciliation required`, `Failed`, `Paid`.

- [ ] **Step 4: Extend Playwright smoke coverage in mock mode**

Verify representative approved-unpaid → simulated paid flow and that no live Sui transaction is made.

- [ ] **Step 5: Run UI + smoke tests and verify GREEN**

- [ ] **Step 6: Commit**

```bash
git add src/components tests
git commit -m "feat(stage6): add approved claim payout UI"
```

---

### Task 8: Full verification, owner-controlled Testnet acceptance, documentation, and PR

**Files:**
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/STAGE6_IMPLEMENTATION_PLAN.md` only for verified implementation notes if needed
- Create: `docs/STAGE6_LIVE_VALIDATION.md`
- Modify: `README.md` if Stage 6 evidence belongs in project setup/demo docs

**Interfaces:**
- Produces the evidence required to mark Stage 6 complete.

- [ ] **Step 1: Run the complete automated suite**

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm test:e2e:smoke
git diff --check
```

Run `sui move test` only if Move code changed; the default plan is no Move change.

- [ ] **Step 2: Validate Supabase migration/RLS/grants/advisors**

No live payout yet.

- [ ] **Step 3: Prepare a clean synthetic Testnet path**

Verify a matching treasury object, confirmed category, small available USDC balance, and wallet-owned matching TreasurerCap before approving the synthetic claim.

- [ ] **Step 4: Execute exactly one small owner-approved Sui Testnet USDC payout**

Record only public/sanitized evidence: claim ID if synthetic and non-sensitive, transaction digest, public object IDs, final statuses, and event verification results. Never record receipt contents, signatures, signed bytes, or secrets.

- [ ] **Step 5: Refresh and reconcile the same digest**

Confirm no second payout occurs and budget/claim state remains idempotently paid.

- [ ] **Step 6: Exercise negative live paths that do not risk funds**

Wallet rejection, wrong wallet/network, duplicate click, and interrupted-confirmation/reconcile path where safely reproducible.

- [ ] **Step 7: Update project status**

Mark Stage 6 complete only if the full live acceptance gate passes. Otherwise keep Stage 6 CURRENT and document the exact remaining blocker.

- [ ] **Step 8: Open a PR and do not self-merge before final audit**

PR title: `Implement Stage 6 approved claim payout`

Include automated verification, live acceptance evidence, explicit no-secrets statement, and whether Move remained unchanged.
