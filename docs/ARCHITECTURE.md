# ClubTreasury AI — Architecture

ClubTreasury AI uses one full-stack Next.js application, one Sui Move package, Supabase for private/persisted application data, and Gemini behind a mock-first AI boundary.

## High-Level Architecture

```text
Treasurer / Club Member
        |
        v
Next.js 16 Web Application
  - React UI
  - deterministic financial rules
  - AIService boundary
  - claim/payment API routes
        |
        +-----------------------+----------------------+-------------------+
        |                       |                      |                   |
        v                       v                      v                   v
AIService                 Supabase PostgreSQL     Sui Wallet      Private Storage
  |- MockAIService        + Auth / RLS            explicit sign    Supabase receipts
  `- GeminiAIService      + payment ledger            |
     (@google/genai)                                  v
                                                Sui Testnet
                                                - Move treasury
                                                - native Testnet USDC
```

## Responsibility Split

```text
AI
→ understand unstructured budget/receipt evidence
→ suggest categories, ambiguity, concise reasons

Deterministic TypeScript
→ validate schemas
→ authoritative amount parsing
→ budget totals / category limits
→ duplicate logic
→ recommendation policy
→ signed-transaction and payout-evidence verification

Human treasurer
→ final approve/reject decision
→ explicit wallet approval/signature

Sui Move
→ treasury custody
→ treasurer authorization
→ confirmed category allocation enforcement
→ remaining-balance enforcement
→ payout execution
→ public typed payout evidence
```

AI never owns authoritative balances, payout authorization, wallet signing, or Sui transaction execution.

## AI Layer — Stage 4 Verified

The app depends on one shared interface:

```text
AIService
  |- MockAIService
  `- GeminiAIService
```

Normal development and CI use `MockAIService` and make zero Gemini API calls. Live Gemini requires explicit server-side configuration and every provider response is independently Zod-validated before application use.

Gemini may interpret natural-language budgets, extract receipt facts, suggest categories, identify ambiguity, and provide concise reasons. It may not authorize payment, calculate authoritative remaining balance, bypass category limits, determine authoritative duplicates by itself, sign transactions, or trigger payouts autonomously.

## Deterministic Domain Layer

Pure TypeScript remains authoritative for:

- positive amount/currency validation
- integer/minor-unit parsing
- budget-total validation
- category-remaining checks
- receipt/request amount comparison
- exact/similar duplicate checks
- final recommendation policy from validated facts/rules
- approved payout snapshot use
- signed transaction safety checks
- exact payout-event comparison

## Sui Layer — Stage 3 Verified, Stage 6 Reused

Network: **Sui Testnet**

Native Circle Testnet USDC:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

Verified Move package:

```text
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f
```

Publish digest:

```text
DdQQEcGD8FWmAde2rziBDjwua5CjcwRUtfN4p2Lkoeb
```

Historical Stage 3 demo objects:

```text
Treasury:
0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4

TreasurerCap:
0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7
```

Those objects remain valid historical Stage 3 evidence. The Treasury was later used by failed Stage 6 acceptance attempts, so it is no longer the clean Stage 7 demo default.

Current clean demo/acceptance pair:

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101
```

## Move Object Model

The Move package at `move/club_treasury` provides:

- shared `Treasury<phantom Asset>`
- address-owned `TreasurerCap<phantom Asset>`
- capability binding to one treasury ID and treasurer
- internal `Balance<Asset>` custody
- permissionless positive deposits before allocation confirmation
- one-time category references and exact `allocated`/`remaining` `u64` values
- exact equality between confirmed allocations and custody
- post-confirmation deposit lock
- treasurer/capability-authorized payout
- positive amount and non-zero recipient enforcement
- category remaining and custody sufficiency checks
- pre/post `sum(category_remaining) == custody balance` invariant
- exact typed `Coin<Asset>` payout
- typed `PayoutEvent`

`TreasurerCap` does not have the `store` ability, and privileged calls additionally require the transaction sender to match the stored treasurer address.

**31/31 Move tests passed** with Sui CLI `1.78.1-722ac4fcf484`. The Move package has not changed since the verified Stage 3 deployment.

## Application-side Sui Integration

The configured network is Testnet only. Automatic wallet connection is disabled. The user explicitly connects and explicitly approves each transaction.

The typed transaction layer builds:

- `create`
- `deposit`
- `confirm_allocations`
- `payout`

Runtime object IDs, addresses, category references, and money values are validated. Authoritative money uses integer/minor-unit semantics.

## Claim Decision Pipeline — Stage 5 Verified

```text
Receipt + member request
        ↓
