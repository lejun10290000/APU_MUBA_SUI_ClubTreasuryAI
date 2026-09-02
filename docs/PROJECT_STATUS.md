# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, blockers, and next task**.

## Current Snapshot

- Last updated: **2 September 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 7 — Demo hardening and deployment**
- Stage status: **CURRENT**
- Completed stages: **Stage 0; Stage 1; Stage 2; Stage 3; Stage 4; Stage 5; Stage 6**
- Latest completed milestone: **Stage 6 human-approved claim payout is merged and owner-controlled live acceptance is verified.**
- Stage 6 merge: **PR #20**, merge commit `61fb9c86f5077f9813add6dc94aa69b311aaf4d7`
- Current blockers: **None for starting Stage 7.**
- Open implementation issues before the Stage 7 readiness audit: **none**.
- Demo readiness: **Core end-to-end MVP works. Stage 7 must now make the live demo repeatable, deployable, recoverable, and presentation-safe.**

## Stage Progress

| Stage | Name                                   | Status      |
| ----- | -------------------------------------- | ----------- |
| 0     | Planning and repository setup          | COMPLETE    |
| 1     | Application foundation                 | COMPLETE    |
| 2     | Core UI and deterministic domain rules | COMPLETE    |
| 3     | Sui foundation and Move treasury       | COMPLETE    |
| 4     | Gemini AI layer                        | COMPLETE    |
| 5     | Claim and receipt workflow integration | COMPLETE    |
| 6     | Human approval and on-chain payment    | COMPLETE    |
| 7     | Demo hardening and deployment          | CURRENT     |
| 8     | Submission and pitch                   | NOT STARTED |

## Stage 0–6 Readiness Audit

### Stage 0 — COMPLETE

Planning, requirements, architecture, technical-stack decisions, AI usage policy, staged-development workflow, and repository handoff rules are present. The remaining team-member placeholders are a **Stage 8 submission item**, not a Stage 0 implementation blocker.

### Stage 1 — COMPLETE

PR #5 merged the reproducible Next.js/React/strict-TypeScript foundation with pinned Node/pnpm metadata, frozen lockfile, centralized configuration, mock-first AI boundary, Sui/Supabase boundaries, integer/minor-unit money helpers, loading/error foundations, tests, Playwright, and GitHub Actions CI.

### Stage 2 — COMPLETE

PRs #6–#9 merged deterministic financial schemas/rules plus the responsive mock treasury, budget, claim, review, human-decision, and history workflow. Mock data remains clearly separated from real Sui evidence.

### Stage 3 — COMPLETE

The Move treasury foundation, funding, allocations, payout enforcement, wallet transaction integration, and Testnet deployment were merged through the Stage 3 PR series ending in PR #15. The verified Move package has **31/31 Move tests** and the deployed package has not been modified by Stages 4–6.

Verified package:

```text
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f
```

Native Circle Sui Testnet USDC:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

Historical Stage 3 demo Treasury/Cap remain valid historical evidence, but that treasury was later used by failed Stage 6 acceptance attempts and is **not the current clean demo default**.

### Stage 4 — COMPLETE

PRs #16 and #17 merged the guarded `@google/genai` `2.19.0` adapter and recorded the owner-controlled `gemini-2.5-flash` live validation. Normal development/CI remains `AI_MODE=mock` and performs zero live Gemini calls.

### Stage 5 — COMPLETE

PR #18 merged Supabase persistence, private receipt storage, wallet identity binding, RLS, deterministic duplicate/recommendation logic, human decision persistence, and the immutable approved-but-unpaid payout snapshot. The owner-controlled live Supabase acceptance and all documented negative checks passed.

### Stage 6 — COMPLETE

PR #20 merged the approved-claim payment flow. The stage includes:

- immutable `approved_*` snapshot as the only payout source
- one active payment-attempt boundary per claim
- explicit Testnet wallet signature
- digest persistence before broadcast
- exact signed transaction validation
- Sui Testnet USDC submission
- canonical `PayoutEvent` BCS verification with safe JSON fallback
- same-digest reconciliation for ambiguous/interrupted outcomes
- no blind replacement signing after a successful/ambiguous transaction
- database paid state and budget synchronization only after verified on-chain success
- live-mode claim workspace loaded from the persisted Supabase treasury/category relationship

The first live acceptance exposed a duplicate-payout defect and is intentionally preserved as **failed acceptance evidence** in `docs/STAGE6_LIVE_VALIDATION.md`.

A fresh aligned acceptance then passed with:

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101

Category:
events

Approved payout:
0.10 USDC

