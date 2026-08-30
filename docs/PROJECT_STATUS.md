# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, blockers, and next task**.

## Current Snapshot

- Last updated: **30 August 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 4 — Gemini AI layer**
- Stage status: **CURRENT**
- Completed stages: **Stage 0; Stage 1; Stage 2; Stage 3**
- Latest completed milestone: **Stage 4 Gemini adapter implementation and zero-live-call automated verification are complete; owner-controlled live validation is still pending.**
- Active implementation branch: **`stage4/gemini-ai-layer`**
- Current blockers: **Stage 4 cannot be marked complete until the owner explicitly validates one live budget parse and one live synthetic receipt/image extraction with a local server-side Gemini key.**
- Demo readiness: **Mock product workflow and the verified Sui Testnet treasury flow work. The Gemini adapter, structured output, multimodal input, live guard, and failure safety are implemented, but no live Gemini result is claimed yet. Claim persistence/private receipt upload and deployed web hosting remain later-stage work.**

## Stage Progress

| Stage | Name                                   | Status      |
| ----- | -------------------------------------- | ----------- |
| 0     | Planning and repository setup          | COMPLETE    |
| 1     | Application foundation                 | COMPLETE    |
| 2     | Core UI and deterministic domain rules | COMPLETE    |
| 3     | Sui foundation and Move treasury       | COMPLETE    |
| 4     | Gemini AI layer                        | CURRENT     |
| 5     | Claim and receipt workflow integration | NOT STARTED |
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

## Stage 4 — Implementation Complete; Live Validation Pending

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

Stage 4 remains **CURRENT** because an owner-controlled live call has not been performed or claimed.

## Current Not Yet Implemented

- owner-controlled live Gemini validation for budget parsing and receipt/image extraction
- Stage 5 UI/API integration that invokes the implemented AI adapter for persisted claims
- Supabase migrations / claim persistence
- private receipt bucket and secure receipt upload
- receipt hashing integrated with persisted claims
- full persisted claim → AI review → human approval → existing Sui payout integration
- deployed public web app
- final screenshots/video/submission package

Do not describe these as complete until real implementation and verification exist.

## Next Recommended Task

### Stage 4 — Gemini AI layer

Complete the explicit live-validation gate for the implemented Gemini adapter without committing or sharing the owner key.

Required priorities:

1. Review the Stage 4 implementation PR and confirm CI passes in mock mode with no Gemini key.
2. Keep the API key only in the owner's untracked local `.env.local`.
3. Explicitly set `AI_MODE=live` and `GEMINI_LIVE_REQUESTS_ENABLED=true` only for the small validation session.
4. Validate one fixed natural-language budget instruction with `gemini-2.5-flash`.
5. Validate one synthetic JPEG/PNG/WebP receipt image and confirm ambiguous/missing evidence becomes `needsReview=true`.
6. Record the model and verified results without recording the key, prompt payload, image base64, or private receipt data.
7. Return configuration to mock mode after validation.
8. Only then mark Stage 4 complete and advance the repository to Stage 5.

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
CURRENT PROJECT STAGE: Stage 4 — Gemini AI layer
STATUS: CURRENT
COMPLETED STAGES: Stage 0; Stage 1; Stage 2; Stage 3
NEXT TASK: Complete owner-controlled live validation of the implemented budget parser and receipt/image extractor, then mark Stage 4 complete only if both pass.
```

## Recent Development Log

### 2026-08-30 — Implemented the Stage 4 Gemini adapter; live validation pending

- Pinned official `@google/genai` `2.19.0` and added lazy, guarded live client construction.
- Implemented structured budget parsing and multimodal receipt extraction behind `AIService`.
- Added bounded image input, JSON Schema requests, independent Zod validation, and normalized safe errors.
- Verified mock selection constructs no Gemini client and all normal tests use fake clients with zero network calls.
- Verification passed: lint, typecheck, 87 unit tests, production build, and 7 Playwright smoke tests.
- Stage 4 remains CURRENT because no owner-controlled live Gemini call was performed.

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