Private receipt validation/upload + SHA-256
        ↓
AIService (mock or explicitly enabled Gemini)
        ↓
Zod-valid structured facts
        ↓
Deterministic checks
        ↓
Approve / Review / Reject recommendation
        ↓
Treasurer final decision
        ↓
Immutable approved_* snapshot + payment_status=unpaid
```

In live data mode, wallet identity is bound through a signed, single-use challenge and Supabase Auth/RLS. Receipt files remain private; short-lived signed URLs are returned only after authorized claim access.

## Stage 6 Claim-linked Payment Boundary — VERIFIED COMPLETE

The immutable human-approved snapshot is the only source of payout treasury, category, recipient, amount, and currency.

```text
approved_unpaid claim
        ↓
prepare/return one active payment attempt
        ↓
verify connected Testnet treasurer + TreasurerCap
        ↓
build payout only from approved_* snapshot
        ↓
human wallet signs exact transaction
        ↓
validate signed transaction + derive digest
        ↓
persist digest before broadcast
        ↓
submit signed transaction to Sui Testnet
        ↓
query/reconcile that exact digest
        ↓
verify confirmed success + exact typed PayoutEvent
        ↓
short atomic DB finalization
        ↓
paid claim + synchronized budget + digest evidence
```

A digest-bearing attempt is intentionally sticky. Once signed evidence exists, interruption or uncertainty recovers by the existing digest rather than constructing a replacement transaction.

### Canonical event verification

Sui transport JSON can render Move values differently. Stage 6 therefore uses the event's canonical BCS bytes as the primary `PayoutEvent` verification source when available. JSON parsing remains a compatibility fallback and supports observed category representations such as a UTF-8 string (`"events"`) or numeric byte array.

Verification compares the exact expected:

- Move event type/package
- Treasury ID
- category reference
- recipient
- amount
- post-payout category remaining
- post-payout Treasury balance

### Critical successful-but-unverifiable rule

```text
Confirmed Sui execution failure
→ failed
→ a later fresh attempt may be allowed

Transaction unavailable / not checkpointed
→ reconciliation_required
→ existing digest remains active
→ no replacement signature

Transaction succeeded but exact payout evidence is not yet verifiable
→ reconciliation_required
→ existing digest remains active
→ no replacement signature

