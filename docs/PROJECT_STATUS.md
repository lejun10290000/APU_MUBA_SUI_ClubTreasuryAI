# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, current development stage, blockers, and next task**.

Every teammate and coding agent must read this file before starting work and update it in the same PR/commit as development changes.

## Current Snapshot

- Last updated: **29 August 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 3 — Sui foundation and Move treasury**
- Stage status: **CURRENT**
- Completed stages: **Stage 0 — Planning and repository setup; Stage 1 — Application foundation; Stage 2 — Core UI and deterministic domain rules**
- Latest completed milestone: **Generic Move treasury custody and permissionless deposit foundation implemented with seven passing Move tests**
- Active implementation work: **`stage3/treasury-funding-foundation` is ready for review; no later Stage 3 task has started**
- Current blockers: **None after review; contributors need a compatible Sui CLI to run Move verification**
- Demo readiness: **The full mock product workflow is navigable and local generic Move authorization/custody logic is verified; no real Testnet USDC, wallet signing, deployment, payout, persistence, or live AI exists yet**

## Stage Progress

| Stage | Name                                   | Status      |
| ----- | -------------------------------------- | ----------- |
| 0     | Planning and repository setup          | COMPLETE    |
| 1     | Application foundation                 | COMPLETE    |
| 2     | Core UI and deterministic domain rules | COMPLETE    |
| 3     | Sui foundation and Move treasury       | CURRENT     |
| 4     | Gemini AI layer                        | NOT STARTED |
| 5     | Claim and receipt workflow integration | NOT STARTED |
| 6     | Human approval and on-chain payment    | NOT STARTED |
| 7     | Demo hardening and deployment          | NOT STARTED |
| 8     | Submission and pitch                   | NOT STARTED |

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

### Stage 2 — Mock treasury creation

- accessible treasury/event setup page using React Hook Form and shared Zod validation
- event/treasury name and total USDC budget inputs with recoverable field errors
- exact string-to-integer USDC minor-unit parsing without authoritative floating-point arithmetic
- live local preview with locked USDC currency and demo-draft status
- schema-validated session-only dashboard handoff with explicit no-persistence/no-wallet/no-on-chain labeling
- path-aware desktop and mobile dashboard navigation
- unit and browser coverage for valid and invalid treasury setup paths

### Stage 2 — Budget and claim workflow

- editable category budget builder with add/remove controls and responsive structured preview
- deterministic balanced, under-allocated, and over-allocated states
- mock confirmation only when category totals equal the treasury total exactly
- claim submission form with member, merchant, category, requested amount, typed receipt amount, and receipt reference
- deterministic receipt/request amount comparison
- exact duplicate detection by normalized receipt reference
- similar duplicate detection by normalized merchant and exact amount
- category-remaining validation and advisory Approve / Review / Reject recommendation
- explicit human approve/reject demo decision with approved-unpaid safety state
- transaction/history shell that never invents a Sui digest or payment result
- session-only navigation across treasury, budget, claim, review, and history screens

### Stage 2 — Completion verification

- targeted formatting check passed
- lint and strict TypeScript checks passed
- 45 unit tests cover money, schemas, budget totals, category remaining, receipt comparison, duplicate detection, workflow builders, and human decision state
- six Playwright smoke tests cover the product shell, treasury validation, full workflow, exact duplicate rejection, and mobile overflow
- production build passed with all Stage 2 routes
- desktop and 390 px visual inspection passed with zero browser console errors or warnings
- Stage 2 exit criteria are verified

### Stage 3 — Move treasury authorization foundation

- Move 2024 package created at `move/club_treasury`
- shared `Treasury<phantom Asset>` object with treasurer address, opaque external reference, and metadata revision
- address-owned `TreasurerCap<phantom Asset>` bound to one treasury object ID and treasurer
- capability omits `store`, preventing arbitrary public transfer outside the defining module
- privileged metadata update verifies capability/treasury binding and transaction sender
- phantom asset type preserves the native Sui Testnet USDC direction without claiming real Testnet custody
- Stage 2 TypeScript-to-Move responsibility mapping documented in `docs/ARCHITECTURE.md`
- Sui CLI `1.78.1-722ac4fcf484` compiled the package and passed all four original authorization tests
- no package was deployed and no package ID, object ID, transaction digest, deployed balance, or real USDC custody is claimed

### Stage 3 — Generic treasury funding foundation

- `Treasury<phantom Asset>` now owns a typed `Balance<Asset>` initialized to zero
- read-only balance access returns the exact native coin base-unit amount as `u64`
- permissionless `deposit<Asset>` consumes a positive `Coin<Asset>` into treasury custody
- deposits do not grant or modify treasurer authority and no withdrawal/payout path exists
- Move generic type safety prevents `Treasury<A>` from accepting `Coin<B>`
- zero-value deposits abort deterministically
- seven Move tests pass, including zero balance, exact single deposit, exact accumulation, zero rejection, and all prior authorization cases
- on-chain amounts remain native coin base units; no assumption is made about real USDC decimal scale
- no real Testnet USDC deposit, wallet connection, deployment, package/object ID, or transaction digest is claimed

