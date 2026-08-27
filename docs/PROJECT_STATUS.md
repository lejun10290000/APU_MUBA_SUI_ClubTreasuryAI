# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status, current development stage, blockers, and next task**.

Every teammate and coding agent must read this file before starting work. Every development change must update this file in the same PR/commit.

## Current Snapshot

- Last updated: **28 August 2026 (MYT)**
- Default branch: `main`
- **Current stage: Stage 1 — Application foundation**
- Stage status: **CURRENT**
- Completed stages: **Stage 0 — Planning and repository setup**
- Latest completed milestone: **Stage 1 foundation requirements strengthened before implementation**
- Active implementation work: **None yet**
- Current blockers: **None for Stage 1 scaffolding**
- Demo readiness: **Planning complete; no executable application yet**

## Stage Progress

| Stage | Name | Status |
|---|---|---|
| 0 | Planning and repository setup | COMPLETE |
| 1 | Application foundation | CURRENT |
| 2 | Core UI and deterministic domain rules | NOT STARTED |
| 3 | Sui foundation and Move treasury | NOT STARTED |
| 4 | Gemini AI layer | NOT STARTED |
| 5 | Claim and receipt workflow integration | NOT STARTED |
| 6 | Human approval and on-chain payment | NOT STARTED |
| 7 | Demo hardening and deployment | NOT STARTED |
| 8 | Submission and pitch | NOT STARTED |

See `docs/DEVELOPMENT_STAGES.md` for exact scope and exit criteria.

## Completed

- project concept, target user, and dual-track positioning
- hackathon requirements/submission checklist
- product specification and MVP boundaries
- architecture and on-chain/off-chain boundaries
- demo scenario/rehearsal plan
- technical stack
- Sui SDK v2/new dApp Kit selection
- native Sui Testnet USDC selection
- secret-safe environment template
- project status/agent handoff process
- AI provider changed to Google Gemini Developer API
- mock-first Gemini usage/billing policy
- future development split into official stages
- mandatory agent rule to show current stage before development
- strengthened Stage 1 foundation requirements for reproducibility, service boundaries, config safety, money handling, smoke testing, and teammate onboarding

## Not Yet Implemented

- Next.js application scaffold
- dependency manifest/lockfile
- pinned Node/pnpm project metadata
- frontend pages/reusable UI
- centralized runtime configuration module
- base error/loading/not-found boundaries
- deterministic financial schemas/rules
- integer/minor-unit money utilities
- AI/Sui/Supabase service boundaries in code
- deterministic mock fixtures in code
- Supabase migrations/private receipt bucket
- Gemini SDK integration and live Gemini calls
- Sui wallet connection
- Move package/tests
- treasury creation/deposit/budget confirmation/payout
- integrated claim/human-approval workflow
- CI
- smoke/e2e tests
- Sui Testnet deployment
- live demo/screenshots/video

Do not describe anything above as working until real code and verification exist.

## Next Recommended Task

### Stage 1 task: Scaffold the strengthened application foundation

Create the implementation foundation specified in `docs/TECH_STACK.md` and `docs/DEVELOPMENT_STAGES.md` without adding business features yet.

Required deliverables:

1. Scaffold Next.js 16 App Router with React 19 and strict TypeScript.
2. Use pnpm and commit `pnpm-lock.yaml`.
3. Pin Node/pnpm versions with `.nvmrc` or `.node-version` and `packageManager` in `package.json`.
4. Configure Tailwind CSS 4 and a minimal shared layout/UI foundation.
5. Add current `@mysten/sui` v2 and `@mysten/dapp-kit-react` packages.
6. Add Zod, React Hook Form, Vitest, React Testing Library, and Playwright.
7. Add lint, format, typecheck, unit-test, e2e-test, and build scripts.
8. Create the application directory boundaries documented in `docs/TECH_STACK.md`.
9. Add one centralized validated config/environment module.
10. Default to `AI_MODE=mock`; Stage 1 must not require or call Gemini.
11. Create an `AIService` interface plus mock-safe structure only; do not implement live Gemini behavior yet.
12. Create placeholder/module boundaries for Sui and Supabase without live business integration.
13. Add deterministic fixtures for sample budget, claim, and AI responses.
14. Add domain money conventions/utilities based on integer/minor units; do not use JS floating point for authoritative money values.
15. Add minimal home/health route proving the app builds/runs.
16. Add base `loading`, `not-found`, and `error` boundaries.
17. Add at least one smoke test for the home/health path.
18. Add GitHub Actions for install, lint, typecheck, unit tests, and build.
19. CI must run in mock mode and pass with no Gemini key.
20. Update README with a fresh-clone developer quick-start.
21. Update this file, `docs/DEVELOPMENT_STAGES.md`, and `docs/ROADMAP.md` in the same PR when implementation status changes.

