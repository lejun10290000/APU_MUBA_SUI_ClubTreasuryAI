# A2-Lite Live Treasury Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every newly created live treasury workspace activatable into its own funded Sui Testnet `Treasury<USDC>` with a workspace-specific `TreasurerCap`, then carry that exact workspace through member claim submission, real Gemini analysis, human approval, wallet-signed payout, and persisted live History.

**Architecture:** Keep the published Move package unchanged unless a verified contract blocker appears. Add a first-class Supabase activation record and per-workspace TreasurerCap, freeze the budget when activation begins, persist each signed activation digest before broadcast, verify each transaction server-side, and reuse the existing Stage 6/7 payout reconciliation model with the Cap resolved from the claim's workspace instead of global config.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, Zod, Supabase PostgreSQL/Auth/RLS, `@mysten/sui` 2.27.0, `@mysten/dapp-kit-react` 2.1.20, Sui Testnet, native Circle Testnet USDC, `@google/genai` 2.19.0 / `gemini-2.5-flash`, Vitest, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-05-a2-live-treasury-activation-design.md`

## Global Constraints

- Network is **Sui Testnet** only.
- Asset is native Circle Sui Testnet USDC: `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC`.
- Existing Move package remains `0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f` unless a verified blocker requires republish and owner approval.
- AI remains advisory. Gemini never authorizes, signs, or executes payment.
- Production Gemini is live only when `AI_MODE=live`, `GEMINI_LIVE_REQUESTS_ENABLED=true`, and a server-side `GEMINI_API_KEY` exists.
- CI, normal local tests, and normal Playwright tests make zero live Gemini calls and zero real Sui transactions.
- Authoritative money stays integer/minor-unit based; do not introduce floating-point financial arithmetic.
- One owner wallet may own many workspaces, but each activated workspace has one immutable Sui Treasury + TreasurerCap relationship.
- Member payout recipient is the verified connected member wallet; there is no arbitrary recipient field.
- Join is rejected unless the treasury is fully Sui Active.
- Approval and payment stay separate; `Approve · keep unpaid` must not trigger wallet signing.
- A digest-bearing or ambiguous transaction is reconciled; never blindly construct a replacement activation or payout transaction.
- Existing Stage 6/7 treasuries, claims, payment attempts, digests, and paid evidence are preserved untouched.
- Production migration is applied once only after explicit owner authorization.
- Merge to `main` requires exact-head CI success and explicit owner authorization for that exact head SHA.

---

## File Structure Lock

New focused modules should be added rather than expanding the existing large technical demo component:

- `src/lib/treasuries/category-reference.ts` — stable Sui category slug generation and collision validation.
- `src/lib/treasuries/activation-types.ts` — activation DTOs/state machine types.
- `src/lib/treasuries/activation-repository.ts` — Supabase persistence helpers for activation state.
- `src/lib/sui/activation-transactions.ts` — create/fund/allocate transaction builders for A2.
- `src/lib/sui/usdc-coin-selection.ts` — deterministic multi-coin selection helper.
- `src/lib/sui/activation-verification.ts` — server-side Sui verification of create/fund/allocate digests.
- `src/components/treasury-activation-panel.tsx` — judge-facing three-step activation wizard.
- `app/api/treasuries/[treasuryId]/activation/route.ts` — read/start activation state.
- `app/api/treasuries/[treasuryId]/activation/signed/route.ts` — persist signed digest before broadcast.
- `app/api/treasuries/[treasuryId]/activation/reconcile/route.ts` — verify/reconcile a saved digest.
- `app/api/history/route.ts` — authorized real-paid-claim history query.

Existing files to modify include:

- `supabase/migrations/` and `src/lib/supabase/database.types.ts`
- `src/lib/treasuries/types.ts`
- `app/api/treasuries/route.ts`
- `app/api/treasuries/[treasuryId]/budget/route.ts`
- `app/api/treasuries/join/route.ts`
- `src/components/budget-builder.tsx`
- `app/dashboard/budget/page.tsx`
- `src/components/live-claim-submission-form.tsx`
- `src/lib/claims/types.ts`, `src/lib/claims/map-claim.ts`, `src/lib/claims/supabase-repository.ts`
- `src/components/claim-payout-panel.tsx`
- `src/lib/payments/contracts.ts`, `src/lib/payments/server.ts`, `src/lib/payments/preflight.ts`
- `src/components/history-panel.tsx`, `app/dashboard/history/page.tsx`
- `app/api/health/route.ts`, `.env.example`
- `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `README.md`

---

### Task 1: Add first-class activation schema and TypeScript contracts

**Files:**
- Create: `supabase/migrations/20260905_stage8_a2_live_treasury_activation.sql`
- Create: `src/lib/treasuries/activation-types.ts`
- Modify: `src/lib/supabase/database.types.ts`
- Modify: `src/lib/treasuries/types.ts`
- Test: `tests/unit/a2-activation-types.test.ts`

**Interfaces:**
- Produces `ActivationStepStatus`, `TreasurySuiActivation`, and mapped workspace activation fields used by all later tasks.
- `PersistedTreasuryWorkspace` gains `suiTreasurerCapObjectId`, `suiActivationStatus`, `budgetLockedAt`, `activatedAt`, and `activation`.

- [ ] **Step 1: Write the failing type/mapping test**

```ts
import { describe, expect, it } from "vitest";
import { mapPersistedTreasuryWorkspace } from "@/src/lib/treasuries/types";

