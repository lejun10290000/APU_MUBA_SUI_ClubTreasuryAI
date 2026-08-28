# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, current development stage, blockers, and next task**.

Every teammate and coding agent must read this file before starting work and update it in the same PR/commit as development changes.

## Current Snapshot

- Last updated: **28 August 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 2 — Core UI and deterministic domain rules**
- Stage status: **CURRENT**
- Completed stages: **Stage 0 — Planning and repository setup; Stage 1 — Application foundation**
- Latest completed milestone: **Stage 2 landing, demo access, responsive treasurer dashboard, and navigation shell implemented and locally verified**
- Active implementation work: **None after the Stage 2 product-shell handoff**
- Current blockers: **None for Stage 2 mock-data UI/domain work**
- Demo readiness: **Landing-to-dashboard mock flow is navigable; treasury setup, claim actions, persistence, wallet, and payment execution are not implemented yet**

## Stage Progress

| Stage | Name | Status |
|---|---|---|
| 0 | Planning and repository setup | COMPLETE |
| 1 | Application foundation | COMPLETE |
| 2 | Core UI and deterministic domain rules | CURRENT |
| 3 | Sui foundation and Move treasury | NOT STARTED |
| 4 | Gemini AI layer | NOT STARTED |
| 5 | Claim and receipt workflow integration | NOT STARTED |
| 6 | Human approval and on-chain payment | NOT STARTED |
| 7 | Demo hardening and deployment | NOT STARTED |
| 8 | Submission and pitch | NOT STARTED |

See `docs/DEVELOPMENT_STAGES.md` for exact scope and exit criteria.

## Completed

### Stage 0

- project concept, target user, and dual-track positioning
- hackathon requirements and submission checklist
- product specification, architecture, roadmap, demo plan, and team/agent workflow
- Gemini provider decision plus mock-first AI billing policy

### Stage 1

- Next.js 16 App Router + React 19 + strict TypeScript application scaffold
- Node `24.16.0` pinned via `.nvmrc` and `.node-version`
- pnpm `10.15.1` pinned via `packageManager`
- committed `pnpm-lock.yaml` and frozen-lockfile CI install
- Tailwind CSS 4 base styling and application shell
- `@mysten/sui` v2 and `@mysten/dapp-kit-react` dependencies installed
- Zod + React Hook Form dependencies installed
- Vitest + React Testing Library + Playwright configured
- lint, format, typecheck, test, e2e, build scripts
- centralized Zod environment validation in `src/config/env.ts`
- mock-first `AIService` boundary and deterministic `MockAIService`
- Stage 1 intentionally has no live Gemini implementation
- Sui and Supabase module/service boundaries created without live business integration
- deterministic AI fixtures created under `tests/fixtures/ai/`
- integer/minor-unit money helpers created in `src/domain/money.ts`
- health homepage and `/api/health` route
- base loading, error, and not-found UI
- unit tests for money rules and mock AI schema outputs
- Playwright home/health smoke test
- GitHub Actions CI runs with `AI_MODE=mock`, no Gemini key, and frozen lockfile
- CI verification passed: install, lint, typecheck, unit tests, production build, Chromium install, smoke test

### Stage 2 — Domain foundation

- shared Zod schemas for treasury, budget categories, budgets, claims, statuses, recommendations, currency, and minor-unit amounts
- positive and non-negative safe-integer minor-unit validation
- duplicate budget category ID/name validation
- deterministic balanced/under-allocated/over-allocated budget-total checks
- deterministic category-remaining and sufficient-balance checks
- unit tests for the new schemas and financial rules
- no live Gemini, Supabase, wallet, or Sui transaction behavior introduced

### Stage 2 — Product shell

- polished responsive landing page with product workflow and financial-safety messaging
- demo-access role-selection shell with treasurer navigation and clearly deferred member flow
- reusable desktop sidebar, mobile navigation, brand, and icon components
- responsive treasurer dashboard using schema-validated deterministic fixtures
- mock treasury balance, budget-category, claim-queue, safety-boundary, and activity views
- health endpoint advanced to Stage 2
- browser smoke coverage for landing -> login -> dashboard navigation and mobile overflow
- all displayed financial data is labeled mock/demo; no live service or payment claims introduced

## Not Yet Implemented

- treasury/event creation and editing UI
- receipt/request amount comparison and duplicate-claim helper rules
- real Sui wallet connection
- Move package and contract tests
- treasury creation/funding/budget confirmation/payout
- `@google/genai` live Gemini implementation
- live budget/receipt AI analysis
- Supabase migrations and private receipt bucket
- integrated claim + human approval flow
- Sui Testnet deployment
- live demo URL, screenshots, and video

Do not describe these as working until real code and verification exist.

## Next Recommended Task

### Stage 2 task: Build the treasury/event creation UI

Add a mock-data treasury/event setup flow without live Supabase, wallet, Move, or Sui transactions.

Required priorities:

1. Add an accessible treasury/event creation form using React Hook Form and the shared Zod schemas.
2. Collect event name, total USDC budget, and the minimum mock metadata needed by the demo.
3. Parse display amounts into safe integer minor units; never perform authoritative money work with floating point values.
4. Show clear validation and recoverable form errors.
5. Keep submission local/mock-only and route the successful preview back into the Stage 2 dashboard flow.
6. Label all created data as demo-only with no persistence, wallet, deposit, or on-chain claims.
7. Add unit/component/browser coverage for valid and invalid setup paths.
8. Update status, roadmap, and README with the next smallest Stage 2 task.

