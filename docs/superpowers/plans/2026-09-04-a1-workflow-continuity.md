# A1 Workflow Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Treasury → Budget → Claims a single persisted Supabase workflow, enable the Member join-code path, and keep approval/payout safely blocked until each treasury is linked to its own verified Sui Treasury.

**Architecture:** Live mode stops using browser-session Treasury/Budget state as the source of truth and instead persists treasuries/categories in Supabase under the verified wallet principal. Claims select a persisted treasury by database id and may exist while `sui_treasury_object_id` is null; approval/payment remains impossible until an owner links a verified Testnet Treasury/Cap pair. Existing Stage 6/7 linked rehearsal data and payment-safety code remain backward compatible.

**Tech Stack:** Next.js App Router, React, TypeScript, Zod, Supabase/Postgres/RLS/RPC, Mysten Sui dApp Kit/Testnet, Vitest, Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-04-a1-workflow-continuity-design.md`

## Global Constraints

- Do not create a new Sui Treasury automatically during Treasury creation.
- Do not fund a Sui Treasury automatically.
- Do not reuse the Stage 6/7 rehearsal Sui Treasury for newly created app treasuries.
- Do not weaken payment preflight, immutable approved snapshots, finality checks, duplicate-payment protection, or reconciliation behavior.
- Do not require a second wallet just to test the product.
- Do not enable live Gemini requests as part of this change.
- Existing Stage 6/7 treasury/category/claim/payment identifiers must remain unchanged.
- `sui_treasury_object_id = null` must prevent approval, payment preparation, wallet signing, submission, and reconciliation for that new treasury.
- The existing two-role screen remains; Treasurer can also submit claims; Member uses join code.
- No merge to `main` without explicit owner approval after green CI.

---

## File Structure

### New files

- `supabase/migrations/20260904170000_stage8_a1_workflow_continuity.sql` — nullable Sui link fields, join codes, safe budget-replacement RPC, approval/payment guards.
- `src/lib/treasuries/join-code.ts` — join-code normalization/generation helper.
- `src/lib/treasuries/types.ts` — persisted treasury/category DTOs shared by routes/UI.
- `app/api/treasuries/route.ts` — authenticated list/create.
- `app/api/treasuries/join/route.ts` — authenticated join-code membership creation.
- `app/api/treasuries/[treasuryId]/budget/route.ts` — authenticated atomic budget persistence.
- `app/api/treasuries/[treasuryId]/link-sui/route.ts` — owner-only verified Sui link.
- `app/member/page.tsx` — Member join/claim entry.
- `src/components/member-join-panel.tsx` — wallet-aware join-code UI.
- `tests/unit/a1-join-code.test.ts` — pure join-code behavior.
- `tests/unit/a1-workspace-continuity.test.ts` — nullable link/workspace mapping behavior.
- `tests/unit/a1-unlinked-payment-guard.test.ts` — server/UI guard regressions.
- `tests/unit/a1-member-join.test.ts` — member join authorization/non-downgrade behavior.

### Modified files

- `src/lib/supabase/database.types.ts` — nullable Sui ids + `join_code` + RPC typings.
- `src/domain/stage5-claims.ts` — claim workspace and persisted claim allow nullable treasury object id and carry treasury database id.
- `src/lib/claims/live-workspace.ts` — workspace includes `treasuryId`, `joinCode` only when supplied, nullable `treasuryObjectId`.
- `src/lib/claims/supabase-repository.ts` — validate/load persisted treasury by id; never create/update treasury/categories during claim submission.
- `app/api/claims/workspace/route.ts` — load by treasury id rather than fixed Sui object id.
- `src/components/live-claim-submission-form.tsx` — accessible treasury selector + explicit `?treasury=` preference + unlinked badge.
- `src/components/treasury-creation-form.tsx` — live persistence path.
- `src/components/budget-builder.tsx` — live persisted budget path.
- `app/dashboard/treasury/new/page.tsx` — live copy.
- `app/dashboard/budget/page.tsx` — live copy.
- `app/login/page.tsx` — enable Member card.
- `src/components/claim-review-panel.tsx` — disable approval with clear unlinked message.
- `src/components/claim-payout-panel.tsx` — defensive no-sign/no-pay unlinked guard.
- `tests/e2e/smoke.spec.ts` — role + continuity smoke coverage.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `docs/STAGE8_SUBMISSION_PACKAGE.md` — final product narrative.

---

### Task 1: Add the A1 database migration and generated TypeScript shape

**Files:**
- Create: `supabase/migrations/20260904170000_stage8_a1_workflow_continuity.sql`
- Modify: `src/lib/supabase/database.types.ts`
- Test: `tests/unit/a1-workspace-continuity.test.ts`
- Test: `tests/unit/stage7c-wallet-principal-migration.test.ts`

**Interfaces:**
- Produces nullable `treasuries.sui_treasury_object_id`, unique `treasuries.join_code`, nullable `claims.treasury_object_id`.
- Produces RPC `replace_treasury_budget(p_treasury_id uuid, p_categories jsonb)` returning `setof public.budget_categories`.
- Preserves existing `decide_claim`, `prepare_claim_payment`, and payment finalization interfaces while adding explicit unlinked guards.

- [ ] **Step 1: Write failing type/migration tests**

Add assertions that the new migration contains the required safety clauses and that workspace mapping accepts an unlinked treasury.

```ts
it("maps an unlinked persisted treasury without inventing a Sui object", () => {
  expect(
    mapLiveClaimWorkspace(
      {
        id: "11111111-1111-4111-8111-111111111111",
        external_reference: "orientation-2026",
        name: "Orientation Night 2026",
        total_budget_minor: 150000,
        sui_treasury_object_id: null,
      },
      [{ external_reference: "food", name: "Food", allocated_minor: 50000, spent_minor: 0 }],
    ),
  ).toMatchObject({
    treasuryId: "11111111-1111-4111-8111-111111111111",
    treasuryObjectId: null,
    name: "Orientation Night 2026",
  });
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
corepack pnpm vitest run tests/unit/a1-workspace-continuity.test.ts tests/unit/stage7c-wallet-principal-migration.test.ts
```

Expected: FAIL because nullable fields/migration do not exist yet.

- [ ] **Step 3: Write migration**

Migration requirements:

```sql
alter table public.treasuries
  alter column sui_treasury_object_id drop not null;

alter table public.claims
  alter column treasury_object_id drop not null;

alter table public.treasuries
  add column join_code text;

update public.treasuries
set join_code = upper(substr(replace(external_reference, '-', ''), 1, 4)) || '-' || upper(substr(md5(id::text), 1, 6))
where join_code is null;

alter table public.treasuries
  alter column join_code set not null;

alter table public.treasuries
  add constraint treasuries_join_code_unique unique (join_code);

alter table public.treasuries
  add constraint treasuries_join_code_check
  check (join_code ~ '^[A-Z0-9]{4}-[A-Z0-9]{6}$');
```

Replace the existing object-id constraints with nullable-safe checks:

```sql
check (
  sui_treasury_object_id is null
  or sui_treasury_object_id ~ '^0x[0-9a-f]{64}$'
)
```

and equivalent nullable-safe claim check.

Create `replace_treasury_budget` as a security-definer function that:

1. rejects callers for whom `public.can_manage_treasury(p_treasury_id)` is false;
2. rejects if any claim exists for the treasury;
3. requires a non-empty JSON array;
4. rejects non-positive/non-integer allocations;
5. rejects blank or duplicate normalized category names;
6. requires exact sum equal to `treasuries.total_budget_minor`;
7. deletes existing categories and inserts the new list in one transaction/function call;
8. derives stable external references using `lower(regexp_replace(btrim(name), '[^a-zA-Z0-9]+', '-', 'g'))` plus index suffix if needed;
9. returns inserted categories ordered by creation/id.

Update `decide_claim` so `p_decision='approve'` raises:

```sql
raise exception 'Link this treasury to Sui before approval';
```

when the claim treasury has `sui_treasury_object_id is null`.

Update `prepare_claim_payment` with a second explicit check that the approved claim's treasury link is non-null and equals `approved_treasury_object_id` before creating an attempt.

- [ ] **Step 4: Update database TypeScript types**

Use:

```ts
export type TreasuryRow = {
  // existing fields...
  join_code: string;
  sui_treasury_object_id: string | null;
};

export type ClaimRow = {
  // existing fields...
  treasury_object_id: string | null;
};
```

Add RPC typing:

```ts
replace_treasury_budget: {
  Args: { p_treasury_id: string; p_categories: Json };
  Returns: BudgetCategoryRow[];
};
```

- [ ] **Step 5: Run focused tests**

```bash
corepack pnpm vitest run tests/unit/a1-workspace-continuity.test.ts tests/unit/stage7c-wallet-principal-migration.test.ts tests/unit/domain-schemas.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260904170000_stage8_a1_workflow_continuity.sql src/lib/supabase/database.types.ts tests/unit/a1-workspace-continuity.test.ts tests/unit/stage7c-wallet-principal-migration.test.ts
git commit -m "feat(a1): add persisted off-chain treasury schema"
```

---

### Task 2: Add join-code helper and authenticated treasury list/create APIs

**Files:**
- Create: `src/lib/treasuries/join-code.ts`
- Create: `src/lib/treasuries/types.ts`
- Create: `app/api/treasuries/route.ts`
- Test: `tests/unit/a1-join-code.test.ts`
- Test: `tests/unit/a1-treasury-api.test.ts`

**Interfaces:**
- Produces `normalizeJoinCode(value: string): string`.
- Produces `generateJoinCode(randomBytes?: Uint8Array): string`.
- `GET /api/treasuries` returns `{ treasuries: PersistedTreasuryWorkspace[] }`.
- `POST /api/treasuries` accepts `{ name: string; totalBudgetMinor: number }` and returns `{ treasury: PersistedTreasuryWorkspace }`.

- [ ] **Step 1: Write failing join-code tests**

```ts
expect(normalizeJoinCode(" ori1-ab12cd ")).toBe("ORI1-AB12CD");
expect(generateJoinCode(new Uint8Array([1, 2, 3, 4, 5]))).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{6}$/);
```

- [ ] **Step 2: Run and confirm failure**

```bash
corepack pnpm vitest run tests/unit/a1-join-code.test.ts
```

- [ ] **Step 3: Implement helper and DTOs**

`PersistedTreasuryWorkspace` must include:

```ts
export type PersistedTreasuryWorkspace = {
  id: string;
  externalReference: string;
  name: string;
  totalBudgetMinor: number;
  suiTreasuryObjectId: string | null;
  linkedToSui: boolean;
  joinCode?: string;
  role: "owner" | "treasurer" | "member";
  categories: PersistedBudgetCategory[];
};
```

- [ ] **Step 4: Write API tests with mocked Supabase identity/client**

Cover:

- unauthenticated create rejected;
- verified wallet owner creates treasury with `sui_treasury_object_id: null`;
- creator gets owner membership;
- GET returns owner/member accessible rows only;
- `joinCode` is returned only for owner/treasurer role.

- [ ] **Step 5: Implement `app/api/treasuries/route.ts`**

POST algorithm:

```ts
const client = await createServerSupabaseClient();
const sessionUserId = await requireSupabaseUserId(client);
const identity = await resolveVerifiedWalletIdentity({
  sessionUserId,
  adminClient: createAdminSupabaseClient(),
});
```

Validate with Zod:

```ts
z.object({
  name: z.string().trim().min(1).max(120),
  totalBudgetMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
```

Generate `external_reference = crypto.randomUUID()` and retry join-code insert on Postgres `23505` up to five times. Insert treasury without `RETURNING`, then select it by `(owner_user_id, external_reference)` and insert `treasury_members` role `owner`.

GET loads treasuries visible via RLS, memberships for current user, and category summaries; owner field counts as `owner` even if explicit membership is absent for historical rows.

- [ ] **Step 6: Run tests**

```bash
corepack pnpm vitest run tests/unit/a1-join-code.test.ts tests/unit/a1-treasury-api.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/treasuries app/api/treasuries/route.ts tests/unit/a1-join-code.test.ts tests/unit/a1-treasury-api.test.ts
git commit -m "feat(a1): add persisted treasury API"
```

---

### Task 3: Add atomic live budget persistence

**Files:**
- Create: `app/api/treasuries/[treasuryId]/budget/route.ts`
- Modify: `src/lib/treasuries/types.ts`
- Test: `tests/unit/a1-budget-api.test.ts`
- Test: `tests/unit/budget-rules.test.ts`

**Interfaces:**
- `PUT /api/treasuries/:treasuryId/budget` accepts `{ categories: Array<{name:string; allocationMinor:number}> }`.
- Calls `replace_treasury_budget` RPC.
- Returns persisted categories.

- [ ] **Step 1: Write failing API tests**

Include:

```ts
it("rejects an unbalanced live budget before calling the RPC", async () => {
  // treasury total 150000, categories sum 140000
  // expect 400 and replace_treasury_budget not called
});
```

and owner/member authorization cases.

- [ ] **Step 2: Run and verify failure**

```bash
corepack pnpm vitest run tests/unit/a1-budget-api.test.ts tests/unit/budget-rules.test.ts
```

- [ ] **Step 3: Implement route**

Use existing `checkBudgetTotal` and integer minor-unit inputs. Query the treasury through the authenticated user client first, require manager role via `client.rpc("can_manage_treasury", { p_treasury_id: treasuryId })`, then call:

```ts
await client.rpc("replace_treasury_budget", {
  p_treasury_id: treasuryId,
  p_categories: categories.map((category) => ({
    name: category.name.trim(),
    allocated_minor: category.allocationMinor,
  })),
});
```

- [ ] **Step 4: Run focused tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/treasuries/[treasuryId]/budget/route.ts src/lib/treasuries/types.ts tests/unit/a1-budget-api.test.ts tests/unit/budget-rules.test.ts
git commit -m "feat(a1): persist balanced treasury budgets"
```

---

### Task 4: Refactor Claims to consume persisted treasury ids and support unlinked claims

**Files:**
- Modify: `src/domain/stage5-claims.ts`
- Modify: `src/lib/claims/live-workspace.ts`
- Modify: `src/lib/claims/supabase-repository.ts`
- Modify: `app/api/claims/workspace/route.ts`
- Modify: `src/components/live-claim-submission-form.tsx`
- Test: `tests/unit/a1-workspace-continuity.test.ts`
- Test: `tests/unit/live-claim-workspace.test.ts`
- Test: `tests/unit/live-claim-submission-auth.test.tsx`
- Test: `tests/unit/claim-workflow.test.ts`

**Interfaces:**
- `claimWorkspaceSchema` gains `treasuryId: z.string().uuid()`.
- `treasuryObjectId` becomes `treasurySuiObjectIdSchema.nullable()`.
- `PersistedClaim.treasuryObjectId` becomes nullable before approval/payment.
- `GET /api/claims/workspace?treasuryId=<uuid>` loads exact persisted treasury.

- [ ] **Step 1: Write failing schema/workspace tests**

```ts
expect(claimWorkspaceSchema.parse({
  treasuryId: "11111111-1111-4111-8111-111111111111",
  externalReference: "orientation-2026",
  name: "Orientation Night 2026",
  totalBudgetMinor: 150000,
  treasuryObjectId: null,
  categories: [{ externalReference: "food", name: "Food", allocatedMinor: 50000, spentMinor: 0 }],
})).toMatchObject({ treasuryObjectId: null });
```

- [ ] **Step 2: Run and confirm failure**

```bash
corepack pnpm vitest run tests/unit/a1-workspace-continuity.test.ts tests/unit/live-claim-workspace.test.ts tests/unit/claim-workflow.test.ts
```

- [ ] **Step 3: Change `mapLiveClaimWorkspace`**

Treasury input becomes:

```ts
type TreasuryRecord = {
  id: string;
  external_reference: string;
  name: string;
  total_budget_minor: number;
  sui_treasury_object_id: string | null;
};
```

Return includes `treasuryId: treasury.id` and nullable object id.

- [ ] **Step 4: Refactor claim workspace API**

Replace `treasuryObjectId` query with UUID `treasuryId`. Use RLS-backed `.eq("id", treasuryId)` and active status. Keep explicit membership/owner validation and category loading.

- [ ] **Step 5: Refactor `SupabaseClaimRepository.ensureWorkspace`**

Delete the old behavior that creates a treasury or writes categories from claim payload.

New algorithm:

1. select `treasuries` by `submission.workspace.treasuryId` through user client;
2. require active and accessible row;
3. assert external reference, name, total budget and nullable Sui object id equal the client workspace snapshot;
4. select persisted categories for the treasury;
5. find selected category by external reference;
6. assert the selected category name/allocation/spend match persisted values;
7. return persisted ids/amounts only.

This ensures claim submission can never mutate budget data.

- [ ] **Step 6: Update live claim UI**

On wallet identity success, fetch `/api/treasuries`. Select:

1. `?treasury=<uuid>` if accessible;
2. otherwise first accessible treasury.

Show treasury selector when more than one exists. Load `/api/claims/workspace?treasuryId=<id>` for the selection.

Display:

```tsx
{workspace.treasuryObjectId ? (
  <span>Linked to Sui Testnet</span>
) : (
  <span>Not linked to Sui yet · claims and review are available, payout is locked</span>
)}
```

Claim payload uses nullable `treasuryObjectId` and the exact persisted `treasuryId`.

- [ ] **Step 7: Run focused claim tests**

```bash
corepack pnpm vitest run tests/unit/a1-workspace-continuity.test.ts tests/unit/live-claim-workspace.test.ts tests/unit/live-claim-submission-auth.test.tsx tests/unit/claim-workflow.test.ts tests/unit/stage5-claims.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/domain/stage5-claims.ts src/lib/claims/live-workspace.ts src/lib/claims/supabase-repository.ts app/api/claims/workspace/route.ts src/components/live-claim-submission-form.tsx tests/unit
git commit -m "feat(a1): connect claims to persisted treasury workspace"
```

---

### Task 5: Convert live Treasury and Budget screens from local preview to persisted flow

**Files:**
- Modify: `src/components/treasury-creation-form.tsx`
- Modify: `src/components/budget-builder.tsx`
- Modify: `app/dashboard/treasury/new/page.tsx`
- Modify: `app/dashboard/budget/page.tsx`
- Test: `tests/unit/a1-treasury-form.test.tsx`
- Test: `tests/unit/a1-budget-form.test.tsx`
- Test: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- In live mode Treasury POSTs to `/api/treasuries`, then routes `/dashboard/budget?treasury=<id>`.
- In live mode Budget PUTs to `/api/treasuries/<id>/budget`, then routes `/dashboard/claims/new?treasury=<id>`.
- Existing mock/session behavior remains only when claim data mode is mock.

- [ ] **Step 1: Write failing UI tests**

Treasury form test verifies live mode calls:

```ts
expect(fetch).toHaveBeenCalledWith("/api/treasuries", expect.objectContaining({ method: "POST" }));
expect(push).toHaveBeenCalledWith("/dashboard/budget?treasury=11111111-1111-4111-8111-111111111111");
```

Budget form verifies exact persisted categories and route to Claims.

- [ ] **Step 2: Run focused tests and confirm failure**

```bash
corepack pnpm vitest run tests/unit/a1-treasury-form.test.tsx tests/unit/a1-budget-form.test.tsx
```

- [ ] **Step 3: Implement live Treasury path**

Use `publicConfig.claimDataMode === "live"`. In live mode require current account and call `ensureWalletIdentity` before POST. Keep integer minor-unit parsing via `parseUsdcDisplay`.

Change live copy from `Create demo treasury`/`local preview` to `Create treasury`/`Saved workspace`; keep mock labels only in mock mode.

- [ ] **Step 4: Implement live Budget path**

Read treasury id from `useSearchParams`. Fetch `/api/treasuries`, find the exact id and use its persisted total/name. On confirm send integer allocations to budget endpoint.

If treasury id is missing/inaccessible, show a safe error and link back to Treasury/dashboard; do not fall back silently to mock `demoTreasury` in live mode.

- [ ] **Step 5: Update E2E continuity smoke**

Add a mock-network smoke path that verifies the visible sequence:

`Orientation Night 2026 -> 1500 -> Food/Marketing/Venue/Catering -> Claims shows Orientation Night 2026 and Food`.

- [ ] **Step 6: Run UI/E2E tests**

```bash
corepack pnpm vitest run tests/unit/a1-treasury-form.test.tsx tests/unit/a1-budget-form.test.tsx
corepack pnpm exec playwright test tests/e2e/smoke.spec.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/components/treasury-creation-form.tsx src/components/budget-builder.tsx app/dashboard/treasury/new/page.tsx app/dashboard/budget/page.tsx tests/unit/a1-treasury-form.test.tsx tests/unit/a1-budget-form.test.tsx tests/e2e/smoke.spec.ts
git commit -m "feat(a1): persist treasury and budget UI flow"
```

---

### Task 6: Enable Member workspace and safe join-code membership

**Files:**
- Create: `app/api/treasuries/join/route.ts`
- Create: `app/member/page.tsx`
- Create: `src/components/member-join-panel.tsx`
- Modify: `app/login/page.tsx`
- Test: `tests/unit/a1-member-join.test.ts`
- Test: `tests/unit/a1-member-join-panel.test.tsx`
- Test: `tests/e2e/smoke.spec.ts`

**Interfaces:**
- `POST /api/treasuries/join` accepts `{ joinCode: string }`.
- Returns `{ treasury: PersistedTreasuryWorkspace }`.
- Existing owner/treasurer role is never downgraded to member.

- [ ] **Step 1: Write failing join authorization tests**

Cases:

- unauthenticated/unsigned wallet principal rejected;
- unknown/closed join code rejected;
- new verified wallet becomes `member`;
- existing `owner` remains `owner`;
- existing `treasurer` remains `treasurer`;
- member can then load the treasury through normal RLS-backed GET.

- [ ] **Step 2: Run and confirm failure**

```bash
corepack pnpm vitest run tests/unit/a1-member-join.test.ts
```

- [ ] **Step 3: Implement join route**

Authenticate with the same server session + `resolveVerifiedWalletIdentity` pattern. Because a non-member cannot select the treasury through normal RLS, use the admin client only for the narrow lookup by normalized join code and active status.

Then inspect existing membership with admin client. Only insert `{ role: "member" }` when no row exists. Never update an existing row to member.

Return the joined treasury through the normal authenticated list/mapper logic after membership exists.

- [ ] **Step 4: Implement Member page/panel**

Flow:

1. wallet control;
2. verified identity;
3. join-code input;
4. success card with treasury name/categories;
5. CTA to `/dashboard/claims/new?treasury=<id>`.

- [ ] **Step 5: Enable Member card on login**

Replace disabled `<div>` with `<Link href="/member">`. Copy:

`Join a club treasury and submit a receipt-backed reimbursement claim.`

Keep Treasurer card enabled and update stale mock-only copy.

- [ ] **Step 6: Add E2E role smoke**

Assert both cards are enabled and Member routes to join flow.

- [ ] **Step 7: Run tests and commit**

```bash
corepack pnpm vitest run tests/unit/a1-member-join.test.ts tests/unit/a1-member-join-panel.test.tsx
corepack pnpm exec playwright test tests/e2e/smoke.spec.ts
git add app/api/treasuries/join/route.ts app/member/page.tsx src/components/member-join-panel.tsx app/login/page.tsx tests/unit tests/e2e/smoke.spec.ts
git commit -m "feat(a1): enable member join-code claim portal"
```

---

### Task 7: Add defense-in-depth unlinked approval/payment guards

**Files:**
- Modify: `src/components/claim-review-panel.tsx`
- Modify: `src/components/claim-payout-panel.tsx`
- Modify: `src/lib/claims/supabase-repository.ts`
- Test: `tests/unit/a1-unlinked-payment-guard.test.ts`
- Test: `tests/unit/claim-payment-ui.test.tsx`
- Test: `tests/unit/stage7b-payment-preflight.test.ts`
- Test: `tests/unit/stage6-payment-api-contracts.test.ts`

**Interfaces:**
- Server SQL guard from Task 1 remains authoritative.
- UI never invokes decision approve or payment prepare/sign for an unlinked claim.

- [ ] **Step 1: Write failing UI/server regression tests**

UI test:

```ts
expect(screen.getByText(/Link this treasury to Sui before approval/i)).toBeInTheDocument();
expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
```

Client-flow test spies on signing/preflight and asserts zero calls for null treasury object id.

- [ ] **Step 2: Run and confirm failure**

```bash
corepack pnpm vitest run tests/unit/a1-unlinked-payment-guard.test.ts tests/unit/claim-payment-ui.test.tsx tests/unit/stage7b-payment-preflight.test.ts
```

- [ ] **Step 3: Implement review guard**

When `claim.treasuryObjectId === null` and claim is under review:

- Reject stays enabled.
- Approve disabled.
- Message: `Link this treasury to its own Sui Treasury before approval. Claim review is safe to continue, but no payout snapshot can be created yet.`

- [ ] **Step 4: Implement payout defensive guard**

If a malformed/stale API response reaches payout UI without a treasury object id, render no Pay button and do not call payment prepare/preflight/sign methods.

- [ ] **Step 5: Run all payment-safety regressions**

```bash
corepack pnpm vitest run tests/unit/a1-unlinked-payment-guard.test.ts tests/unit/claim-payment-ui.test.tsx tests/unit/stage6-payment-api-contracts.test.ts tests/unit/stage6-payment-client-flow.test.ts tests/unit/stage6-payment-repository.test.ts tests/unit/stage6-sui-payment-safety.test.ts tests/unit/stage7b-payment-preflight.test.ts
```

Expected: PASS with existing linked rehearsal behavior unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/components/claim-review-panel.tsx src/components/claim-payout-panel.tsx src/lib/claims/supabase-repository.ts tests/unit
git commit -m "fix(a1): block approval and payout before Sui link"
```

---

### Task 8: Add owner-only verified Sui link step without changing payout implementation

**Files:**
- Create: `app/api/treasuries/[treasuryId]/link-sui/route.ts`
- Modify: `src/components/testnet-treasury-panel.tsx`
- Modify: `src/lib/treasuries/types.ts`
- Test: `tests/unit/a1-sui-link.test.ts`
- Test: `tests/unit/sui-transactions.test.ts`
- Test: `tests/unit/stage7b-payment-preflight.test.ts`

**Interfaces:**
- POST body: `{ treasuryObjectId: string; treasurerCapObjectId: string }`.
- Link endpoint verifies owner/treasurer management, Testnet object compatibility, and Cap ownership/relation before storing the object id.
- It does not create/fund/allocate automatically.

- [ ] **Step 1: Write failing link tests**

Cover:

- member cannot link;
- owner can link only with connected wallet owning the Cap;
- Cap must authorize exactly the supplied Treasury object;
- Treasury object must be the deployed `Treasury<USDC>` package type and shared as expected;
- existing non-null different link cannot be silently overwritten;
- same-id idempotent relink returns success.

- [ ] **Step 2: Run and verify failure**

```bash
corepack pnpm vitest run tests/unit/a1-sui-link.test.ts
```

- [ ] **Step 3: Implement link route using existing verification helpers**

Use `verifyTreasurerCap(...)` from `src/lib/sui/treasurer-cap-verification.ts` with:

```ts
{
  capObjectId: body.treasurerCapObjectId,
  connectedWalletAddress: identity.walletAddress,
  approvedTreasuryObjectId: body.treasuryObjectId,
  packageId: publicConfig.suiPackageId,
  coinType: publicConfig.usdcCoinType,
}
```

Also fetch the Treasury object and assert exact expected Move type, shared ownership, and package/coin type. Persist normalized object id only after both validations succeed.

- [ ] **Step 4: Add link action to Testnet/Treasury UI**

When viewing an unlinked persisted treasury, allow the owner to paste/select the Treasury + TreasurerCap ids produced by the existing Testnet demo and click `Verify and link to this workspace`.

Do not add automatic create/fund/allocation to this A1 flow.

- [ ] **Step 5: Run Sui and payment regressions**

```bash
corepack pnpm vitest run tests/unit/a1-sui-link.test.ts tests/unit/sui-transactions.test.ts tests/unit/stage7b-payment-preflight.test.ts tests/unit/stage6-sui-payment-safety.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add app/api/treasuries/[treasuryId]/link-sui/route.ts src/components/testnet-treasury-panel.tsx src/lib/treasuries/types.ts tests/unit/a1-sui-link.test.ts
git commit -m "feat(a1): verify and link treasury to Sui"
```

---

### Task 9: Full verification, production-safe migration acceptance, and documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/STAGE8_SUBMISSION_PACKAGE.md`
- Modify: `docs/STAGE7_DEMO_RUNBOOK.md` only if judge flow references stale mock Treasury/Budget behavior.

**Interfaces:**
- Final docs clearly distinguish persisted app treasury from Sui-linked treasury.
- Production still uses deterministic mock AI unless owner deliberately changes configuration.

- [ ] **Step 1: Run format/lint/type/unit/build locally**

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Expected: all green.

- [ ] **Step 2: Run Playwright smoke**

```bash
corepack pnpm exec playwright install chromium
corepack pnpm exec playwright test
```

Expected: all green, including new Treasurer/Member/continuity cases.

- [ ] **Step 3: Run Move tests**

No Move source is expected to change, but verify deployed-contract baseline remains intact:

```bash
cd move/club_treasury
sui move test
```

Expected: existing 31/31 suite remains green.

- [ ] **Step 4: Apply migration to the existing Supabase project only after automated tests are green**

Owner/Codex must use the normal Supabase migration workflow. Never paste `SUPABASE_SECRET_KEY` into chat or logs.

After migration, perform read-only checks that:

- existing Stage 6/7 treasury still has the same Sui object id;
- existing claims/payment attempts/digests are unchanged;
- new `join_code` values exist and are unique;
- null link values are accepted for newly created treasuries.

- [ ] **Step 5: Perform controlled live A1 acceptance without payout**

Create one throwaway persisted app treasury such as:

- name: `A1 Continuity Acceptance`
- total: `1.00 USDC`
- categories: `Food 0.40`, `Marketing 0.30`, `Venue 0.30`

Confirm:

1. Treasury persists after refresh.
2. Budget categories persist after refresh.
3. Claims page shows the exact treasury and categories.
4. Synthetic receipt claim submits.
5. Review shows `Not linked to Sui` and Approve disabled.
6. No Pay/signature action is possible.
7. Existing Stage 7C Paid claim still renders with the same confirmed digest and no second Pay button.

Do not create an unnecessary new payout for acceptance.

- [ ] **Step 6: Update judge-facing docs**

Use this narrative consistently:

`Treasury and category budgets persist immediately for operational workflow. Claims and AI-assisted review can happen before chain setup. A payout cannot be approved until the workspace is linked to its own verified Sui Treasury; after linking, the existing human-controlled preflight/finality pipeline applies.`

Remove stale live-path phrases such as `Stage 2 mock`, `Coming in the claim workflow task`, and claims that Treasury/Budget are browser-only when live mode is active.

- [ ] **Step 7: Run final secret scan**

Use repository/history scanning for obvious secret patterns and verify no `.env` files, private keys, seed phrases, Supabase service/secret keys, or Gemini API keys were committed.

- [ ] **Step 8: Commit docs and open PR**

```bash
git add README.md docs
git commit -m "docs(a1): document continuous treasury workflow"
git push origin stage8/a1-workflow-continuity
```

Open a PR to `main` with:

- migration notes;
- exact test counts;
- explicit statement that no live payout was performed for A1 acceptance;
- confirmation existing Stage 7C evidence remains unchanged.

Do not merge until exact-head CI is green and owner explicitly says to merge.

---

## Plan Self-Review

### Spec coverage

- Persisted Treasury/Budget continuity: Tasks 1–5.
- Treasurer-only creation and automatic owner role: Task 2.
- Treasurer can also claim: Tasks 4–5.
- Member two-role screen + join code: Task 6.
- Claims before Sui link: Tasks 1, 4, 5.
- Approval/payment blocked until link: Tasks 1 and 7.
- Owner-controlled verified Sui link: Task 8.
- Existing Stage 6/7 payment safety preserved: Tasks 1, 7, 8, 9.
- Judge/demo hardening and docs: Task 9.
- No live Gemini change: Global Constraints + Task 9.

### Placeholder scan

No TBD/TODO/"implement later" placeholders remain. A1.3 is represented as the concrete Task 8 with exact request fields and verification calls.

### Type consistency

- `PersistedTreasuryWorkspace.id` is the UUID used in query parameter `treasury` and Claims workspace API `treasuryId`.
- `treasuryObjectId` is consistently `string | null` before approval.
- Approved/payment snapshots remain non-null Sui object ids.
- Join-code route never downgrades existing owner/treasurer membership.
- Existing linked rehearsal treasury remains compatible with all new nullable types.
