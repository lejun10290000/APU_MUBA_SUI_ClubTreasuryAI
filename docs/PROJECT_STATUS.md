# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, blockers, and next task**.

## Current Snapshot

- Last updated: **31 August 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 5 — Claim and receipt workflow integration**
- Stage status: **CURRENT**
- Completed stages: **Stage 0; Stage 1; Stage 2; Stage 3; Stage 4**
- Latest completed milestone: **Stage 4 Gemini adapter implementation, automated verification, and owner-controlled live validation are complete and merged to `main`.**
- Active implementation branch: **`stage5/claim-receipt-integration`**
- Stage 5 implementation state: **Implemented and verified locally; the live Supabase positive-path acceptance passed against the active owner-controlled project.**
- Current blockers: **Finish the Stage 5 negative checks and complete teammate/owner review of PR #18 before marking Stage 5 complete.**
- Demo readiness: **The mock product workflow, verified Sui Testnet treasury flow, live-validated Gemini adapter, and Stage 5 claim/review workflow are available. Stage 5 must remain CURRENT until the remaining negative checks pass and PR #18 is reviewed.**

## Stage Progress

| Stage | Name                                   | Status      |
| ----- | -------------------------------------- | ----------- |
| 0     | Planning and repository setup          | COMPLETE    |
| 1     | Application foundation                 | COMPLETE    |
| 2     | Core UI and deterministic domain rules | COMPLETE    |
| 3     | Sui foundation and Move treasury       | COMPLETE    |
| 4     | Gemini AI layer                        | COMPLETE    |
| 5     | Claim and receipt workflow integration | CURRENT     |
| 6     | Human approval and on-chain payment    | NOT STARTED |
| 7     | Demo hardening and deployment          | NOT STARTED |
| 8     | Submission and pitch                   | NOT STARTED |

## Stage 3 — Verified Complete

### Move / Sui foundation

- Move 2024 package at `move/club_treasury`
- generic shared `Treasury<Asset>` custody object
- address-owned `TreasurerCap<Asset>` bound to one treasury and treasurer
- typed `Balance<Asset>` custody
- permissionless positive deposits before confirmation
- one-time exact category allocations
- category `allocated` and `remaining` accounting
- post-confirmation deposit lock
- treasurer/capability-authorized payout
- exact category lookup and `remaining` enforcement
- pre/post `sum(category_remaining) == custody balance` invariant checks
- exact typed coin payout to non-zero recipient
- typed public `PayoutEvent`
- hardened abort/error boundaries
- **31/31 Move tests passing** with Sui CLI `1.78.1-722ac4fcf484`

### Browser wallet / transaction execution

- Wallet Standard-compatible Sui wallet discovery
- explicit connect/disconnect
- Sui Testnet-only network guard
- typed `@mysten/sui` transaction builders for create/fund/allocate/payout
- exact `bigint`/`u64` validation
- one explicit wallet approval per action
- signed transaction execution through the configured Sui Testnet client
- wait-for-confirmation before the UI reports success
- real coin metadata / wallet-owned USDC reads
- public object IDs and explorer evidence stored only after confirmed Testnet responses
- no private keys, seed phrases, or wallet secrets stored by the app

### Verified Sui Testnet deployment

```text
Network:
Sui Testnet

Native Circle Testnet USDC:
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC

Package:
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f

Publish digest:
DdQQEcGD8FWmAde2rziBDjwua5CjcwRUtfN4p2Lkoeb

UpgradeCap:
0x711ea01bd5ed070582897c86b93340723f425e2cee634ef5d0e55adbb1363ce2

Treasury:
0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4

TreasurerCap:
0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7
```

### Verified real Testnet flow

The project owner completed the dedicated Testnet demo with a browser wallet and native Circle Testnet USDC:

1. Create treasury — confirmed
2. Fund treasury with **1.00 USDC** — confirmed
3. Confirm `events` category allocation of **1.00 USDC** — confirmed
4. Human-approved payout of **0.10 USDC** — confirmed
5. Refresh Treasury object from Testnet — confirmed

The page recorded confirmed explorer links for all four transactions and displayed the typed `PayoutEvent` after payout.

Final refreshed Treasury JSON reported:

```text
allocations_confirmed: true
category_allocated[0]: 1000000
category_remaining[0]: 900000
funds: 900000
```

