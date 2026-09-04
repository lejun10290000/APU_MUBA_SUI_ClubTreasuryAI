# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, blockers, and next task**.

## Current Snapshot

- Last updated: **4 September 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 8 — Submission and pitch**
- Stage status: **CURRENT**
- Completed stages: **Stage 0–7**
- Stage 7 final merge commit: `4a365c2897991c28a2b411d567ffa69b3b6e1173`
- Stage 7 post-merge CI: **run #140 — SUCCESS**
- Production app: `https://apumubasuiclubtreasuryai000.vercel.app`
- Production claims: **live Supabase**
- Production rehearsal AI mode: **deterministic mock** (`AI_MODE=mock`, live Gemini disabled)
- Sui network: **Testnet**
- Current blocker: **none**
- Current priority: **finish submission package, demo video, pitch, Q&A, and Devfolio submission without expanding product scope**

## Stage Progress

| Stage | Name                                   | Status   |
| ----- | -------------------------------------- | -------- |
| 0     | Planning and repository setup          | COMPLETE |
| 1     | Application foundation                 | COMPLETE |
| 2     | Core UI and deterministic domain rules | COMPLETE |
| 3     | Sui foundation and Move treasury       | COMPLETE |
| 4     | Gemini AI layer                        | COMPLETE |
| 5     | Claim and receipt workflow integration | COMPLETE |
| 6     | Human approval and on-chain payment    | COMPLETE |
| 7     | Demo hardening and deployment          | COMPLETE |
| 8     | Submission and pitch                   | CURRENT  |

## Verified Production Evidence

### Sui

```text
Network:
Sui Testnet

Move package:
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f

Native Circle Testnet USDC:
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC

Clean Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101
```

### Successful Stage 7C live rehearsal

```text
Claim:
69a20a42-ae58-4547-b2f5-28bb2de52262

Payment attempt:
fae3fbfb-0738-47ae-b08b-764601b96ef1

Confirmed digest:
9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL

Payout:
0.10 USDC

Category:
events

Final category balance:
1.00 allocated / 0.20 spent / 0.80 remaining USDC
```

The rehearsal created exactly one payment attempt and one confirmed payout. Hard refresh preserved the same Paid state/digest, showed no Pay button, requested no second wallet signature, and created no replacement attempt.

## Final Stage 7 Verification

Merged Stage 7D `main` passed GitHub Actions run #140:

```text
lint: PASS
typecheck: PASS
unit tests: PASS (41 files / 201 tests)
build: PASS
Playwright smoke: PASS (7/7)
secret/history audit: PASS
```

Stage 7D also verified recovery messaging, same-digest reconciliation, private receipt-preview resilience, safe wallet/workspace retry, public Sui readiness, no-spend backup evidence, and repository security without performing another payout.

## Official Team

| Name          | Role      | University       | GitHub          |
| ------------- | --------- | ---------------- | --------------- |
| CHUA LE JUN   | Developer | UTM Kuala Lumpur | `lejun10290000` |
| LE YONG XIANG | Developer | UTM Kuala Lumpur | `yx-le`         |
| LAI YAN QI    | Presenter | UTM Kuala Lumpur | `YANKEY-CODE`   |

## Stage 8 Current Goal

Package the already-working product for judging. **Do not add optional features unless they are required for submission.**

### Stage 8A — Submission package

- final README
- team details
- tested setup/install instructions
- product/problem/architecture copy
- live demo URL and Sui deployment evidence
- AI-development-tool declaration
- copy-ready Devfolio package
- screenshots/video placeholders until final assets exist
- submission-facing UI and workflow polish with the verified Sui evidence visible from the dashboard

### Stage 8B — Demo video

- final 3:33 product-focused MP4 rendered locally with natural narration and embedded English captions; public YouTube/Loom upload remains pending
- prefer the no-spend path using persisted Stage 7C proof for the payout result
- refreshed desktop/mobile/product-proof screenshots retained locally

### Stage 8C — Pitch

- prepare 5-minute pitch
- prepare 5-minute Q&A
- Payments & Stablecoins emphasis
- AI × Sui emphasis

### Stage 8D — Final submission

- verify every Devfolio field
- verify public repository and video link
- verify all AI tools are declared
- submit before **5 September 2026, 11:59 PM MYT**

## Stage 8 UI Refinement Verification

The submission-facing workflow was polished on 4 September 2026 without changing the frozen product scope or performing a live Gemini request, wallet signature, or Sui payout.

- stale stage labels, generic profile initials, and contradictory deployment messages removed from user-facing pages
- user-facing product terminology follows sentence case while preserving proper names such as AI, USDC, Sui, Sui Testnet, Supabase, and Gemini
- mobile navigation changed to a complete two-row grid with no hidden routes
- dashboard reduced to a clear four-step judge flow
- verified Stage 7C payout proof surfaced in the dashboard, history, and Sui Testnet views
- risky live transaction controls placed behind an explicit collapsed disclosure
- Open Graph/Twitter sharing metadata and a generated social preview added
- `pnpm lint`, `pnpm typecheck`, production build, **201/201 unit tests**, and **7/7 Playwright smoke tests** pass
- desktop and 390 px mobile visual QA pass with no application console errors or warnings

## Locked Product Story

```text
Gemini understands unstructured budget/receipt information
        ↓
Deterministic TypeScript enforces hard financial checks
        ↓
Human treasurer makes the final decision
        ↓
Sui wallet signs explicitly
        ↓
Move enforces custody, category limits, and USDC payout
```

AI is advisory. It never owns authoritative balances, authorizes payment, signs a wallet transaction, or moves funds.

## Mandatory Agent Startup Output

Before further work, every coding agent must show:

```text
CURRENT PROJECT STAGE: Stage 8 — Submission and pitch
STATUS: CURRENT
COMPLETED STAGES: 0–7
NEXT TASK: Finish submission/pitch materials. Do not expand product scope or perform unnecessary live payouts.
```

## Handoff Rule

Every Stage 8 change must keep this file and `docs/ROADMAP.md` accurate. Do not mark Stage 8 COMPLETE until the Devfolio package/video/pitch materials are finalized and the owner confirms submission.
