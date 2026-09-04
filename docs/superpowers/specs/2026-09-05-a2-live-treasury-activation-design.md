# A2-Lite Live Treasury Activation — Design Specification

Date: 5 September 2026 (MYT)
Status: Owner-approved design
Scope: Stage 8 hackathon demo hardening
Base commit: `30ae958a1ab221e651a5304cd8c6450184f8e398`

## 1. Goal

A2-Lite turns each newly created app treasury workspace into its own funded Sui Testnet `Treasury<USDC>` with a workspace-specific `TreasurerCap`, preserves the existing human-controlled payout safety model, and enables one uninterrupted judge-facing workflow from treasury creation to a real on-chain Testnet USDC reimbursement and live History evidence.

The target demo flow is:

```text
Treasurer creates APU Event Live (10 USDC)
→ defines dynamic categories
→ confirms budget
→ Activate on Sui
→ signs Create Treasury
→ signs Fund 10 USDC
→ signs Confirm Allocations
→ workspace becomes Sui Active
→ join code appears
→ member joins with second wallet
→ member submits a 0.10 USDC claim
→ recipient is the verified member wallet
→ real Gemini analyzes receipt evidence
→ deterministic rules run
→ treasurer reviews
→ Approve · keep unpaid
→ separate Pay 0.10 USDC action
→ treasurer signs in Slush
→ real Sui Testnet USDC payout confirms
→ claim becomes Paid
→ live History shows persisted transaction evidence
```

A2-Lite must preserve the rule: **AI recommends; humans authorize; wallets sign; Sui executes.**

## 2. Chosen Architecture

Use a **first-class per-treasury Sui activation state**.

Each app treasury workspace owns its own:

- Supabase treasury UUID
- verified owner wallet
- Sui Treasury object ID
- Sui TreasurerCap object ID
- activation progress and transaction digests
- frozen dynamic category references
- budget-lock state

The payout path must resolve the TreasurerCap from the claim's exact treasury workspace, not from the existing global `NEXT_PUBLIC_SUI_TREASURER_CAP_OBJECT_ID` configuration.

One owner wallet may create and activate many treasury workspaces. Each individual workspace may be activated only once and, after successful activation, its Sui Treasury/Cap relationship is immutable.

Examples:

```text
0x7f696... owner
├── A2 Smoke Test
│   ├── Sui Treasury A
│   └── TreasurerCap A
├── APU Event Demo
│   ├── Sui Treasury B
│   └── TreasurerCap B
└── APU Event Live
    ├── Sui Treasury C
    └── TreasurerCap C
```

Treasury names do not need to be globally unique. Workspace UUIDs, join codes, Sui Treasury IDs, and TreasurerCap IDs distinguish records.

## 3. Non-Goals

A2-Lite does not add:

- a new Move package unless implementation discovers a real contract-level blocker
- multisig or dual approval
- sponsored transactions
- zkLogin
- mainnet payments
- autonomous AI payments
- arbitrary recipient entry by members
- relinking an activated workspace to another Sui Treasury
- mutation of historical Stage 6/7 evidence
- live Gemini calls in CI or normal local tests

## 4. Sui Activation UX

Activation belongs inside the normal treasury workspace/dashboard, not the technical `/dashboard/testnet` page.

Before activation:

```text
APU Event Live
10.00 USDC

Food            4.00
Venue           3.00
Transportation  3.00

Sui status: Not activated
[Activate on Sui]
```

The join code may already exist in the database, but the judge-facing UI must not expose it until activation is fully confirmed.

Activation is a guided three-step wizard with **three explicit wallet confirmations**:

1. Create `Treasury<USDC>` + `TreasurerCap<USDC>`
2. Fund exactly the app treasury total budget
3. Confirm the exact dynamic category allocations

Each step requires a Slush wallet signature. AI never signs or authorizes any transaction.

After successful activation:

```text
Sui Active
Treasury: 0x...
Network: Sui Testnet
Owner: 0x7f696...
Budget: 10.00 USDC · Locked
Categories: Locked
Join code: XXXX-XXXXXX
```

## 5. Activation State and Persistence

Do not store activation progress as one opaque JSON blob or only in browser state.

Use a dedicated one-to-one activation record, conceptually:

```text
treasury_sui_activations
- treasury_id
- owner_wallet_address
- status
- create_status
- create_digest
- create_confirmed_at
- fund_status
- fund_digest
- fund_confirmed_at
- allocation_status
- allocation_digest
- allocation_confirmed_at
- activated_at
- created_at
- updated_at
```

The `treasuries` row should also persist the immutable final relationship and lock state, conceptually:

```text
- sui_treasury_object_id
- sui_treasurer_cap_object_id
- sui_activation_status
- budget_locked_at
- activated_at
```

The exact schema may vary during implementation, but the data must remain explicit, relational, queryable, and enforceable.

Suggested step states:

```text
not_started
signed
submitted
confirmed
reconciliation_required
failed_before_signing
```

A signed or potentially submitted transaction with a known digest is sticky. It must be reconciled, not replaced blindly.

## 6. Resumability and No-Blind-Retry Rule

Activation must be resumable and idempotent.

If Create and Fund are confirmed while Allocate is incomplete:

```text
Create Treasury      ✅
Fund Treasury        ✅
Confirm Allocations  ○
[Resume activation]
```

The app must not repeat confirmed or ambiguous steps.

Golden rule:

> If a transaction digest exists or a submission outcome is ambiguous, reconcile that exact digest before allowing any replacement transaction.

This applies to:

- create
- fund
- allocation
- claim payout

The existing Stage 6/7 payment incident demonstrated why successful-but-unverifiable outcomes must remain reconciliation-required rather than being treated as ordinary retryable failure.

## 7. Signed-Before-Broadcast Persistence

Activation should reuse the strongest Stage 6 payment pattern:

```text
build
→ wallet signs
→ derive digest
→ persist signed state/digest
→ broadcast
→ reconcile/finality verification
```

If the browser or network fails after signing, refresh must recover from the saved digest rather than construct a replacement transaction.

## 8. Server-Side Chain Verification

The server must not trust a client claim that activation succeeded.

For each activation digest, verify on Sui Testnet before marking the step confirmed.

### Create verification

Confirm:

- transaction success
- expected sender / verified owner wallet
- correct deployed package and treasury module
- expected `Treasury<USDC>` created
- corresponding `TreasurerCap<USDC>` created
- extracted object IDs are valid and unique

### Fund verification

Confirm:

- transaction success
- expected Treasury object
- native Circle Sui Testnet USDC type
- exact funding amount equals the workspace total budget
- expected wallet signed

### Allocation verification

Confirm:

- transaction success
- expected Treasury object and TreasurerCap
- exact frozen category references
- exact frozen category allocations
- exact total matches workspace budget

## 9. Owner Authorization

For the official demo, the owner wallet is:

```text
0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea
```

A new treasury workspace must be activated, approved, and paid by the same verified owner wallet that owns the workspace.

Wrong-wallet UI must block before transaction construction and clearly show the mismatch.

The TreasurerCap object ID is public and safe to persist. No private keys or seed phrases are stored or requested.

## 10. Dynamic Category References

A2-Lite supports arbitrary user-defined categories. No judge-facing flow may hardcode `events`.

Generate stable Sui category references from the user-visible category name, for example:

```text
Food             → food
Transportation   → transportation
Event Marketing  → event-marketing
Food & Drinks    → food-drinks
```

Rules:

- normalize deterministically
- validate non-empty references
- validate uniqueness inside the treasury
- reject normalized collisions before activation
- freeze references once activation starts

Example collision:

```text
Food & Drinks → food-drinks
Food Drinks   → food-drinks
```

This must be rejected rather than silently producing ambiguous on-chain references.

The current A1 ordinal-suffixed references may remain for historical/legacy rows; A2 should establish stable slug references for new A2 treasuries.