With verified USDC metadata `decimals = 6`, this proves:

```text
1.00 USDC deposited
1.00 USDC allocated
0.10 USDC paid
0.90 USDC remaining
```

Stage 3 exit criteria are therefore **VERIFIED**.

## Stage 4 — COMPLETE

- official `@google/genai` `2.19.0` SDK pinned in the application lockfile
- `GeminiAIService` implemented behind the existing `AIService` interface
- `AI_MODE=mock` still selects `MockAIService` and never constructs a Gemini client
- live SDK loading and client construction are lazy and occur only on an explicitly permitted live request
- natural-language budget parsing requests JSON structured output in USDC integer application minor units
- receipt analysis accepts explicit bounded JPEG/PNG/WebP base64 image data without reading arbitrary local paths
- receipt extraction returns merchant, amount, date, description, category suggestion, missing fields, review state, and concise reasons
- every provider response is parsed as JSON and independently validated with Zod
- malformed, empty, schema-invalid, blocked, missing-image, missing-key, disabled-live, and provider-error paths fail safely
- provider errors are normalized without logging or exposing prompts, keys, or image/base64 payloads
- prompts prohibit financial authorization and do not enable tools, search grounding, agents, RAG, or automatic payouts
- deterministic TypeScript, human approval, wallet signing, and Move/Sui enforcement remain authoritative
- normal verification uses fake clients and makes zero Gemini API calls
- lint, strict TypeScript, **87/87 unit tests**, production build, and **7/7 Playwright smoke tests** pass in mock mode
- GitHub CI run 44 passed on the Stage 4 pull request with no Gemini key and zero live calls
- owner-controlled live validation passed with `gemini-2.5-flash` using exactly one fixed budget request and one in-memory synthetic receipt-image request
- the live budget response passed Zod validation with all five expected categories and integer minor-unit amounts
- the live receipt response accepted the synthetic PNG, matched the expected amount, detected intentionally missing currency, and returned `needsReview=true`
- no key, prompt payload, image base64, or private receipt data was recorded; the temporary runner was deleted and `.env.local` returned to mock mode with its key value cleared

Stage 4 exit criteria are **VERIFIED**. Gemini remains advisory; deterministic TypeScript, human approval, wallet signing, and Move/Sui remain authoritative.

## Stage 5 — Implemented Locally, Live Acceptance Pending

- versioned PostgreSQL migration for verified wallet profiles, wallet nonces, treasuries, memberships, budget categories, and claims
- RLS policies and narrow server functions for treasury access and human claim decisions
- private `receipts` bucket policy with JPEG/PNG/WebP and 10 MB limits
- server-side MIME, size, and image-signature validation plus SHA-256 hashing of the exact receipt bytes
- idempotent claim submission and exact/similar duplicate checks
- shared `getAIService()` analysis followed by deterministic recommendation rules
- persisted manual `Review` fallback when AI analysis fails or is invalid
- wallet-signed nonce identity binding in live mode and a clearly isolated mock repository for local/CI use
- persisted human Approve/Reject actions with a decision note
- immutable `approved_*` payout snapshot with `payment_status = unpaid`
- no wallet popup, Sui transaction construction, payout, digest, or paid state in Stage 5
- local verification passed: lint, strict TypeScript, 103 unit tests, production build, and 7 Playwright tests
- owner-controlled Supabase project is active, the Stage 5 migration is applied, Anonymous Sign-ins are enabled, and the live auth challenge endpoint creates a persisted nonce
- standard and zkLogin wallet identity signatures are routed through Sui Testnet-aware verification; zkLogin uses the official Testnet GraphQL verifier
- owner-controlled live positive path passed: zkLogin identity, first treasury/member/categories, private PNG upload, one persisted claim, stored `Review` recommendation, private receipt read, human approval, immutable approved payout snapshot, and `payment_status = unpaid`
- live evidence confirms exactly one claim for the external reference, one private receipt object, RLS on all six public tables, a 10 MB private receipt bucket, and the JPEG/PNG/WebP allowlist
- Supabase security/performance advisors were reviewed after acceptance; current notices are expected for the deny-by-default nonce table, narrowly scoped authenticated `SECURITY DEFINER` helpers/RPC, the intentional anonymous-user MVP bridge, disabled password protection in an anonymous-only flow, and unused indexes in a new one-record project

