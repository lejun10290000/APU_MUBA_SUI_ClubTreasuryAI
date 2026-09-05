# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, blockers, and next task**.

## Current Snapshot

- Last updated: **5 September 2026 (MYT)**
- Default branch: `main`
- Current stage: **Stage 8 — Submission and pitch**
- Stage status: **CURRENT**
- Completed stages: **Stage 0–7**
- Latest product merge on `main`: `24255152976109a8f55399bf791e7a8768c5bacb` (PR #35)
- Post-merge CI: **run #244 — SUCCESS**
- Production app: `https://apumubasuiclubtreasuryai000.vercel.app`
- Production claims/payments: **live Supabase**
- Production Supabase project ref: `arldlnqiywhcuungvgei`
- Sui network: **Testnet**
- Current blocker: **none in the core Treasury → Budget → Claim → Approval → Payout path**
- Current priority: **final submission packaging, public video link, pitch/Q&A, and final production sanity checks**

## Stage Progress

| Stage | Name | Status |
| --- | --- | --- |
| 0 | Planning and repository setup | COMPLETE |
| 1 | Application foundation | COMPLETE |
| 2 | Core UI and deterministic domain rules | COMPLETE |
| 3 | Sui foundation and Move treasury | COMPLETE |
| 4 | Gemini AI layer | COMPLETE |
| 5 | Claim and receipt workflow integration | COMPLETE |
| 6 | Human approval and on-chain payment | COMPLETE |
| 7 | Demo hardening and deployment | COMPLETE |
| 8 | Submission and pitch | CURRENT |

## Final Stage 8 Core Acceptance

The Stage 8 A2 production blocker has been resolved and the original Campus Cafe smoke workflow was completed end to end.

### `decide_claim` hotfix

Production Supabase contains:

```text
20260905070013 stage8_a2_decide_claim_ambiguity_hotfix
```

The live `public.decide_claim(...)` function now uses `linked_treasury_object_id`; the ambiguous `treasury_object_id = treasury_object_id` assignment is gone.

### Successful Campus Cafe smoke claim

```text
Claim:
32c289f3-c1b6-4cf8-a6fb-ca49e1ad340a

Merchant:
Campus Cafe

Payout:
0.10 USDC

Approved category:
food

Recipient:
0x6b5ccd6b9abe76887fd93bdf04659cbbe32c42c3e9c308a240963df0cd4e2560

Treasury:
0x403e3e172e17201c8b940672fbf9b980fb094b36e9a68ffe569b00e84e7e2737

Final claim status:
paid

Final payment status:
paid

Confirmed digest:
ASxHXkS2N31rzFY2XP7NpQXGdWtTicPxVrGW7EojpyWm
```

Exactly one payment attempt exists for this claim and it is confirmed with the same digest.

Detailed evidence: [`STAGE8_A2_LIVE_ACCEPTANCE.md`](STAGE8_A2_LIVE_ACCEPTANCE.md)

## Stage 8 Judge-facing Polish — MERGED

PR #35 added:

- natural-language Gemini budget draft generation;
- editable AI-generated categories with deterministic exact-total validation;
- explicit human **Confirm budget** boundary;
- visible Gemini provider/model/mode provenance;
- consistent `Gemini AI → Deterministic Rule → Human Decision → Sui On-chain` badges;
- stronger confirmed-payout proof with digest and SuiVision link;
- `/dashboard/status` readiness view without exposing secrets;
- security-boundary regression tests;
- final Playwright judge golden-path coverage.

PR #35 merged as:

```text
24255152976109a8f55399bf791e7a8768c5bacb
```

Post-merge GitHub Actions run #244 passed:

```text
lint: PASS
typecheck: PASS
unit tests: PASS
production build: PASS
Playwright smoke/E2E: PASS
```

## Verified Sui Evidence

```text
Network:
Sui Testnet

Move package:
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f

Native Circle Testnet USDC:
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

Historical Stage 7C backup evidence remains valid:

```text
Claim:
69a20a42-ae58-4547-b2f5-28bb2de52262

Confirmed digest:
9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL

Payout:
0.10 USDC
```

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

## Safety Boundaries

- member can submit but cannot approve/pay;
- Gemini produces structured drafts/evidence, never final financial authority;
- deterministic checks validate totals, amounts, duplicates, budgets, snapshots, and chain evidence;
- human approval and payment remain separate actions;
- payout is built only from immutable approved snapshot fields;
- wallet signature is explicit;
- same-digest reconciliation prevents blind replacement payment;
- claim becomes `paid` only after verified Sui finality and payout evidence.

## Production Supabase Snapshot

At the final Stage 8 verification:

```text
claims: 14
treasuries: 6
budget_categories: 18
claim_payment_attempts: 7
```

No additional schema migration is required by PR #35; the judge-facing polish is application/UI/test work on top of the already-applied A2 database migrations and hotfix.

## Official Team

| Name | Role | University | GitHub |
| --- | --- | --- | --- |
| CHUA LE JUN | Developer | UTM Kuala Lumpur | `lejun10290000` |
| LE YONG XIANG | Developer | UTM Kuala Lumpur | `yx-le` |
| LAI YAN QI | Presenter | UTM Kuala Lumpur | `YANKEY-CODE` |

## Remaining Stage 8 Work

- upload final demo video to YouTube or Loom and add the public URL;
- finalize 5-minute pitch and Q&A;
- verify Devfolio fields, tracks, public repo, live demo and AI-tool declarations;
- submit before the deadline and save submission evidence.

## Mandatory Agent Startup Output

Before further coding work, every coding agent should show:

```text
CURRENT PROJECT STAGE: Stage 8 — Submission and pitch
STATUS: CURRENT
COMPLETED STAGES: 0–7
NEXT TASK: Final submission packaging and demo/pitch verification. Core live Treasury → Budget → Claim → Approval → Sui payout acceptance is complete; do not introduce optional scope that risks the demo.
```

## Handoff Rule

Keep this file and `docs/ROADMAP.md` accurate after every Stage 8 change. Do not mark Stage 8 COMPLETE until the owner confirms the final submission is complete.