Acceptance criteria:

- a new teammate can clone and follow README without asking for hidden setup steps
- clean `pnpm install --frozen-lockfile`
- pinned Node/pnpm metadata exists
- lint passes
- typecheck passes
- unit tests pass
- production build passes
- Playwright config loads
- smoke test passes
- CI passes without `GEMINI_API_KEY`
- default AI mode is mock and makes zero Gemini requests
- configuration is centralized/validated
- AI/Sui/Supabase boundaries exist without premature live integrations
- money representation uses integer/minor units for authoritative values
- base error/loading/not-found UX exists
- no secrets or `.env.local` committed
- no fake Sui package IDs/transaction digests/deployment claims
- no Stage 2+ business feature is prematurely marked complete

Non-goals for Stage 1:

- no Move business logic
- no live Supabase project setup
- no live Gemini API calls
- no treasury/claim business UI beyond minimal shared shell
- no Sui Testnet deployment

## Locked MVP Decisions

Do not change without explicit team approval:

- Target user: university club treasurers and finance committee members
- AI is advisory; treasurer approves the final payment
- Sui performs real testnet stablecoin custody/payment execution
- Payment asset: native Sui Testnet USDC
- Frontend/backend: one Next.js application
- AI provider: Google Gemini Developer API
- Default model: `gemini-2.5-flash`
- Official JS SDK: `@google/genai`
- Normal development AI mode: `mock`
- Database/storage: Supabase PostgreSQL + private Storage
- Blockchain packages: `@mysten/sui` v2 + `@mysten/dapp-kit-react`
- Raw receipts remain private/off-chain
- authoritative money values use integer/minor-unit semantics, not floating-point arithmetic
- optional features wait until core demo is stable

See `docs/TECH_STACK.md`, `docs/ARCHITECTURE.md`, and `docs/AI_USAGE_POLICY.md`.

## External Setup Needed Later

The team will eventually need:

- a Google Gemini API project/key for explicit live testing/demo
- Supabase project + keys
- private Supabase receipt bucket
- one or more Sui wallets
- Sui Testnet SUI for gas
- native Sui Testnet USDC for demo

Never place real keys/private keys/seed phrases/secrets in GitHub, docs, screenshots, or committed env files.

## Mandatory Agent Startup Output

Before doing development, every coding agent must first show:

```text
CURRENT PROJECT STAGE: Stage 1 — Application foundation
STATUS: CURRENT
COMPLETED STAGES: Stage 0 — Planning and repository setup
NEXT TASK: Scaffold the strengthened application foundation
```

The values must come from this file, not memory.

## Mandatory Update Rules

A task is not complete until its agent:

1. updates Current Snapshot
2. updates Stage Progress
3. moves genuinely completed work to Completed
4. keeps missing/blocked work accurate
5. replaces Next Recommended Task with the next smallest demo-critical task
6. updates matching `docs/ROADMAP.md` items
7. updates `docs/DEVELOPMENT_STAGES.md` if stage status changed
8. records verification commands/results
9. adds a Recent Development Log entry
10. updates README/architecture/tech stack/env docs when affected
11. never claims live Gemini/Sui/deployment behavior without evidence

If multiple agents work in parallel, check recent commits and open PRs first.

## Recent Development Log

### 2026-08-28 — Strengthened Stage 1 foundation requirements

- Status: Completed documentation/planning change
- Change: Added runtime pinning, centralized config, service boundaries, mock fixtures, integer money rules, base error/loading UX, smoke testing, stronger CI, and teammate quick-start requirements.
- Verification: documentation consistency review; no implementation falsely marked complete.
- Next: Stage 1 — scaffold the strengthened application foundation.

### 2026-08-28 — Switched AI plan to Gemini and added development stages

- Status: Completed documentation/planning change
- Change: Replaced OpenAI plan with Gemini, introduced mock-first AI rules, defined Stages 0–8, and required agents to show the current stage before development.
- Next: Stage 1 — scaffold the application foundation.

### 2026-08-28 — Added project-status handoff

- Status: Completed
- Change: Added live project snapshot and mandatory agent update rules.

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