Transaction succeeded + exact payout evidence verified
→ atomically finalize paid state and budget
```

The first Stage 6 live acceptance demonstrated why this distinction matters: a successful payout was once misclassified as failed after event parsing, which allowed another signed payout. That incident is preserved in `docs/STAGE6_LIVE_VALIDATION.md`.

A fresh aligned acceptance subsequently passed with exactly one payment attempt and digest:

```text
DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7
```

The synchronized budget moved from `1.00 allocated / 0 spent` to `0.10 spent / 0.90 remaining`, and refreshing the paid page retained the same digest without offering or signing another payout.

## On-chain vs Off-chain

### On-chain

- treasury/capability
- native Testnet USDC custody
- confirmed category allocations/remaining amounts
- approved payout execution
- payout event and transaction evidence

### Off-chain

- persisted app treasury workspace, join code, membership, and category-budget metadata
- raw receipt images
- member/claim metadata
- AI extraction/recommendation
- duplicate comparison details
- human review notes
- payment-attempt/reconciliation state

## A1 Persisted Workflow Continuity — DEPLOYED

In live data mode, the app treasury UUID is the operational workspace identity. A treasurer creates it in Supabase, persists a balanced category budget, and members join it through an authenticated short-code flow. Claims select that same persisted treasury and categories; claim submission never creates or mutates Treasury/Budget records.

An app treasury starts with `sui_treasury_object_id = null`. While unlinked, claim submission, AI-assisted analysis, human review, and rejection remain available, but approval cannot create an immutable payout snapshot and no prepare, preflight, wallet-sign, submit, or reconcile action is available.

The owner-controlled link endpoint accepts an existing Testnet Treasury and TreasurerCap pair only after verifying:

- the object is the deployed shared `Treasury<USDC>` type;
- the connected verified wallet owns the TreasurerCap;
- the capability authorizes exactly that Treasury;
- the workspace is not overwriting or reusing another link, including the Stage 6/7 rehearsal Treasury.

Once linked, A1 reuses the unchanged Stage 6/7 immutable-snapshot, pre-sign consistency, explicit wallet-signature, finality, event-verification, and same-digest reconciliation pipeline.

The A1 migration is applied and production acceptance passed without a payout. Production remains `AI_MODE=mock` with `GEMINI_LIVE_REQUESTS_ENABLED=false`.

## A2-Lite Per-Workspace Sui Activation — IMPLEMENTED, MIGRATION PENDING

```text
persisted workspace + dynamic budget
  → lock stable category references
  → wallet signs Create Treasury/Cap
  → wallet signs exact multi-coin USDC Fund
  → wallet signs dynamic Allocate/Confirm
  → server verifies each saved digest
  → Sui Active + join code
  → verified member wallet recipient
  → Gemini evidence + deterministic checks
  → human Approve (unpaid)
  → separate Pay using workspace TreasurerCap
  → confirmed PayoutEvent
  → persisted Paid History
```

Activation has a relational state machine and immutable budget snapshot. Signed digests are persisted before broadcast; uncertainty becomes `reconciliation_required` and never constructs a replacement transaction. Payout payload fields remain sourced only from the approved snapshot, while authorization metadata is resolved from the exact workspace Cap. The forward migration `20260905030000_stage8_a2_live_treasury_activation.sql` is not applied to production.

## Failure Handling

- AI unavailable/invalid → manual `Review`
- unclear/conflicting receipt → `Review`
- wallet rejected before signed digest → no payout; remain approved-unpaid
- confirmed Sui execution failure → do not mark paid; a later fresh attempt may be allowed
- transaction unavailable/not checkpointed → `reconciliation_required`; reconcile same digest
- successful transaction with unverified/mismatched event evidence → `reconciliation_required`; never blind retry
- database finalization mismatch/failure after chain success → preserve same digest and reconcile/finalize; never create a replacement payment automatically

## Stage 7 Deployment Direction — COMPLETE

```text
Browser
  ↓
Vercel-hosted Next.js app
  ├─ Gemini Developer API (server-side key only when live mode enabled)
  ├─ Supabase PostgreSQL/Auth/private Storage
  └─ Sui Testnet + user-controlled wallet
```

Stage 7 verified production environment variables, deployed Supabase access, clean demo/reset state, Testnet assets, the full deployed flow, and graceful recovery.

Stage 7D preserves two additional degradation boundaries:

- a success-shaped chain result with a different digest is reconciliation-required, never terminal failure; the original digest stays active and blocks a replacement signature
- failure to generate a short-lived private receipt preview does not hide the already authorized persisted claim; review remains possible without making Storage public or bypassing RLS

The demo UI distinguishes an unsigned Ready state from a previously signed transaction and tells the operator whether to retry wallet/workspace authentication, repeat a read-only pre-sign check, or reconcile an existing digest.

## Architecture Goal for Judging

A judge should clearly see:

- AI handles unstructured budget/receipt understanding.
- deterministic TypeScript handles hard financial rules.
- the treasurer remains accountable for approval and signing.
- Move enforces authorization/category limits at payout time.
- Sui executes real Testnet stablecoin movement.
- digest-first reconciliation prevents blind repeated payments.
- private receipt data remains off-chain.
