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
- Sui network: **Testnet**
- Current blocker: **production A2 smoke acceptance reaches treasurer review, but human approval remains blocked until PR #33 is merged and its forward-only `decide_claim` hotfix migration is applied to the production Supabase project**
- Current priority: **merge/apply PR #33 first, then integrate PR #34 live Overview and resume the same under-review smoke-test claim; do not create a replacement claim or payout before approval is verified**

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

Package the already-working product for judging. **Do not add optional features unless they are required for submission or live-demo clarity.**

### A1 workflow continuity — merged, deployed, and production accepted

The A1 workflow provides persisted Treasury → Budget → Claims continuity, authenticated member join codes, an explicit unlinked approval/payment guard, and owner-only verified Sui Treasury/TreasurerCap linking while preserving the Stage 6/7 payment safety pipeline.

The owner-authorized A1 migration and controlled production acceptance completed without a payout. The existing Stage 7C Paid claim and digest remained unchanged.

### A2-Lite live treasury activation — deployed, smoke acceptance in progress

The merged A2 implementation provides:

- one persisted activation state machine per workspace with stable category references and a locked budget snapshot;
- human-wallet-signed Create → exact multi-coin USDC Fund → dynamic Allocate transactions;
- digest-first persistence, server verification, and same-digest reconciliation for every activation step;
- join codes usable only after full Sui activation and claim recipients locked to the verified member wallet;
- payout authorization from the exact workspace `TreasurerCap`, never the global demo Cap;
- production Gemini live-or-manual-review behavior with no hidden mock fallback;
- authorized, paid-only persisted History with real Testnet digest links.

The owner-authorized A2 migration/deployment is live. Production smoke acceptance reached the human approval boundary with `A2 Smoke Test 2`: a fresh `0.10 USDC` claim persisted private receipt evidence, matched requested/receipt amount, passed duplicate and budget checks, and reached treasurer review. Gemini extracted `Campus Cafe`, `0.10 USDC`, and the receipt date; its `Cafe` suggestion conflicted with the selected `Food` budget category, so deterministic policy correctly returned `REVIEW`.

The subsequent Approve action failed before persistence with:

```text
column reference "treasury_object_id" is ambiguous
```

PR #33 fixes this production blocker with a forward-only migration and regression test. Its exact reviewed head passed CI #188, but the PR still needs to be merged and the migration applied to the actual production Supabase project before retrying the same claim.

### Live Overview dashboard — PR #34

PR #34 replaces the production sample Overview with an authenticated live dashboard while preserving a clearly labeled mock-only development fallback.

Implemented behavior:

- owner/treasurer workspaces only in the Overview selector;
- newest managed treasury selected by default;
- explicit `?treasury=<id>` selection preserved in the URL;
- live available balance, open-claim counts, budget health, category spending/remaining, recent managed claims, activation status, and confirmed payout history;
- claim/history filtering by exact treasury ID rather than display name;
- manual Refresh plus 30-second background refresh;
- selected treasury remains stable across refreshes;
- empty-state path to create the first treasury;
- existing human approval and explicit Sui wallet-signature safety boundary remains visible;
- mock mode remains available for deterministic CI/browser testing and is not presented as live production data.

Verification for PR #34 code head `b26f401b866ad463a006e57e6b76bedceff75b2a`:

```text
GitHub Actions CI #202: SUCCESS
lint: PASS
typecheck: PASS
unit tests: PASS (274/274)
build: PASS
Playwright smoke: PASS
```

PR #34 should be integrated after PR #33 so the production smoke-test blocker is repaired first. If PR #33 changes these status files on `main`, rebase/update PR #34 before merge and keep the combined handoff accurate.

### Stage 8A — Submission package

- final README
- team details
- tested setup/install instructions
- product/problem/architecture copy
- live demo URL and Sui deployment evidence
- AI-development-tool declaration
- copy-ready Devfolio package
- submission-facing UI and workflow polish with verified Sui evidence
- live treasury-selectable Overview for judge/demo clarity

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
NEXT TASK: Merge/apply PR #33 claim-approval hotfix first, then integrate PR #34 live Overview and resume the same under-review A2 smoke-test claim. Do not create a replacement claim or payout before approval is verified.
```

## Handoff Rule

Every Stage 8 change must keep this file and `docs/ROADMAP.md` accurate. Do not mark Stage 8 COMPLETE until the Devfolio package/video/pitch materials are finalized and the owner confirms submission.