## Not Yet Implemented

- real authentication and user accounts
- treasury editing UI
- real receipt file upload or storage
- real Sui wallet connection
- Move category allocation, payout, event, and remaining authorization tests
- real Testnet treasury creation/funding/budget confirmation/payout
- `@google/genai` live Gemini implementation
- live budget/receipt AI analysis
- Supabase migrations and private receipt bucket
- persistent claim + human approval integration
- Sui Testnet deployment
- live demo URL, screenshots, and video

Do not describe these as working until real code and verification exist.

## Next Recommended Task

### Stage 3 task: Implement and test confirmed category-allocation state

Extend the verified authorization and custody foundation with the next smallest reviewable contract task. Do not add payout behavior or deploy yet.

Required priorities:

1. Model the minimum confirmed category allocation and remaining-amount state in native `u64` base units.
2. Require the matching treasurer capability and transaction sender to confirm or update privileged allocation state.
3. Preserve deterministic uniqueness and total-allocation invariants without implementing payouts.
4. Keep wallet UI integration, Testnet deployment, payout events, and fund release out of this task.
5. Add focused Move tests for valid allocation setup and invalid authorization/allocation cases.
6. Run `sui move test` plus all existing application checks and update the handoff documents.

### Stage 2 completion evidence

- full mock product flow is navigable with clearly labeled mock/demo data: **VERIFIED**
- hard financial rules are deterministic and covered by unit tests: **VERIFIED**
- authoritative financial input and arithmetic use integer/minor-unit values: **VERIFIED**
- UI makes no false live Gemini, persistence, wallet, or Sui payout claims: **VERIFIED**
- formatting, lint, typecheck, unit tests, build, smoke tests, and responsive visual QA pass: **VERIFIED**

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
CURRENT PROJECT STAGE: Stage 3 — Sui foundation and Move treasury
STATUS: CURRENT
COMPLETED STAGES: Stage 0; Stage 1; Stage 2
NEXT TASK: Implement and test confirmed category-allocation state
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

### 2026-08-29 — Added generic Stage 3 treasury funding foundation

- Status: Stage 3 remains CURRENT; generic custody/deposit task complete and awaiting review
- Change: Added typed `Balance<Asset>` custody, exact `u64` balance access, permissionless positive `Coin<Asset>` deposits, and focused funding tests.
- Verification: Sui CLI `1.78.1-722ac4fcf484`; `sui move test` passed 7/7 tests; frozen install, lint, typecheck, 45 application unit tests, and production build passed.
- Safety: No real Testnet USDC, wallet connection, withdrawal, payout, category allocation, deployment, package/object ID, or transaction digest was added or claimed.
- Next: Implement and test the minimum confirmed category-allocation state without payout or deployment.

### 2026-08-28 — Added Stage 3 Move treasury authorization foundation

- Status: Stage 3 remains CURRENT; first foundation task complete and awaiting review
- Change: Added the Move 2024 package, shared generic treasury object, module-controlled treasurer capability, privileged metadata mutation, and TypeScript-to-Move mapping.
- Verification: Sui CLI `1.78.1-722ac4fcf484`; `sui move test` passed 4/4 tests; application verification recorded in the pull request.
- Safety: No Testnet deployment, package/object ID, transaction digest, wallet key, real balance, or USDC custody claim was added.
- Next: Implement and test generic treasury deposit/funding custody without payout or deployment.

### 2026-08-28 — Completed Stage 2 core mock workflow and deterministic rules

- Status: Stage 2 COMPLETE; Stage 3 CURRENT
- Change: Added the category budget editor, balanced allocation preview, claim submission, receipt comparison, exact/similar duplicate helpers, category checks, deterministic recommendation, human demo decision, transaction/history shell, and complete responsive navigation.
- Verification: Targeted Prettier check, lint, typecheck, 45 unit tests, six Playwright smoke tests, production build, desktop/mobile visual inspection, zero horizontal mobile overflow, and zero browser console errors passed.
- Safety: All new data is session-only; no Supabase persistence, wallet signature, Move execution, transaction digest, live Gemini call, or Sui payout is claimed.
- Next: Scaffold the Stage 3 Move package and test the treasury object plus treasurer admin capability.

### 2026-08-28 — Added mock treasury/event creation flow

- Status: Completed implementation, ready for review
- Change: Added an accessible React Hook Form treasury setup page, exact USDC display-to-minor-unit parsing, schema-validated session storage, dashboard success handoff, path-aware navigation, and explicit demo safety boundaries.
- Verification: Targeted Prettier check, lint, typecheck, 32 unit tests, 3 Playwright smoke tests, production build, desktop/mobile visual inspection, zero horizontal mobile overflow, and zero browser console errors passed.
- Next: Build budget-category creation and an editable balanced-budget preview.

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