describe("A2 activation mapping", () => {
  it("does not expose a join code before full Sui activation", () => {
    const workspace = mapPersistedTreasuryWorkspace({
      treasury: {
        id: "t1",
        owner_user_id: "u1",
        external_reference: "apu-event-live",
        name: "APU Event Live",
        currency: "USDC",
        total_budget_minor: 1000,
        sui_treasury_object_id: null,
        sui_treasurer_cap_object_id: null,
        sui_activation_status: "not_started",
        budget_locked_at: null,
        activated_at: null,
        join_code: "ABCD-123456",
        status: "active",
        created_at: "2026-09-05T00:00:00Z",
        updated_at: "2026-09-05T00:00:00Z",
      },
      categories: [],
      role: "owner",
      activation: null,
    });

    expect(workspace.joinCode).toBeUndefined();
    expect(workspace.suiActivationStatus).toBe("not_started");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `pnpm vitest run tests/unit/a2-activation-types.test.ts`

Expected: FAIL because the A2 columns/types and `activation` mapping do not exist yet.

- [ ] **Step 3: Add the forward-only migration**

The migration must:

```sql
alter table public.treasuries
  add column if not exists sui_treasurer_cap_object_id text,
  add column if not exists sui_activation_status text not null default 'not_started',
  add column if not exists budget_locked_at timestamptz,
  add column if not exists activated_at timestamptz;

create unique index if not exists treasuries_sui_cap_unique
  on public.treasuries (sui_treasurer_cap_object_id)
  where sui_treasurer_cap_object_id is not null;

create table if not exists public.treasury_sui_activations (
  treasury_id uuid primary key references public.treasuries(id) on delete cascade,
  owner_wallet_address text not null,
  status text not null default 'not_started',
  create_status text not null default 'not_started',
  create_digest text,
  create_confirmed_at timestamptz,
  fund_status text not null default 'not_started',
  fund_digest text,
  fund_confirmed_at timestamptz,
  allocation_status text not null default 'not_started',
  allocation_digest text,
  allocation_confirmed_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treasury_sui_activation_status_check check (status in ('not_started','in_progress','reconciliation_required','active')),
  constraint treasury_sui_create_status_check check (create_status in ('not_started','signed','submitted','confirmed','reconciliation_required','failed_before_signing')),
  constraint treasury_sui_fund_status_check check (fund_status in ('not_started','signed','submitted','confirmed','reconciliation_required','failed_before_signing')),
  constraint treasury_sui_allocation_status_check check (allocation_status in ('not_started','signed','submitted','confirmed','reconciliation_required','failed_before_signing'))
);
```

Also add RLS so owners can read their own activation record while all state-changing writes remain server-authoritative through server-side code/service-role access. Do not backfill legacy activation rows.

- [ ] **Step 4: Add matching strict TypeScript row types and activation DTOs**

```ts
export type ActivationStepStatus =
  | "not_started"
  | "signed"
  | "submitted"
  | "confirmed"
  | "reconciliation_required"
  | "failed_before_signing";

export type TreasuryActivationStatus =
  | "not_started"
  | "in_progress"
  | "reconciliation_required"
  | "active";

export type TreasurySuiActivation = {
  treasuryId: string;
  ownerWalletAddress: string;
  status: TreasuryActivationStatus;
  createStatus: ActivationStepStatus;
  createDigest: string | null;
  fundStatus: ActivationStepStatus;
  fundDigest: string | null;
  allocationStatus: ActivationStepStatus;
  allocationDigest: string | null;
  activatedAt: string | null;
};
```

- [ ] **Step 5: Update workspace mapping so join code is returned only when active**

Use:

```ts
if (
  (role === "owner" || role === "treasurer") &&
  treasury.sui_activation_status === "active"
) {
  workspace.joinCode = treasury.join_code;
}
```

- [ ] **Step 6: Run the focused test and typecheck**

Run:

```bash
pnpm vitest run tests/unit/a2-activation-types.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260905_stage8_a2_live_treasury_activation.sql src/lib/supabase/database.types.ts src/lib/treasuries/activation-types.ts src/lib/treasuries/types.ts tests/unit/a2-activation-types.test.ts
git commit -m "feat(a2): add per-treasury activation state"
```

---

### Task 2: Freeze stable category references and block budget mutation after activation starts

**Files:**
- Create: `src/lib/treasuries/category-reference.ts`
- Modify: `app/api/treasuries/[treasuryId]/budget/route.ts`
- Modify: `src/components/budget-builder.tsx`
- Test: `tests/unit/a2-category-reference.test.ts`
- Test: `tests/unit/a2-budget-lock.test.ts`

**Interfaces:**
- Produces `toSuiCategoryReference(name: string): string` and `assertUniqueCategoryReferences(names: readonly string[]): void`.
- Budget API rejects writes when `budget_locked_at` is non-null or activation status is not `not_started`.

- [ ] **Step 1: Write failing slug/collision tests**

```ts
expect(toSuiCategoryReference("Food")).toBe("food");
expect(toSuiCategoryReference("Event Marketing")).toBe("event-marketing");
expect(toSuiCategoryReference("Food & Drinks")).toBe("food-drinks");
expect(() =>
  assertUniqueCategoryReferences(["Food & Drinks", "Food Drinks"]),
).toThrow(/same Sui category reference/i);
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm vitest run tests/unit/a2-category-reference.test.ts`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement deterministic category normalization**

```ts
export function toSuiCategoryReference(name: string): string {
  const ref = name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-and-/g, "-");
  if (!ref) throw new Error("Category name must produce a non-empty Sui reference.");
  return ref;
}
```

`assertUniqueCategoryReferences` must compute references and throw on duplicates before the budget RPC executes.

- [ ] **Step 4: Write failing budget-lock API test**

Test a treasury with `sui_activation_status='in_progress'` and assert the budget endpoint returns 409 with a message such as `Budget is locked because Sui activation has started.`

- [ ] **Step 5: Modify the budget endpoint**

Before replacing categories:

```ts
if (
  treasury.budget_locked_at !== null ||
  treasury.sui_activation_status !== "not_started"
) {
  return NextResponse.json(
    { error: "Budget is locked because Sui activation has started." },
    { status: 409 },
  );
}

assertUniqueCategoryReferences(input.categories.map((c) => c.name));
```

Pass stable category references into the existing budget replacement call instead of ordinal references for new A2 workspaces.

- [ ] **Step 6: Update BudgetBuilder UI**

When the returned workspace is locked, disable edits and show `Budget locked · Sui activation in progress/active` rather than presenting editable controls.

- [ ] **Step 7: Run focused tests**

```bash
pnpm vitest run tests/unit/a2-category-reference.test.ts tests/unit/a2-budget-lock.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/treasuries/category-reference.ts app/api/treasuries/[treasuryId]/budget/route.ts src/components/budget-builder.tsx tests/unit/a2-category-reference.test.ts tests/unit/a2-budget-lock.test.ts
git commit -m "feat(a2): freeze stable budget category references"
```

---

### Task 3: Add automatic multi-coin Testnet USDC funding and activation transaction builders

**Files:**
- Create: `src/lib/sui/usdc-coin-selection.ts`
- Create: `src/lib/sui/activation-transactions.ts`
- Modify: `src/lib/sui/transactions.ts`
- Test: `tests/unit/a2-usdc-coin-selection.test.ts`
- Test: `tests/unit/a2-activation-transactions.test.ts`

**Interfaces:**
- Produces `selectUsdcCoins(coins, requiredBalance): SelectedUsdcCoins`.
- Produces `buildActivationCreateTransaction`, `buildActivationFundTransaction`, `buildActivationAllocationTransaction`.

- [ ] **Step 1: Write failing coin-selection tests**

```ts
const selected = selectUsdcCoins(
  [
    { coinObjectId: "0x1", balance: "6000000" },
    { coinObjectId: "0x2", balance: "5000000" },
    { coinObjectId: "0x3", balance: "14000000" },
  ],
  10_000_000n,
);
expect(selected.totalAvailable).toBe(25_000_000n);
expect(selected.selectedBalance >= 10_000_000n).toBe(true);
```

Also test insufficient total balance throws before a transaction is built.

- [ ] **Step 2: Implement deterministic coin selection**

Sort descending by balance, choose the smallest prefix that reaches the required amount, and expose exact totals as `bigint`.

```ts
export type UsdcCoin = { coinObjectId: string; balance: string };
export type SelectedUsdcCoins = {
  selectedIds: string[];
  selectedBalance: bigint;
  totalAvailable: bigint;
};
```

- [ ] **Step 3: Write failing activation transaction tests**

Assert:

- create uses the verified package/module and workspace external reference;
- funding merges multiple selected coins when necessary then splits exactly the required atomic USDC amount;
- allocation receives the frozen dynamic references/amounts with exact matching lengths and no hardcoded `events`.

- [ ] **Step 4: Implement transaction builders**

```ts
export function buildActivationFundTransaction({
  packageId,
  treasuryObjectId,
  usdcCoinType,
  sourceCoinIds,
  amountAtomic,
}: {
  packageId: string;
  treasuryObjectId: string;
  usdcCoinType: string;
  sourceCoinIds: readonly string[];
  amountAtomic: bigint;
}): Transaction {
  if (sourceCoinIds.length === 0) throw new Error("At least one USDC coin is required.");
  const tx = new Transaction();
  const primary = tx.object(sourceCoinIds[0]);
  if (sourceCoinIds.length > 1) {
    tx.mergeCoins(primary, sourceCoinIds.slice(1).map((id) => tx.object(id)));
  }
  const [depositCoin] = tx.splitCoins(primary, [tx.pure.u64(amountAtomic)]);
  tx.moveCall({
    target: `${packageId}::treasury::deposit`,
    typeArguments: [usdcCoinType],
    arguments: [tx.object(treasuryObjectId), depositCoin],
  });
  return tx;
}
```

Reuse existing validated create/confirm logic where possible rather than duplicating Move semantics.

- [ ] **Step 5: Run focused tests and typecheck**

```bash
pnpm vitest run tests/unit/a2-usdc-coin-selection.test.ts tests/unit/a2-activation-transactions.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sui/usdc-coin-selection.ts src/lib/sui/activation-transactions.ts src/lib/sui/transactions.ts tests/unit/a2-usdc-coin-selection.test.ts tests/unit/a2-activation-transactions.test.ts
git commit -m "feat(a2): build resumable treasury activation transactions"
```

---

### Task 4: Implement server-authoritative activation persistence and Sui reconciliation

**Files:**
- Create: `src/lib/treasuries/activation-repository.ts`
- Create: `src/lib/sui/activation-verification.ts`
- Create: `app/api/treasuries/[treasuryId]/activation/route.ts`
- Create: `app/api/treasuries/[treasuryId]/activation/signed/route.ts`
- Create: `app/api/treasuries/[treasuryId]/activation/reconcile/route.ts`
- Test: `tests/unit/a2-activation-api.test.ts`
- Test: `tests/unit/a2-activation-verification.test.ts`

**Interfaces:**
- `startTreasuryActivation({ treasuryId, ownerUserId, ownerWalletAddress })` freezes budget and creates one activation record.
- `recordSignedActivationStep({ treasuryId, step, digest })` persists digest before client broadcast.
- `reconcileActivationStep({ treasuryId, step, digest })` verifies exact chain evidence and advances only that step.

- [ ] **Step 1: Write failing state-machine/API tests**

Cover:

```text
wrong owner wallet → 403
start → budget_locked_at set + activation created
same start repeated → returns existing activation, no duplicate
signed create digest saved → second different create digest rejected
confirmed create → create cannot be signed again
ambiguous digest → reconciliation_required
```

- [ ] **Step 2: Implement activation repository with compare-and-set semantics**

For signed persistence, only allow transitions from `not_started` or the same existing digest. A different digest for a `signed`, `submitted`, `confirmed`, or `reconciliation_required` step must fail closed.

- [ ] **Step 3: Implement Create verification**

Verify transaction sender, success, package/module, created `Treasury<USDC>`, and corresponding wallet-owned `TreasurerCap<USDC>`. Return:

```ts
export type VerifiedCreateActivation = {
  treasuryObjectId: string;
  treasurerCapObjectId: string;
};
```

- [ ] **Step 4: Implement Fund verification**

Verify exact treasury object, exact USDC type, exact expected budget amount, sender, and successful execution. Do not mark confirmed from client-supplied fields alone.

- [ ] **Step 5: Implement Allocation verification**

Read the post-transaction Treasury state and compare category references/allocated amounts against the frozen Supabase categories. If exact evidence is unavailable or mismatched after a success-shaped transaction, return `reconciliation_required`, not retryable failure.

- [ ] **Step 6: Finalize activation atomically after allocation confirmation**

Set:

```text
treasuries.sui_treasury_object_id = verified create Treasury ID
treasuries.sui_treasurer_cap_object_id = verified create Cap ID
treasuries.sui_activation_status = active
treasuries.activated_at = now()
treasury_sui_activations.status = active
```

The link must be immutable; any attempt to replace either object ID returns 409.

- [ ] **Step 7: Run focused tests**

```bash
pnpm vitest run tests/unit/a2-activation-api.test.ts tests/unit/a2-activation-verification.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/treasuries/activation-repository.ts src/lib/sui/activation-verification.ts app/api/treasuries/[treasuryId]/activation tests/unit/a2-activation-api.test.ts tests/unit/a2-activation-verification.test.ts
git commit -m "feat(a2): persist and reconcile Sui activation"
```

---

### Task 5: Add the judge-facing three-step activation wizard to the budget workspace

**Files:**
- Create: `src/components/treasury-activation-panel.tsx`
- Modify: `app/dashboard/budget/page.tsx`
- Modify: `src/components/budget-builder.tsx`
- Modify: `src/lib/treasuries/types.ts`
- Test: `tests/unit/a2-treasury-activation-panel.test.tsx`

**Interfaces:**
- Consumes Task 3 builders and Task 4 APIs.
- Emits no authoritative state locally; UI always reloads persisted activation state after each reconciliation.

- [ ] **Step 1: Write failing UI tests**

Assert these states:

```text
not_started → Activate on Sui button
wrong wallet → owner mismatch message, no sign button
create confirmed → Fund step is next
fund confirmed → Allocate step is next
reconciliation_required → only Check existing transaction action
active → Sui Active + Treasury ID + locked budget + join code
```

- [ ] **Step 2: Implement initial activation load/start**

The component receives `treasuryId`, verifies connected Testnet wallet and owner identity, then POSTs start only after the owner clicks `Activate on Sui`.

- [ ] **Step 3: Implement signed-before-broadcast client sequence**

For every activation step:

```ts
const signed = await dAppKit.signTransaction({ transaction });
const digest = deriveTransactionDigest(signed.bytes);
await persistSignedDigest(step, digest);
await executeSignedTransaction(signed);
await reconcileSavedDigest(step, digest);
```

If persistence fails, do **not** broadcast. If broadcast outcome is ambiguous, preserve the digest and show reconciliation UI.

- [ ] **Step 4: Implement automatic Testnet USDC balance display**

Use wallet-owned native Circle Testnet USDC coins, call `selectUsdcCoins`, and show only:

```text
Required: 10.00 USDC
Available: 38.40 USDC
```

No object-ID selector in judge-facing UI.

- [ ] **Step 5: Remove old A1 linking instructions from the primary workspace**

The technical `/dashboard/testnet` flow may remain for debugging, but the normal budget workspace should guide the new create/fund/allocate activation path.

- [ ] **Step 6: Run UI tests**

```bash
pnpm vitest run tests/unit/a2-treasury-activation-panel.test.tsx
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/treasury-activation-panel.tsx app/dashboard/budget/page.tsx src/components/budget-builder.tsx src/lib/treasuries/types.ts tests/unit/a2-treasury-activation-panel.test.tsx
git commit -m "feat(a2): add guided Sui activation workspace"
```

---

### Task 6: Enforce active-only joining and verified-member payout recipient

**Files:**
- Modify: `app/api/treasuries/join/route.ts`
- Modify: `src/components/member-join-panel.tsx`
- Modify: `src/components/live-claim-submission-form.tsx`
- Modify: `src/lib/claims/types.ts`
- Modify: `src/lib/claims/supabase-repository.ts`
- Test: `tests/unit/a2-active-join.test.ts`
- Test: `tests/unit/a2-recipient-lock.test.tsx`

**Interfaces:**
- Join succeeds only when `sui_activation_status='active'` and both Sui object IDs are non-null.
- Claim submission never accepts a client-controlled arbitrary recipient; repository derives recipient from verified wallet identity.

- [ ] **Step 1: Write failing inactive-join test**

Create a treasury with a valid join code but `sui_activation_status='not_started'`; expect 400/409 with `Treasury is not yet active on Sui.`

- [ ] **Step 2: Modify join lookup**

Add the active-chain conditions before membership insert:

```ts
.eq("sui_activation_status", "active")
.not("sui_treasury_object_id", "is", null)
.not("sui_treasurer_cap_object_id", "is", null)
```

- [ ] **Step 3: Write failing recipient-lock test**

Assert the live claim UI renders the verified connected member wallet as read-only text and has no editable recipient input.

- [ ] **Step 4: Remove recipient from client-authoritative input schema**

On the server/repository, derive:

```ts
recipient_sui_address: identity.walletAddress,
member_wallet_address: identity.walletAddress,
```

Reject submission if the connected wallet identity is not verified or is not a member of the selected active treasury.

- [ ] **Step 5: Run focused tests**

```bash
pnpm vitest run tests/unit/a2-active-join.test.ts tests/unit/a2-recipient-lock.test.tsx
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/treasuries/join/route.ts src/components/member-join-panel.tsx src/components/live-claim-submission-form.tsx src/lib/claims/types.ts src/lib/claims/supabase-repository.ts tests/unit/a2-active-join.test.ts tests/unit/a2-recipient-lock.test.tsx
git commit -m "feat(a2): lock member claims to active treasury wallet identity"
```

---

### Task 7: Resolve payout authorization from the exact workspace TreasurerCap

**Files:**
- Modify: `src/lib/payments/contracts.ts`
- Modify: `src/lib/payments/server.ts`
- Modify: `src/lib/payments/preflight.ts`
- Modify: `src/components/claim-payout-panel.tsx`
- Modify: `app/api/claims/[claimId]/payment/prepare/route.ts`
- Test: `tests/unit/a2-workspace-cap-payout.test.ts`
- Regression: existing Stage 6/7 payment tests

**Interfaces:**
- Payment prepare returns `treasurerCapObjectId` from the claim's exact treasury activation record.
- New A2 payout path never reads global `suiConfig.treasurerCapObjectId`.

- [ ] **Step 1: Write failing per-workspace Cap test**

Create two workspaces with Cap A and Cap B. Prepare a claim under workspace B and assert:

```ts
expect(snapshot.treasurerCapObjectId).toBe("0xCAP_B");
expect(snapshot.treasurerCapObjectId).not.toBe("0xCAP_A");
```

Also test missing/legacy activation data on a new A2 workspace blocks prepare rather than falling back globally.

- [ ] **Step 2: Extend payment prepare contract**

Add:

```ts
treasurerCapObjectId: string;
```

to the server-authoritative prepare response, sourced by joining `claims.treasury_id` to the active treasury row.

- [ ] **Step 3: Preserve immutable approved snapshot authority**

Treasury/category/recipient/amount/currency remain sourced only from the existing `approved_*` fields. The Cap is authorization metadata resolved from the same workspace, not from client input.

- [ ] **Step 4: Update ClaimPayoutPanel**

Replace global Cap lookup with the prepare response value, then keep the existing `verifyTreasurerCap` check against connected owner wallet + approved Treasury.

- [ ] **Step 5: Run new and regression payment tests**

Run:

```bash
pnpm vitest run tests/unit/a2-workspace-cap-payout.test.ts
pnpm vitest run tests/unit --testNamePattern="payment|payout|reconciliation|preflight"
pnpm typecheck
```

Expected: all PASS; Stage 6/7 digest-first safety behavior remains unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/lib/payments/contracts.ts src/lib/payments/server.ts src/lib/payments/preflight.ts src/components/claim-payout-panel.tsx app/api/claims/[claimId]/payment/prepare/route.ts tests/unit/a2-workspace-cap-payout.test.ts
git commit -m "feat(a2): use workspace TreasurerCap for payouts"
```

---

### Task 8: Make Production Gemini explicitly live-or-manual-review with no hidden mock fallback

**Files:**
- Modify: `src/config/env.ts` or the repository's central server env module
- Modify: `src/lib/ai/gemini-service.ts` and/or AI service factory used by claim finalization
- Modify: `app/api/health/route.ts`
- Modify: `.env.example`
- Test: `tests/unit/a2-production-gemini-fallback.test.ts`
- Regression: existing AI adapter tests

**Interfaces:**
- Production live configuration uses Gemini when enabled.
- Provider/config/schema failure returns persisted/manual Review behavior, never a fabricated mock result.

- [ ] **Step 1: Write failing Production failure test**

Given:

```text
APP_ENV=production
AI_MODE=live
GEMINI_LIVE_REQUESTS_ENABLED=true
```

and a Gemini provider exception, assert claim analysis returns/manual-persists `review` with a clear `Gemini analysis was unavailable` reason and does not instantiate/use `MockAIService`.

- [ ] **Step 2: Keep the existing AI service boundary but fail closed**

The factory behavior must be:

```ts
if (config.aiMode === "mock") return new MockAIService();
if (!config.geminiLiveRequestsEnabled) throw new Error("Live Gemini requests are disabled.");
if (!config.geminiApiKey) throw new Error("Gemini API key is not configured.");
return new GeminiAIService(...);
```

Claim finalization catches live-provider failure and constructs a manual-review outcome; it must not call the mock adapter as fallback.

- [ ] **Step 3: Update health readiness**

Health should report:

```json
{
  "ai": {
    "mode": "live",
    "liveRequestsEnabled": true,
    "apiKeyConfigured": true
  }
}
```

without exposing the key.

- [ ] **Step 4: Update `.env.example` comments**

Keep committed defaults safe (`AI_MODE=mock`, live requests false, blank key), while documenting the Production-only live values.

- [ ] **Step 5: Run AI tests**

```bash
pnpm vitest run tests/unit/a2-production-gemini-fallback.test.ts
pnpm vitest run tests/unit --testNamePattern="Gemini|AI"
pnpm typecheck
```

Expected: PASS and zero live provider calls.

- [ ] **Step 6: Commit**

```bash
git add src/config src/lib/ai app/api/health/route.ts .env.example tests/unit/a2-production-gemini-fallback.test.ts
git commit -m "feat(a2): fail Gemini safely to manual review"
```

---

### Task 9: Replace sample History with authorized persisted paid claims

**Files:**
- Create: `app/api/history/route.ts`
- Create: `src/lib/history/types.ts`
- Modify: `src/components/history-panel.tsx`
- Modify: `app/dashboard/history/page.tsx`
- Test: `tests/unit/a2-history-api.test.ts`
- Test: `tests/unit/a2-history-panel.test.tsx`

**Interfaces:**
- `GET /api/history` returns owner-authorized real `paid` claims only, newest first.

- [ ] **Step 1: Write failing API tests**

Assert:

```text
only status=paid
only treasuries owned/managed by authenticated treasurer
ordered by paid_at/confirmed time descending
includes treasuryName, categoryName, amountMinor, recipient, digest, confirmedAt
excludes sample/demoActivity rows
```

- [ ] **Step 2: Implement history query**

Use authenticated user identity and RLS/server authorization. Query persisted claims joined to treasuries/categories/payment evidence. Do not return another treasury's records.

```ts
export type PaidHistoryItem = {
  claimId: string;
  treasuryName: string;
  categoryName: string;
  amountMinor: number;
  recipient: string;
  digest: string;
  confirmedAt: string;
};
```

- [ ] **Step 3: Replace HistoryPanel sample state**

Remove `verifiedDemoEvidence`, `demoActivity`, and session-only decision rendering from the judge-facing paid-history list. Render real API results with a Sui Testnet Explorer link derived from each digest.

- [ ] **Step 4: Write/adjust UI test**

Verify newest payment appears first and the rendered link contains the real returned digest.

- [ ] **Step 5: Run focused tests**

```bash
pnpm vitest run tests/unit/a2-history-api.test.ts tests/unit/a2-history-panel.test.tsx
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/history/route.ts src/lib/history/types.ts src/components/history-panel.tsx app/dashboard/history/page.tsx tests/unit/a2-history-api.test.ts tests/unit/a2-history-panel.test.tsx
git commit -m "feat(a2): show persisted paid treasury history"
```

---

### Task 10: Add full mocked E2E coverage and preserve legacy behavior

**Files:**
- Modify/Create: `tests/e2e/a2-live-treasury-flow.spec.ts`
- Modify: test fixtures/mocks required by current Playwright setup
- Modify: any unit regression fixture files necessary to represent per-workspace Cap and activation state

**Interfaces:**
- Full browser test remains completely mocked: no real wallet signing, Sui broadcast, Supabase production, or Gemini call.

- [ ] **Step 1: Write the E2E scenario**

Cover one uninterrupted flow:

```text
create treasury
→ create balanced Food/Venue/Transportation budget
→ Activate on Sui
→ mocked Create confirmed
→ mocked Fund confirmed
→ mocked Allocation confirmed
→ join code appears
→ member joins
→ member submits 0.10 claim with recipient locked to member wallet
→ AI review appears
→ treasurer Approve · keep unpaid
→ Pay action appears separately
→ mocked payout confirms
→ claim shows Paid
→ History shows the new real-style persisted row/digest
```

- [ ] **Step 2: Add recovery E2E scenario**

Simulate an allocation digest in `reconciliation_required`; refresh; assert Create/Fund are not offered again and only `Check existing transaction` is available.

- [ ] **Step 3: Run Playwright locally in mocked mode**

```bash
AI_MODE=mock GEMINI_LIVE_REQUESTS_ENABLED=false pnpm playwright test tests/e2e/a2-live-treasury-flow.spec.ts
```

Expected: PASS with no external spend/calls.

- [ ] **Step 4: Run all automated gates**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm playwright test
```

Expected: all PASS. If the Windows Next.js cleanup hang recurs after all assertions pass, record it accurately; do not misreport a clean process exit.

- [ ] **Step 5: Verify legacy Stage 7 fixtures/evidence are unchanged**

Search the diff and tests to confirm no rewrite of historical Stage 6/7 Treasury/Cap/digest constants or paid evidence.

- [ ] **Step 6: Commit**

```bash
git add tests
git commit -m "test(a2): cover live treasury activation workflow"
```

---

### Task 11: Update handoff/docs and prepare the migration/deployment review gate

**Files:**
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `README.md`
- Create: `docs/STAGE8_A2_LIVE_TREASURY_RUNBOOK.md`

**Interfaces:**
- Produces the operator runbook for migration, Vercel Gemini configuration, smoke test, video treasury, and judge treasury.

- [ ] **Step 1: Correct stale A1 handoff text**

Update Project Status to reflect that A1 is merged/deployed at `30ae958a1ab221e651a5304cd8c6450184f8e398` and that A2 is current branch work. Preserve Stage 0–7 completion and Stage 8 current status.

- [ ] **Step 2: Document the new judge-facing architecture**

README/Architecture should show:

```text
workspace → three-signature Sui activation → Sui Active
member verified wallet → claim → Gemini + deterministic checks
human approval → separate Pay → workspace TreasurerCap → Sui payout
paid claim → live History
```

- [ ] **Step 3: Write the exact owner-operated deployment runbook**

The runbook must sequence:

```text
1. review migration SQL
2. obtain explicit owner authorization to apply migration
3. apply migration once and record migration history
4. deploy reviewed exact branch head/PR only after owner merge approval
5. set Vercel Production AI_MODE=live
6. set GEMINI_LIVE_REQUESTS_ENABLED=true
7. set GEMINI_API_KEY in Vercel Production only (never in chat/repo)
8. redeploy
9. verify /api/health shows live/enabled/key configured
10. run A2 Smoke Test: 1.00 USDC treasury + 0.01 USDC payout
11. verify Explorer + live History + Stage 7 evidence unchanged
12. record APU Event Demo: 10.00 USDC + 0.10 payout
13. reserve enough Testnet USDC/SUI
14. judge day: create APU Event Live fresh, 10.00 USDC + 0.10 payout
```

- [ ] **Step 4: Run docs/secret checks**

Run repository secret/history audit used by existing Stage 7 process and confirm the Gemini key is absent.

- [ ] **Step 5: Commit**

```bash
git add docs README.md
git commit -m "docs(a2): add activation deployment and demo runbook"
```

---

### Task 12: Final branch verification and owner-controlled production gates

**Files:** No feature-code edits unless verification exposes a defect. Any defect fix must get its own failing test + focused commit before returning to this task.

**Interfaces:**
- Produces a reviewed exact head SHA suitable for PR/owner authorization.

- [ ] **Step 1: Run the final local verification suite**

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm playwright test
```

Expected: PASS or accurately documented environment-only runner issue with all assertions completed.

- [ ] **Step 2: Review `git diff main...HEAD` for scope and secrets**

Confirm:

```text
no private keys/seed phrases
no Gemini key
no Supabase secret
no unintended Move package changes
no hardcoded judge category `events`
no new global TreasurerCap dependency in A2 payout
no legacy payout evidence rewrites
```

- [ ] **Step 3: Open the A2 pull request and wait for CI**

PR title:

```text
feat(a2): activate live per-workspace Sui treasuries
```

PR body must summarize migration, activation safety, per-workspace Cap payout, Gemini behavior, History, and automated verification. Do not merge.

- [ ] **Step 4: Report exact PR head SHA and CI state to the owner**

Do not apply the production migration or merge until the owner separately authorizes those gates.

- [ ] **Step 5: After explicit migration authorization, apply only the reviewed migration once**

Verify schema state and migration history; do not perform smoke transactions yet unless the owner also authorizes the controlled production acceptance.

- [ ] **Step 6: After exact-head merge authorization, merge only that reviewed head**

Then verify post-merge `main` CI and Vercel deployment before changing Production Gemini settings.

- [ ] **Step 7: After explicit smoke-test authorization, run only the 1.00/0.01 USDC acceptance first**

Acceptance success requires:

```text
three distinct activation digests
one Sui Treasury + one TreasurerCap for the smoke workspace
exact 1.00 USDC funding
exact dynamic allocations
member join only after active
real Gemini or explicit manual-review failure
human approved_unpaid before Pay
exactly one 0.01 USDC confirmed payout
live History row with same digest
refresh remains Paid with no second Pay signature
yielded Stage 7 historical evidence unchanged
```

- [ ] **Step 8: Stop after smoke acceptance and report evidence**

Do not automatically create `APU Event Demo` or `APU Event Live`. Those are separate owner-controlled video/judge actions.

---

## Self-Review

### Spec coverage

- Per-workspace Treasury + Cap persistence: Task 1.
- Immutable one-time activation: Tasks 1 and 4.
- Dynamic category slugs/collision rejection: Task 2.
- Budget freeze at first activation: Tasks 2 and 4.
- Three explicit human signatures: Task 5.
- Automatic multi-coin funding: Task 3 and Task 5.
- Digest-first signed-before-broadcast recovery: Tasks 4 and 5.
- Server-side create/fund/allocation verification: Task 4.
- Active-only member joining: Task 6.
- Recipient locked to verified member wallet: Task 6.
- Per-workspace Cap payout: Task 7.
- Preserve Stage 6/7 payout protections: Task 7 and Task 10.
- Production-only real Gemini / no hidden fallback: Task 8.
- Paid-only newest-first History: Task 9.
- Mocked E2E + recovery: Task 10.
- Legacy preservation: Tasks 1, 7, 10, 12.
- Migration/deployment/rehearsal strategy: Tasks 11 and 12.
- Smoke/video/judge treasury amounts: Tasks 11 and 12.

### Placeholder scan

This plan intentionally contains no `TBD`, implementation-later placeholder, or unspecified error-handling step. Every task names concrete files, interfaces, tests, commands, and acceptance behavior.

### Type consistency

Shared names used across tasks are fixed as:

```text
ActivationStepStatus
TreasuryActivationStatus
TreasurySuiActivation
PersistedTreasuryWorkspace.suiTreasurerCapObjectId
PersistedTreasuryWorkspace.suiActivationStatus
selectUsdcCoins
buildActivationCreateTransaction
buildActivationFundTransaction
buildActivationAllocationTransaction
startTreasuryActivation
recordSignedActivationStep
reconcileActivationStep
PaidHistoryItem
```

Executors should preserve these names unless a compile-time conflict with existing code requires a small rename; any such rename must be applied consistently across the plan's dependent interfaces and reviewed before continuing.
