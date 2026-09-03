# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, blockers, and next task**.

## Current Snapshot

- Last updated: **4 September 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 7 — Demo hardening and deployment**
- Stage status: **CURRENT**
- Completed stages: **Stage 0; Stage 1; Stage 2; Stage 3; Stage 4; Stage 5; Stage 6**
- Completed Stage 7 sub-stages: **7A, 7B, 7C**
- Remaining Stage 7 sub-stage: **7D — final reliability hardening, recovery/evidence, and readiness audit**
- Production app: `https://apumubasuiclubtreasuryai000.vercel.app`
- Production claims mode: **live Supabase**
- Production AI mode for rehearsal: **deterministic mock** (`AI_MODE=mock`, live Gemini disabled)
- Sui network: **Testnet**
- Current blockers: **none for starting 7D**
- Latest completed milestone: **Stage 7C deployed end-to-end live rehearsal passed with one confirmed 0.10 USDC payout and idempotent paid refresh.**

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

## Stage 0–6 Readiness Summary

### Stage 0 — COMPLETE
Planning, requirements, architecture, tech-stack decisions, AI usage policy, staged-development workflow, and repository handoff rules are present. Team-member placeholders remain a Stage 8 submission item.

### Stage 1 — COMPLETE
Reproducible Next.js/React/strict-TypeScript foundation with pinned pnpm/Node tooling, frozen lockfile, centralized config, tests, Playwright, GitHub Actions CI, mock-first AI, and Sui/Supabase service boundaries.

### Stage 2 — COMPLETE
Deterministic financial rules plus the responsive mock treasury, budget, claim, review, human-decision, and history workflow.

### Stage 3 — COMPLETE
Sui Testnet Move treasury, wallet integration, native Circle Testnet USDC, capability authorization, category allocations, payout enforcement, typed events, and 31/31 Move tests.

Verified package:

```text
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f
```

Native Circle Sui Testnet USDC:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

### Stage 4 — COMPLETE
Guarded Gemini adapter using `@google/genai`, structured outputs, server-side validation, mock-first billing policy, and explicit owner-controlled live validation.

### Stage 5 — COMPLETE
Live Supabase claim persistence, private receipt storage, wallet identity binding, RLS, duplicate checks, advisory AI/recommendation state, human decisions, and immutable approved-but-unpaid payout snapshots.

### Stage 6 — COMPLETE
Human-approved Sui payout flow with immutable snapshot execution, explicit wallet signature, digest-first persistence, same-digest reconciliation, exact signed-transaction verification, canonical `PayoutEvent` verification, finality-gated database updates, and no blind retries.

The first failed live acceptance remains preserved as incident evidence in `docs/STAGE6_LIVE_VALIDATION.md`. A later aligned acceptance passed with exactly one 0.10 USDC payout.

## Current Clean Demo Objects

Stage 7 uses the clean Stage 6/7 acceptance pair:

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101

Treasurer wallet:
0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea
```

These are public Testnet identifiers. Never commit private keys, recovery phrases, executable signed transaction bytes, Gemini keys, or Supabase server secrets.

## Stage 7 Progress

### Stage 7A — COMPLETE — production deployment baseline

- Production Vercel deployment established and verified.
- Production branch is `main`.
- `/api/health` reports `ok=true`, `ready=true`, `stage=7`.
- Production environment guards/documentation added.
- Repository CI and isolated Playwright smoke baseline passed.

### Stage 7B — COMPLETE — repeatable demo preflight and payout safety

Merged through PR #23.

Key protections:

- deterministic demo/reset runbook
- server-authoritative Supabase ↔ Sui pre-sign comparison
- current Sui Treasury BCS parsing before payout signature
- exact Treasury/category/balance alignment checks
- sufficient-funds check
- mismatch blocks `sign()` and every downstream payment side effect
- Stage 6 finality/reconciliation invariants remain intact

Verified CI on the 7B merge candidate and merged `main`: lint, typecheck, unit tests, production build, and Playwright smoke all passed.

### Stage 7C — COMPLETE — deployed end-to-end live rehearsal

The production rehearsal was run against:

```text
Production app:
https://apumubasuiclubtreasuryai000.vercel.app

Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

Category:
events

Recipient / connected treasurer wallet:
0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea
```

The rehearsal exposed two production-only identity issues, both fixed with TDD before payment:

1. live claim workspace attempted to load before wallet authentication, creating an auth/workspace deadlock — fixed in PR #24
2. fresh anonymous Supabase browser sessions did not resolve back to the existing canonical wallet user — fixed in PR #25 with canonical wallet-principal resolution while preserving RLS and unique wallet ownership

The matching `stage7c_wallet_principal_portability` migration was applied to the live Supabase project.

Successful live rehearsal claim:

```text
Claim ID:
69a20a42-ae58-4547-b2f5-28bb2de52262

Requested / approved payout:
0.10 USDC

Category:
events