## 11. Budget Locking

Before activation starts, the owner may edit the total/categories subject to existing budget rules.

As soon as the first activation transaction is signed, freeze the activation snapshot and prevent budget mutation.

After full activation, budget total, category set, category references, and allocations remain permanently locked for the hackathon MVP.

If the owner wants a different committed budget, create a new treasury workspace.

## 12. Automatic USDC Funding

The judge-facing UI must not ask the user to select Sui coin object IDs.

The app reads the connected wallet's native Circle Testnet USDC coins and automatically selects enough to fund the exact treasury budget.

Current transaction code supports funding from one coin. A2 must support the realistic case where the wallet balance is split across multiple USDC coin objects.

Funding flow:

```text
load wallet USDC coins
→ calculate total available
→ fail early if insufficient
→ choose sufficient source set
→ if needed, merge selected coins in the transaction
→ split exactly required amount
→ deposit exactly required amount
```

UI example:

```text
Required: 10.00 USDC
Available: 38.40 USDC
[Fund 10.00 USDC]
```

All authoritative money arithmetic remains integer/minor-unit based.

## 13. Member Join and Identity

The member demo wallet is:

```text
0x6b5ccd6b9abe76887fd93bdf04659cbbe32c42c3e9c308a240963df0cd4e2560
```

The member joins the exact activated treasury using its short join code.

Defense in depth: the backend must reject joining an inactive/unactivated treasury even if a join code is discovered before activation.

The member sees only treasuries they are authorized to access.

## 14. Claim Recipient Lock

The payout recipient is automatically the member's verified connected Sui wallet.

The member must not be allowed to type an arbitrary recipient address.

Persist and validate the relationship among:

- member user ID
- verified member wallet
- recipient Sui address

For the official claim demo, recipient is therefore automatically:

```text
0x6b5ccd6b9abe76887fd93bdf04659cbbe32c42c3e9c308a240963df0cd4e2560
```

## 15. Gemini Production Behavior

Real Gemini is enabled **only in Vercel Production** for the official demo/video and selected explicit checks.

Production environment intent:

```text
APP_ENV=production
AI_MODE=live
GEMINI_LIVE_REQUESTS_ENABLED=true
GEMINI_API_KEY=<server-side Vercel secret>
GEMINI_MODEL=gemini-2.5-flash
```

The key must never be committed, pasted into chat, exposed through `NEXT_PUBLIC_*`, or used by CI.

Preview, CI, and normal local tests remain deterministic/non-live.

Gemini responsibilities remain advisory only:

- extract receipt merchant/date/amount/description
- suggest category
- identify missing/ambiguous evidence
- provide concise reasons

Gemini must never:

- approve/reject authoritatively
- calculate authoritative budget state
- authorize payment
- sign a wallet transaction
- execute Sui movement

## 16. Gemini Failure Behavior

In Production, do **not** silently fall back to mock AI.

If Gemini is unavailable, invalid, or returns unusable output:

- keep the persisted claim
- preserve the uploaded receipt evidence
- continue deterministic checks where possible
- clearly mark the AI analysis unavailable
- route the claim to manual review
- never fabricate a live Gemini result

Suggested UI:

```text
AI receipt analysis
Manual review required
Gemini analysis was unavailable.
No AI result was fabricated.
```

## 17. Human Approval vs Payment

Approval and payment remain separate actions.

Human decision UI:

```text
[Reject] [Approve · keep unpaid]
```

`Approve · keep unpaid` must not open Slush.

After approval, show the immutable payout snapshot and a separate button:

```text
Status: Approved · Unpaid
Amount: 0.10 USDC
Category: Food
Recipient: 0x6b5ccd...2560
[Pay 0.10 USDC]
```

Only the Pay action triggers wallet signing.

## 18. Per-Workspace TreasurerCap Payout

The current payout path reads `suiConfig.treasurerCapObjectId` globally. A2 must remove this dependency from the new judge-facing path.