Not yet verified:

- live duplicate/idempotency, invalid-file/address, and interrupted-AI negative checks
- teammate/owner review of PR #18

Do not describe Stage 5 as COMPLETE until the real acceptance gate in `docs/STAGE5_LIVE_VALIDATION.md` passes.

## Next Recommended Task

### Stage 5 — Real Supabase acceptance and review

1. Run the negative checks in `docs/STAGE5_LIVE_VALIDATION.md` without executing a Sui transaction.
2. Confirm retries/duplicates fail safely, invalid input is rejected, and immutable database evidence cannot change.
3. Complete teammate/owner review of PR #18.
4. Keep Stage 5 CURRENT and do not begin Stage 6 until those checks pass.

## Locked MVP Decisions

- target user: university club treasurers and finance committee members
- AI is advisory; treasurer approves final payment
- Sui owns real Testnet custody/authorization/payout enforcement
- payment asset: native Sui Testnet USDC
- product AI provider: Google Gemini Developer API
- default Gemini model: `gemini-2.5-flash`
- official Stage 4 Gemini SDK: `@google/genai`
- normal development AI mode: `mock`
- database/storage later: Supabase PostgreSQL + private Storage
- raw receipts remain private/off-chain
- authoritative money values use integer/minor-unit semantics
- optional features wait until the core demo is stable

## Mandatory Agent Startup Output

Before development, every coding agent must show:

```text
CURRENT PROJECT STAGE: Stage 5 — Claim and receipt workflow integration
STATUS: CURRENT
COMPLETED STAGES: Stage 0; Stage 1; Stage 2; Stage 3; Stage 4
NEXT TASK: Complete the Stage 5 negative acceptance checks and review PR #18 without beginning Stage 6.
```

## Recent Development Log

### 2026-08-31 — Live Supabase auth reached zkLogin verification

- Confirmed the active Supabase project accepts anonymous sign-in cookies and the live wallet challenge endpoint returns `200` with a persisted single-use nonce.
- Diagnosed the initial authentication warning as a network-restricted local development process and restarted the server with Supabase access.
- Added a Sui Testnet GraphQL client to personal-message verification so zkLogin wallet signatures can be verified instead of failing for a missing Sui client.
- Added regression coverage asserting that wallet signature verification always receives the Testnet client.
- Confirmed the owner completed zkLogin verification, then traced claim submission to a first-treasury RLS failure caused by `INSERT ... RETURNING` evaluating the treasury SELECT policy before its helper could observe the new row.
- Preserved the existing RLS boundary and changed treasury persistence to insert without `RETURNING`, followed by a separate owner-authorized SELECT; a rolled-back live policy test verified the two-statement path and retained no diagnostic data.
- Verified lint, strict TypeScript, and 103 unit tests; the owner-controlled synthetic receipt/browser acceptance flow remains in progress.

### 2026-08-31 — Stage 5 live positive-path acceptance passed

- Project reference: `arldlnqiywhcuungvgei`.
- Applied migrations: `stage5_claim_receipt_workflow` and `stage5_security_performance_hardening`.
- Synthetic claim: `1aa9db3a-2a43-44e2-9628-923c6744ab03` with exactly one row for external reference `c3106fbc-2d6f-4f50-baca-7840b45cfe8b`.
- Private receipt path: `2f6973e7-1c6d-4bde-b3de-3375ed3ec753/c3106fbc-2d6f-4f50-baca-7840b45cfe8b/receipt`; PNG; 2,218,738 bytes; SHA-256 `15497253e8cc6df6cf550d4354d141bbbb858e13668d14d0d7655a58cf890c78`.
- Stored recommendation: `review`; human decision: `approve`; final claim state: `approved_unpaid`; final payment state: `unpaid`.
- Approved snapshot persisted the verified Testnet treasury object, `marketing` category reference, recipient, `1000` USDC application minor units, and `USDC` currency.
- Supabase evidence showed one wallet profile, one treasury, one owner membership, five categories, one claim, one private receipt object, RLS enabled on all six public tables, and the expected private-bucket limits.
- Transaction-wrapped live negative checks confirmed that the database rejects receipt-evidence changes with `Receipt evidence is immutable` and approved-payout changes with `Approved payout snapshot is immutable`; the transaction was rolled back and a follow-up read confirmed the accepted claim remained unchanged.
- Security/performance advisors were reviewed. The current notices are expected and documented: no nonce policies because browser roles receive no nonce-table grants; authenticated helper/RPC functions perform explicit `auth.uid()` ownership/role checks; anonymous Auth is intentional for the wallet bridge and still uses ownership-scoped RLS; password protection is not used by the anonymous-only flow; and unused indexes are expected in a fresh one-record project.
- Stage 5 remains CURRENT pending the documented negative checks and PR #18 review. No Sui transaction, payout, digest, or paid state occurred.