Confirmed digest:
9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL

Payment attempt:
fae3fbfb-0738-47ae-b08b-764601b96ef1
```

Verified final state:

```text
Claim status: paid
Payment status: paid
Attempts total: 1
Confirmed attempts: 1
Active attempts: 0
Failure code: null

Category allocated: 1.00 USDC
Category spent:     0.20 USDC
Category remaining: 0.80 USDC
```

A hard browser refresh preserved the same `Paid` state and digest, did not show the Pay button, did not request another wallet signature, and did not create another payment attempt. **Stage 7C exit criteria are VERIFIED.**

Detailed rehearsal evidence: `docs/STAGE7C_LIVE_REHEARSAL.md`.

## Latest Automated Verification

Latest Stage 7C hotfix merge commit on `main`:

```text
4d4d18f6fdf3cb826c0488c285b6ea222b50bcb4
```

Post-merge GitHub Actions run #136 passed:

```text
pnpm install --frozen-lockfile: pass
pnpm lint: pass
pnpm typecheck: pass
pnpm test: pass
pnpm build: pass
Playwright Chromium install: pass
pnpm test:e2e:smoke: pass
```

Normal CI remains mock-only and performs no live Gemini request and no live Sui payout.

## Stage 7 — Current Goal

Finish **Stage 7D** only. Do not expand product scope unless needed to make the official demo reliable.

### Next Recommended Task — Stage 7D

1. rehearse and document recovery for the most likely demo failures without creating unnecessary extra payouts
2. verify user-facing error/loading/recovery states for wallet disconnect, auth failure, Supabase failure, preflight mismatch, and ambiguous transaction outcome
3. verify the production health endpoint and deployment baseline still match `main`
4. prepare backup screenshots/video/evidence for the successful Stage 7C flow
5. verify sufficient Testnet SUI/USDC remains for the official demo
6. run secret/repository/history checks
7. update README/demo documentation with the final deployed path and evidence
8. run the final Stage 7 readiness audit and only then mark Stage 7 COMPLETE

### Stage 7 Exit Gate

Stage 7 is complete only when:

- public deployed app is reachable
- required production configuration is documented and safe
- complete deployed demo succeeds from a known-good scenario
- failures have understandable recovery paths
- team has enough Testnet assets for the official demo
- backup demo evidence exists
- repository/secret checks pass
- final automated CI is green

## Locked MVP Decisions

- target user: university club treasurers and finance committee members
- AI is advisory; human treasurer remains final approver
- Sui owns Testnet custody/authorization/payout enforcement
- payment asset: native Circle Sui Testnet USDC
- product AI: Google Gemini Developer API
- default model: `gemini-2.5-flash`
- normal development/rehearsal AI mode: `mock` unless owner explicitly enables live calls
- database/private receipt storage: Supabase
- authoritative money uses integer/minor-unit semantics
- raw receipts remain private/off-chain
- optional features wait until the core deployed demo is stable

## Mandatory Agent Startup Output

Before further Stage 7 development, every coding agent must show:

```text
CURRENT PROJECT STAGE: Stage 7 — Demo hardening and deployment
STATUS: CURRENT
COMPLETED SUB-STAGES: 7A, 7B, 7C
NEXT TASK: Stage 7D final reliability hardening, recovery/evidence, and readiness audit. Do not perform an unnecessary live payout.
```

## Recent Development Log

### 2026-09-04 — Stage 7C deployed live rehearsal completed

- Production live claims + Supabase wallet identity were verified.
- PR #24 fixed wallet-auth-before-workspace ordering.
- PR #25 fixed fresh-session canonical wallet identity portability while preserving RLS.
- A fresh unique synthetic receipt/claim was submitted and human-approved.
- Stage 7B pre-sign protection passed against the clean Treasury/category.
- Exactly one 0.10 USDC Testnet payout was signed and confirmed.
- Confirmed digest: `9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL`.
- Database budget moved from 0.90 to 0.80 USDC remaining.
- Hard refresh preserved the same paid state/digest with 1 confirmed attempt and 0 active attempts.
- Stage 7C is COMPLETE; Stage 7 proceeds to 7D.

### 2026-09-03 — Stage 7A/7B production and preflight baseline

- Vercel production baseline verified.
- Stage 7B pre-sign Supabase ↔ Sui consistency checks merged through PR #23.
- Mismatch regression proves wallet `sign()` and downstream payment side effects remain untouched.

### 2026-09-02 — Stage 6 completed

- Fresh aligned Stage 6 live acceptance passed with exactly one 0.10 USDC payment attempt.
- Refresh/idempotency preserved the same digest without a replacement transaction.
- Historical failed acceptance remains preserved for incident evidence.

## Handoff Rule

Every Stage 7 change must update this file, `docs/ROADMAP.md`, and affected setup/architecture/demo documentation. Do not mark Stage 7 COMPLETE until the final 7D exit gate is actually verified.
