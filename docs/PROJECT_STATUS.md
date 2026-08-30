# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, blockers, and next task**.

## Current Snapshot

- Last updated: **30 August 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 4 — Gemini AI layer**
- Stage status: **CURRENT**
- Completed stages: **Stage 0; Stage 1; Stage 2; Stage 3**
- Latest completed milestone: **Verified Sui Testnet treasury deployment and real create → fund → allocate → payout flow using native Circle Testnet USDC**
- Active implementation branch awaiting final review/merge: **`stage3/testnet-deployment-e2e`**
- Current blockers: **None for Stage 3. Stage 4 requires implementation of the Gemini adapter and explicit owner-controlled live API configuration.**
- Demo readiness: **Mock product workflow is complete; Sui Testnet wallet signing, Move treasury enforcement, real native Testnet USDC custody, allocation, payout, explorer evidence, and post-payout object-state verification are working. Live Gemini, claim persistence/private receipt upload, and deployed web hosting remain later-stage work.**

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

## Current Not Yet Implemented

- live `@google/genai` Gemini implementation
- live budget/receipt AI analysis
- Supabase migrations / claim persistence
- private receipt bucket and secure receipt upload
- receipt hashing integrated with persisted claims
- full persisted claim → AI review → human approval → existing Sui payout integration
- deployed public web app
- final screenshots/video/submission package

Do not describe these as complete until real implementation and verification exist.

## Next Recommended Task

### Stage 4 — Gemini AI layer

Implement Gemini behind the existing `AIService` boundary while preserving the mock-first cost/safety policy.

Required priorities:

1. Add official `@google/genai` SDK.
2. Keep `AI_MODE=mock` and `GEMINI_LIVE_REQUESTS_ENABLED=false` as defaults.
3. Implement `GeminiAIService` without giving AI financial authority.
4. Add structured budget parsing.
5. Add structured receipt/image extraction.
6. Validate every model response server-side with Zod.
7. Return category suggestions / ambiguity / concise reasons only.
8. Keep money arithmetic, budget limits, payout authorization, wallet signing, and Sui execution deterministic/human-controlled.
9. Run normal CI/tests with **zero live Gemini calls**.
10. Use live Gemini only in explicit owner-controlled quality checks.

## Locked MVP Decisions

- target user: university club treasurers and finance committee members
- AI is advisory; treasurer approves final payment
- Sui owns real Testnet custody/authorization/payout enforcement
- payment asset: native Sui Testnet USDC
- product AI provider: Google Gemini Developer API
- planned default Gemini model: `gemini-2.5-flash`
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
NEXT TASK: Implement the Gemini AI layer behind the existing mock-first AIService boundary without giving AI financial authority.
```

## Recent Development Log

### 2026-08-30 — Stage 3 completed with verified Sui Testnet treasury flow

- Deployed the Move package to Sui Testnet and recorded the real package, UpgradeCap, Treasury, TreasurerCap, and publish digest.
- Verified native Circle Testnet USDC metadata with 6 decimals.
- Completed real browser-wallet create, 1.00 USDC fund, 1.00 USDC allocation confirmation, and 0.10 USDC payout transactions.
- Confirmed all four transaction evidence links in the application.
- Refreshed the Treasury object from Sui Testnet and verified 900000 base units / 0.90 USDC remaining after payout.
- Confirmed the typed payout event was returned from the real Testnet transaction.
- Stage 3 exit criteria verified; project advances to Stage 4.