### 2026-08-31 — Stage 5 implemented locally; real Supabase acceptance pending

- Added the versioned Stage 5 schema, RLS policies, private receipt bucket policy, wallet identity bridge, and Supabase adapters.
- Connected multipart receipt submission to byte hashing, private upload, claim persistence, one shared AI analysis, deterministic checks, and stored recommendations.
- Added persisted human Approve/Reject decisions and an immutable approved-but-unpaid Stage 6 payout snapshot without invoking Sui.
- Added mock repository coverage for normal development/CI and a live adapter selected only through explicit environment configuration.
- Verified lint, strict TypeScript, 101 unit tests, production build, and 7 Playwright tests with zero live Gemini calls and zero Sui payouts.
- Kept Stage 5 CURRENT because the connected Supabase project is inactive and the local Docker engine is unavailable; no real migration/storage acceptance has been claimed.

### 2026-08-30 — Stage 4 cleanup and Stage 5 handoff aligned

- Confirmed Stage 4 implementation and live-validation documentation are merged to `main` through PR #16 and PR #17.
- Removed stale Stage 4 active-review/merge instructions.
- Aligned the project handoff with Stage 5 as the current stage.

### 2026-08-30 — Stage 4 completed with owner-controlled live Gemini validation

- Confirmed GitHub CI run 44 passed in mock mode without a Gemini key or live call.
- Enabled live mode only in ignored local configuration and validated `gemini-2.5-flash` with exactly one budget request and one in-memory synthetic receipt-image request.
- Verified all five expected budget categories and integer minor-unit values.
- Verified the receipt image was accepted, the expected amount matched, intentionally missing currency was detected, and `needsReview=true` was returned.
- Recorded no key, prompt payload, image base64, or private receipt data.
- Deleted the temporary runner, restored mock mode, disabled the live guard, and cleared the local key value.
- Stage 4 exit criteria are verified; Stage 5 is now current but implementation has not started.

### 2026-08-30 — Implemented the Stage 4 Gemini adapter; live validation pending

- Pinned official `@google/genai` `2.19.0` and added lazy, guarded live client construction.
- Implemented structured budget parsing and multimodal receipt extraction behind `AIService`.
- Added bounded image input, JSON Schema requests, independent Zod validation, and normalized safe errors.
- Verified mock selection constructs no Gemini client and all normal tests use fake clients with zero network calls.
- Verification passed: lint, typecheck, 87 unit tests, production build, and 7 Playwright smoke tests.
- Stage 4 remained CURRENT at that checkpoint because owner-controlled live Gemini validation had not yet been performed.

### 2026-08-30 — Stage 4 teammate handoff prepared

- Confirmed Stage 0–3 are complete on `main` and the post-merge GitHub CI is green.
- Cleared the stale Stage 3 active-branch handoff state.
- Stage 4 should start from latest `main` on `stage4/gemini-ai-layer`.
- Stage 4 implementation can proceed entirely in mock mode; any live Gemini validation remains explicit and owner-controlled.

### 2026-08-30 — Stage 3 completed with verified Sui Testnet treasury flow

- Deployed the Move package to Sui Testnet and recorded the real package, UpgradeCap, Treasury, TreasurerCap, and publish digest.
- Verified native Circle Testnet USDC metadata with 6 decimals.
- Completed real browser-wallet create, 1.00 USDC fund, 1.00 USDC allocation confirmation, and 0.10 USDC payout transactions.
- Confirmed all four transaction evidence links in the application.
- Refreshed the Treasury object from Sui Testnet and verified 900000 base units / 0.90 USDC remaining after payout.
- Confirmed the typed payout event was returned from the real Testnet transaction.
- Stage 3 exit criteria verified; project advances to Stage 4.
