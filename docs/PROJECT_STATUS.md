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
- Current blocker: **A1 live Supabase migration and controlled no-payout acceptance require owner authorization/action**
- Current priority: **obtain green PR #29 review/CI for the post-link claim-approval lifecycle fix, then finish A1 production-safe acceptance without performing an unnecessary payout**

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

### A1 workflow continuity — local implementation complete, production pending

The `stage8/a1-workflow-continuity` branch now implements:

- persisted app treasury creation and exact-sum category budgets in live mode;
- Claims using the same persisted treasury UUID and categories without mutating them;
- Member wallet verification, join-code membership, and claim entry;
- explicit unlinked status with approval, payout preparation, preflight, signing, submission, and reconciliation blocked;
- owner-only verification of an existing shared Sui `Treasury<USDC>` plus the exact wallet-owned `TreasurerCap` before linking;
- claim review reads the current treasury link separately from the claim's historical pre-approval link, so an existing unlinked claim becomes approvable after a verified link and reload without resubmission;
- preservation of the existing Stage 7C treasury, claim, payment attempt, digest, and no-blind-retry safety pipeline.

Local verification on 4 September 2026:

```text
lint: PASS
typecheck: PASS
unit tests: PASS (51 files / 232 tests)
build: PASS
Playwright assertions: 9/9 scenarios completed without assertion failure
Playwright process: NOT a clean exit; Windows Next.js web-server cleanup hung and was terminated
Move tests: NOT RUN locally; Sui CLI unavailable
```

The A1 migration is **not applied** and controlled production acceptance is **not performed**. Production remains the verified Stage 7 baseline with deterministic mock AI (`AI_MODE=mock`, `GEMINI_LIVE_REQUESTS_ENABLED=false`).

Latest development: PR #29 received an independent lifecycle review. The branch now exposes current treasury-link state in claim review, keeps pre-link approval blocked, and lets the unchanged claim reach the guarded `decide_claim` transition after linking. The SQL unlinked guard and all Stage 6/7 payment safety boundaries remain unchanged. Local focused payment-safety verification passed 86/86 tests; full lint, typecheck, 232 unit tests, and production build passed. GitHub CI for this follow-up commit is pending push.

### Stage 8A — Submission package

- final README
- team details
- tested setup/install instructions
- product/problem/architecture copy
- live demo URL and Sui deployment evidence
- AI-development-tool declaration
- copy-ready Devfolio package
- screenshots/video placeholders until final assets exist

### Stage 8B — Demo video

- record a 3–5 minute YouTube/Loom demo
- prefer the no-spend path using persisted Stage 7C proof for the payout result
- retain backup screenshots/video locally

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
NEXT TASK: Owner-authorized A1 Supabase migration, read-only preservation checks, and controlled no-payout production acceptance. Do not perform a live payout.
```

## Handoff Rule

Every Stage 8 change must keep this file and `docs/ROADMAP.md` accurate. Do not mark Stage 8 COMPLETE until the Devfolio package/video/pitch materials are finalized and the owner confirms submission.