### Stage 2 exit criteria

- main product flow is navigable with clearly labeled mock/demo data
- hard financial rules are deterministic and covered by unit tests
- no JavaScript floating-point values are used as authoritative money values
- no UI claims live Gemini, Supabase persistence, wallet signing, or on-chain payment before those integrations exist
- lint, typecheck, tests, build, and smoke CI continue to pass

## Locked MVP Decisions

Do not change without explicit team approval:

- target user: university club treasurers and finance committee members
- AI is advisory; treasurer approves final payment
- Sui performs real testnet stablecoin custody/payment execution in later stages
- payment asset: native Sui Testnet USDC
- one Next.js application for frontend/server API
- product AI provider: Google Gemini Developer API
- default planned Gemini model: `gemini-2.5-flash`
- official Gemini SDK when Stage 4 begins: `@google/genai`
- normal development AI mode: `mock`
- database/storage later: Supabase PostgreSQL + private Storage
- blockchain packages: `@mysten/sui` v2 + `@mysten/dapp-kit-react`
- raw receipts remain private/off-chain
- authoritative money values use integer/minor-unit semantics
- optional features wait until the core demo is stable

## External Setup Needed Later

Not required for Stage 2, but later stages will need:

- Google Gemini API project/key for explicit live AI tests/demo
- Supabase project + keys and private receipt bucket
- Sui wallet(s)
- Sui Testnet SUI for gas
- native Sui Testnet USDC

Never place keys, wallet private keys, seed phrases, or secrets in GitHub.

## Mandatory Agent Startup Output

Before development, every coding agent must read this file and show the values from it:

```text
CURRENT PROJECT STAGE: Stage 2 — Core UI and deterministic domain rules
STATUS: CURRENT
COMPLETED STAGES: Stage 0; Stage 1
NEXT TASK: Build the mock treasury/event creation UI with safe minor-unit validation
```

## Mandatory Update Rules

A task is not complete until its agent:

1. updates Current Snapshot and Stage Progress
2. moves only genuinely verified work to Completed
3. keeps missing/blocked work accurate
4. replaces Next Recommended Task with the next smallest demo-critical task
5. updates matching `docs/ROADMAP.md` items
6. updates `docs/DEVELOPMENT_STAGES.md` if stage status changes
7. records verification commands/results
8. adds a Recent Development Log entry
9. updates README/architecture/tech stack/env docs when affected
10. never claims live Gemini/Sui/deployment behavior without evidence

## Recent Development Log

### 2026-08-28 — Added Stage 2 landing and treasurer dashboard shell

- Status: Completed implementation, ready for review
- Change: Added the responsive landing page, demo role selection, reusable product navigation, schema-backed mock treasurer dashboard, Stage 2 health status, and desktop/mobile browser smoke coverage.
- Verification: Targeted Prettier check, lint, typecheck, 18 unit tests, 2 Playwright smoke tests, production build, desktop/mobile visual inspection, zero horizontal mobile overflow, and zero browser console errors passed.
- Next: Build the mock treasury/event creation UI with safe minor-unit validation.

### 2026-08-28 — Added Stage 2 shared domain schemas and budget rules

- Status: Completed implementation, ready for review
- Change: Added treasury/budget/claim/status Zod schemas, safe positive minor-unit validation, budget-total checks, category-remaining checks, and deterministic unit tests.
- Verification: Frozen dependency install, targeted Prettier check, lint, typecheck, 18 unit tests, and production build passed. Repository-wide `pnpm format` still reports pre-existing formatting drift outside this change.
- Next: Build the landing/login and treasurer dashboard shell with clearly labeled mock data.

### 2026-08-28 — Completed Stage 1 application foundation

- Status: COMPLETE
- Pull request: #5
- Change: Added executable Next.js foundation, pinned runtime/package manager, mock-first service boundaries, deterministic money helpers/fixtures, error/loading states, tests, health route, and CI.
- Verification: GitHub Actions passed frozen install, lint, typecheck, unit tests, production build, Chromium installation, and Playwright smoke test with no Gemini API key.
- Next: Stage 2 — build mock-data product shell and deterministic financial domain.

### 2026-08-28 — Strengthened Stage 1 foundation requirements

- Status: Completed planning change
- Change: Locked reproducibility, config, service-boundary, money, testing, and onboarding requirements before implementation.

### 2026-08-28 — Switched AI plan to Gemini and added development stages

- Status: Completed planning change
- Change: Introduced Gemini mock-first policy and Stages 0–8.

## Starter Prompt for a New Coding Agent

```text
Open this repository and read AGENTS.md, docs/PROJECT_STATUS.md,
docs/DEVELOPMENT_STAGES.md, and docs/AI_USAGE_POLICY.md first, followed by the
other required project documents. Before editing, print the current project stage,
status, completed stages, and exact next task from docs/PROJECT_STATUS.md. Then
complete only the Next Recommended Task. Preserve locked MVP decisions, run every
listed acceptance check, and update docs/PROJECT_STATUS.md, docs/ROADMAP.md, and
stage status in the same PR before declaring the task complete.
```
