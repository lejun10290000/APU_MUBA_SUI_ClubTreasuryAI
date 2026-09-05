# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, blockers, and next task**.

## Current Snapshot

- Last updated: **5 September 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 8 — Submission and pitch**
- Stage status: **CURRENT**
- Completed stages: **Stage 0–7**
- Stage 7 final merge commit: `4a365c2897991c28a2b411d567ffa69b3b6e1173`
- Stage 7 post-merge CI: **run #140 — SUCCESS**
- Production app: `https://apumubasuiclubtreasuryai000.vercel.app`
- Production claims: **live Supabase**
- Production rehearsal AI mode: **live Gemini receipt analysis observed during A2 smoke acceptance**
- Sui network: **Testnet**
- Current blocker: **A2 smoke acceptance reaches treasurer review, but human approval is blocked by an ambiguous `treasury_object_id` reference in `public.decide_claim`**
- Current priority: **merge and apply the forward-only `decide_claim` ambiguity hotfix, then resume the same under-review smoke-test claim; do not create a replacement claim or payout before approval is verified**

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

### A1 workflow continuity — merged, deployed, and production accepted

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

The owner-authorized A1 migration and controlled production acceptance completed without a payout. The persisted Treasury → Budget → Claims workflow, refresh persistence, and unlinked approval guard were accepted, while the existing Stage 7C Paid claim and digest remained unchanged.

The final A1 implementation and professional UI integration are merged in `30ae958a1ab221e651a5304cd8c6450184f8e398`. The resolution retained current treasury-link state, pre-link approval blocking, guarded `decide_claim` transition after linking, and all Stage 6/7 payment boundaries.

### A2-Lite live treasury activation — deployed, smoke acceptance in progress

The merged A2 implementation provides:

- one persisted activation state machine per workspace with stable category references and a locked budget snapshot;
- human-wallet-signed Create → exact multi-coin USDC Fund → dynamic Allocate transactions;
- digest-first persistence, server verification, and same-digest reconciliation for every activation step;
- join codes usable only after full Sui activation and claim recipients locked to the verified member wallet;
- payout authorization from the exact workspace `TreasurerCap`, never the global demo Cap;
- production Gemini live-or-manual-review behavior with no hidden mock fallback;
- authorized, paid-only, newest-first persisted History with real Testnet digest links.

Local verification before deployment on 5 September 2026:

```text
lint: PASS
typecheck: PASS
unit/integration: PASS (63 files / 263 tests)
build: PASS
Playwright assertions: 9/9 PASS across the full run plus focused rerun
Playwright process: NOT a clean exit; Windows Next.js web-server cleanup hung and was terminated
```

The owner-authorized A2 migration and deployment are now live enough to complete workspace activation, member claim submission, persisted private receipt evidence, Gemini receipt extraction, deterministic amount/duplicate/budget checks, and treasurer review.

Production smoke acceptance on 5 September 2026 reached the human approval boundary with a fresh `A2 Smoke Test 2` claim. The claim showed a `0.10 USDC` requested/receipt exact match, no duplicate signal, sufficient Food budget, stored private receipt evidence, and Gemini extraction of `Campus Cafe` / `0.10 USDC` / `2026-09-05`. Gemini suggested `Cafe` while the selected budget category was `Food`, so the deterministic policy correctly produced `REVIEW`.

The subsequent treasurer Approve action failed before persistence with:

```text
column reference "treasury_object_id" is ambiguous
```

Root cause: the A1 `public.decide_claim` function uses a PL/pgSQL local variable named `treasury_object_id` and later assigns `treasury_object_id = treasury_object_id`, which is ambiguous once executed. No approval or payout was committed. The existing claim should remain `under_review`.

Hotfix PR #33 adds a regression test and forward-only migration `20260905114500_stage8_a2_decide_claim_ambiguity_hotfix.sql`, renaming the local value to `linked_treasury_object_id` while preserving role checks, Sui-link guards, immutable approved snapshot fields, and authenticated execute permissions. Resume the **same** smoke-test claim only after this hotfix is merged and applied to the production Supabase project.

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

- final 4:21 narrated MP4 rendered locally; public YouTube/Loom upload remains pending
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
NEXT TASK: Merge and apply the forward-only decide_claim ambiguity hotfix, then resume the same under-review A2 smoke-test claim. Do not create a replacement claim or payout before approval is verified.
```

## Handoff Rule

Every Stage 8 change must keep this file and `docs/ROADMAP.md` accurate. Do not mark Stage 8 COMPLETE until the Devfolio package/video/pitch materials are finalized and the owner confirms submission.