New resolution:

```text
claim
→ treasury_id
→ verified A2 activation record
→ exact workspace TreasurerCap
```

Before payout signing, preserve the existing capability verification against:

- connected wallet
- approved Treasury object
- package ID
- USDC type

The immutable approved snapshot remains the only source of payout Treasury, category reference, recipient, amount, and currency.

## 19. Payment Finality and Duplicate Protection

Keep all existing Stage 6/7 payout protections:

- one active payment attempt per claim
- pre-sign consistency checks
- exact signed transaction validation
- digest persistence before broadcast
- canonical `PayoutEvent` verification
- same-digest reconciliation
- no blind replacement signing
- database Paid state only after verified chain success

A successful-looking but unverifiable transaction remains `reconciliation_required`.

## 20. Live History

Replace the current hardcoded/sample History experience for the judge-facing path.

History must query persisted real paid claims, newest first.

Each record should show:

- treasury name
- claim/category
- amount
- recipient
- Paid status
- confirmation time
- transaction digest
- Sui Testnet Explorer link

Do not show fabricated/sample activity in the judge-facing History page.

### Authorization

Treasurer:
- sees paid claims for treasuries they own/manage

Member:
- does not receive the treasury-wide payment History
- sees payment status/digest only on their own claim

## 21. Legacy Preservation

Existing Stage 6/7 treasuries, claims, payment attempts, digests, and historical proof remain untouched.

Do not:

- relink old workspaces
- fabricate A2 activation records for old treasuries
- rewrite historical digests
- change paid evidence
- migrate all legacy rows into the new activation model automatically

A2 activation applies to newly activated workspaces going forward.

The existing technical Testnet page may remain as a developer/debug tool, but it is not the primary judge-facing workflow.

## 22. Migration Strategy

Use one forward Supabase migration for A2.

The migration should:

- add first-class activation persistence
- add workspace TreasurerCap persistence/uniqueness
- add lock/activation constraints as needed
- preserve all legacy rows
- preserve existing RLS and authorization intent
- avoid destructive rewrites

Apply the production migration once, only after code/schema review and explicit owner authorization. Record it in migration history and do not reapply it casually.

## 23. Testing Strategy

A2 testing happens in layers.

### Level 1 — Pure unit tests

No live Sui, Supabase production, wallet, or Gemini.

Cover:

- category slugging and collisions
- activation state transitions
- money conversions
- funding coin selection
- owner guards
- history shaping/filtering

### Level 2 — API/domain tests with mocked chain results

Cover:

- create/fund/allocate verification outcomes
- signed digest persistence
- ambiguous transaction reconciliation
- immutable activation relationship
- inactive join rejection
- recipient locking
- per-workspace Cap resolution
- Gemini failure to manual review

### Level 3 — Playwright with mocked wallet/chain

Cover the complete UI flow without moving real Testnet USDC.

### Level 4 — Controlled real production smoke test

Use a small dedicated treasury, not either official 10-USDC demo treasury.

Recommended:

```text
A2 Smoke Test
Total: 1.00 USDC
Food: 0.50
Venue: 0.50
Claim: 0.01 USDC
```

Verify the full real flow once.

### Level 5 — Official video

```text
APU Event Demo
10.00 USDC
fresh 0.10 USDC payout
```

### Level 6 — Judge live demo

```text
APU Event Live
10.00 USDC
fresh 0.10 USDC payout
```

CI must never perform real wallet signatures, live Gemini calls, or real payouts.

## 24. Required Acceptance Tests

A2 is not complete until all relevant automated tests pass and the controlled real smoke flow succeeds.

Required behaviors include:

```text
CATEGORY
Food → food
Event Marketing → event-marketing
normalized collision → rejected

ACTIVATION
wrong owner → blocked
confirmed Create → never recreated
confirmed Fund → never repeated
confirmed Allocate → never repeated
known/ambiguous digest → reconcile
refresh mid-flow → resume correct step
fully active relationship → immutable

FUNDING
one sufficient coin → works
multiple smaller coins → combined automatically
insufficient total USDC → blocked before signature
funding amount → exact app budget

JOIN
inactive treasury code → rejected
active treasury code → accepted

CLAIM
recipient → verified connected member wallet
recipient cannot be edited arbitrarily

GEMINI
valid live output → persisted analysis
provider failure → manual review
invalid output → manual review
no hidden mock substitution in Production

APPROVAL
Approve → approved_unpaid
Approve does not trigger Slush

PAYMENT
wrong wallet → blocked
wrong Cap → blocked
correct workspace Cap → used
ambiguous digest → reconciliation
confirmed payout → Paid exactly once

HISTORY
real paid claims only
newest first
correct treasury/category/amount/recipient/digest/explorer link
no sample/demo activity
```

## 25. Deployment Order

Use this order:

1. Build A2 on a dedicated branch
2. Pass lint, typecheck, unit/integration/E2E tests
3. Review the Supabase migration
4. Apply the A2 migration once with owner authorization
5. Merge/deploy the app only after exact-head owner approval
6. Verify production health
7. Configure real Gemini in Vercel Production only
8. Redeploy production
9. Verify health reports live AI enabled and key configured
10. Run the 1.00 / 0.01 USDC A2 Smoke Test
11. Record `APU Event Demo`
12. Preserve enough Testnet USDC/SUI for judge day
13. Create `APU Event Live` fresh during judging

## 26. Git and Merge Safety

All A2 implementation work occurs on a dedicated branch and PR.

Before merge:

- review exact final head SHA
- require CI success
- verify migration state
- verify no secrets
- verify no unintended legacy changes
- obtain explicit owner authorization for that exact head

Do not merge automatically.

## 27. Demo Naming and Funding Plan

Use distinct human-readable names to avoid operator confusion:

```text
A2 Smoke Test   → 1.00 USDC
APU Event Demo  → 10.00 USDC
APU Event Live  → 10.00 USDC
```

The same owner wallet may own all three. They remain separate Supabase workspaces and separate Sui Treasury/Cap pairs.

The official demo claim amount for both video and live judging is **0.10 USDC**.

## 28. Judge-Facing Language

Use:

- Sui Testnet
- Circle Testnet USDC
- real on-chain Testnet payment
- human approved
- human signed
- AI advisory
- verified transaction

Do not describe Testnet USDC as mainnet money or production funds.

## 29. Completion Definition

A2-Lite is complete only when a fresh treasury can execute this controlled production flow end to end:

```text
create workspace
→ define dynamic budget
→ Activate on Sui
→ three human signatures
→ Sui Active
→ join code available
→ member joins
→ member submits claim
→ recipient locked to member wallet
→ real Gemini receipt analysis or clear manual-review fallback
→ deterministic rules
→ human approval without payment
→ separate Pay action
→ exact per-workspace TreasurerCap
→ human wallet signature
→ verified real Sui Testnet USDC transfer
→ finality
→ Paid
→ live persisted History record
→ Explorer proof
```

Legacy Stage 6/7 evidence must still remain unchanged after this acceptance.

## 30. Implementation Boundary Summary

A2-Lite is primarily an application/data-layer extension. The current published Move package already supports create, deposit, dynamic allocation arrays, and payout. Therefore no Move rewrite or republish is planned unless implementation proves one is necessary.

Primary implementation areas:

- Supabase migration and RLS/constraints
- treasury activation domain types/state machine
- Sui activation transaction/reconciliation service
- automatic multi-coin USDC funding
- treasury workspace activation UI
- member join activation guard
- member recipient lock
- per-workspace TreasurerCap payout resolution
- live Gemini production behavior
- real paid-claim History
- tests, docs, runbook, production smoke verification

This is the owner-approved A2-Lite design baseline. Any material deviation in transaction safety, ownership, activation semantics, payout authority, Gemini behavior, or legacy preservation requires explicit owner review before implementation proceeds.