Confirmed digest:
DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7
```

Before payout the synchronized category was `1.00 USDC allocated / 0 spent`. After exactly one wallet signature and exactly one payment attempt, the claim became `paid`, the attempt became `confirmed`, the category became `0.10 spent / 0.90 remaining`, and refresh preserved the same digest without showing another payment action or opening the wallet.

Stage 6 exit criteria are therefore **VERIFIED**.

## Latest Automated Verification

GitHub Actions push run **#100** verified the exact Stage 6 merge commit on `main`:

```text
pnpm install --frozen-lockfile: pass
pnpm lint: pass
pnpm typecheck: pass
pnpm test: 31 files / 171 tests pass
pnpm build: pass
Playwright Chromium install: pass
pnpm test:e2e:smoke: 7/7 pass
```

CI used:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
NEXT_PUBLIC_SUI_NETWORK=testnet
```

No live Gemini request and no live Sui payout is part of normal CI.

## Current Clean Demo Objects

Stage 7 should use the clean Stage 6 acceptance pair as the default live demo baseline:

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101
```

These identifiers are public Testnet objects. Do not commit wallet secrets, recovery phrases, signed executable transaction bytes, Gemini keys, or Supabase server secrets.

## Stage 7 — Current Goal

Make the already-working MVP reliable under hackathon/demo conditions. **Do not expand the product scope unless the core demo is already stable.**

### Next Recommended Task

Start Stage 7 from latest `main` and perform deployment/readiness hardening in this order:

1. establish the Vercel deployment and production environment-variable matrix without exposing secrets
2. connect the existing Supabase live project safely for the deployed app
3. verify the clean Sui Testnet Treasury/Cap and sufficient SUI + Testnet USDC for rehearsals
4. create a deterministic demo reset/seed procedure so every rehearsal starts from known state
5. exercise the full deployed wallet → budget/AI → claim/receipt → human approval → Sui payout flow
6. harden loading/error/recovery UX for Gemini, Supabase, wallet, and Sui failures discovered during rehearsal
7. repeat the full demo until it is reliable and comfortably within pitch time
8. prepare backup screenshots/video and perform a secret-history/public-repository audit

### Stage 7 Exit Gate

Stage 7 is complete only when:

- the public deployed app is reachable
- required production configuration is documented and safe
- the complete demo flow succeeds repeatedly from a clean scenario
- failures have understandable recovery paths
- the team has enough Testnet assets for the official demo
- backup demo evidence exists
- repository/secret checks pass

## Locked MVP Decisions

- target user: university club treasurers and finance committee members
- AI is advisory; human treasurer remains final approver
- Sui owns Testnet custody/authorization/payout enforcement
- payment asset: native Circle Sui Testnet USDC
- product AI: Google Gemini Developer API
- default model: `gemini-2.5-flash`
- normal development AI mode: `mock`
- database/private receipt storage: Supabase
- authoritative money uses integer/minor-unit semantics
- raw receipts stay private/off-chain
- optional features wait until the core deployed demo is stable

## Mandatory Agent Startup Output

Before Stage 7 development, every coding agent must show:

```text
CURRENT PROJECT STAGE: Stage 7 — Demo hardening and deployment
STATUS: CURRENT
COMPLETED STAGES: Stage 0; Stage 1; Stage 2; Stage 3; Stage 4; Stage 5; Stage 6
NEXT TASK: Establish the production deployment/configuration baseline, then rehearse and harden the existing end-to-end demo without adding optional features.
```

## Recent Development Log

### 2026-09-02 — Stage 6 completed and merged; Stage 7 readiness audit started

- Fresh aligned Stage 6 live acceptance passed with exactly one `0.10 USDC` payment attempt and confirmed digest `DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7`.
- Refresh/idempotency verification preserved the same paid state/digest and did not create a second payment attempt or wallet signature.
- PR #20 merged Stage 6 into `main` at `61fb9c86f5077f9813add6dc94aa69b311aaf4d7`.
- `main` push CI run #100 passed 171/171 unit tests and 7/7 Playwright smoke tests plus lint, typecheck, and production build.
- Stage 7 readiness audit identified stale documentation and historical demo-object defaults as cleanup items before deployment work.

### 2026-09-02 — Failed Stage 6 acceptance preserved

- The first Stage 6 live acceptance produced duplicate successful Testnet payouts after a successful-but-unverifiable transaction was incorrectly classified as failed.
- The defect was repaired and covered by regression tests; the affected records/digests remain preserved as incident evidence and are not reused as the success case.
- Full details remain in `docs/STAGE6_LIVE_VALIDATION.md`.

## Handoff Rule

Every Stage 7 development change must update this file, `docs/ROADMAP.md`, and affected setup/architecture/demo documentation. Do not mark Stage 7 COMPLETE until the deployed/rehearsed exit gate is actually verified.