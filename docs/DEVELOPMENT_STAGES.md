# ClubTreasury AI — Development Stages

This file defines the official implementation stages for the hackathon project. Every teammate and coding agent must use these stages when reporting progress.

## Status labels

- `COMPLETE` — acceptance criteria are verified and merged/ready to merge.
- `CURRENT` — the team is actively working on this stage.
- `NOT STARTED` — no implementation should be claimed yet.
- `BLOCKED` — work cannot continue until the listed blocker is resolved.

## Mandatory agent startup rule

Before any development, every Codex/AI coding agent must first output:

```text
CURRENT PROJECT STAGE: Stage X — <name>
STATUS: <CURRENT / BLOCKED>
COMPLETED STAGES: <list>
NEXT TASK: <exact task from docs/PROJECT_STATUS.md>
FILES I WILL READ FIRST: AGENTS.md, docs/PROJECT_STATUS.md, docs/DEVELOPMENT_STAGES.md
```

The agent must read the required docs and check recent commits/open PRs before editing.

## Stage 0 — Planning and repository setup — COMPLETE

Goal: create a clean hackathon repository and lock the project concept, requirements, architecture, AI cost policy, and team/agent workflow.

Exit criteria: planning docs exist, hackathon requirements are recorded, and implementation stages are defined.

## Stage 1 — Application foundation — COMPLETE

Goal: create a reproducible, testable, teammate-friendly application scaffold without business features.

Implemented:

- Next.js 16 App Router + React 19 + strict TypeScript
- Node `24.16.0` pinned with `.nvmrc` and `.node-version`
- pnpm `10.15.1` pinned with committed `pnpm-lock.yaml`
- Tailwind CSS 4 base app shell
- Sui SDK/dApp Kit dependencies
- Zod + React Hook Form dependencies
- Vitest + React Testing Library + Playwright
- lint/format/typecheck/test/e2e/build scripts
- centralized validated environment/config module
- default `AI_MODE=mock` and zero live Gemini dependency for Stage 1
- `AIService` + `MockAIService` boundary
- Sui and Supabase module boundaries without premature live integration
- deterministic AI fixtures
- integer/minor-unit money helpers
- health homepage + `/api/health`
- loading/error/not-found boundaries
- GitHub Actions CI with frozen-lockfile install
- unit tests and Playwright smoke test

Verified exit criteria:

- frozen pnpm install passes
- lint passes
- typecheck passes
- unit tests pass
- production build passes
- Playwright configuration and Chromium smoke test pass
- CI passes without `GEMINI_API_KEY`
- no live Gemini/Supabase/Sui business integration is falsely claimed

## Stage 2 — Core UI and deterministic domain rules — COMPLETE

Goal: create the main club-treasury user experience with mock/demo data and implement hard financial rules before live AI or blockchain integration.

Required work:

- landing/login shell
- treasurer dashboard shell
- treasury/event setup UI
- budget creation form and editable structured preview
- claim submission form
- claim review/approval UI shell
- transaction/history UI shell
- shared Zod schemas for treasury, budget, claims, and statuses
- deterministic positive amount/currency validation
- safe integer/minor-unit money totals
- budget-total and category-remaining checks
- receipt/request amount comparison
- exact/similar duplicate helpers
- unit tests for all hard financial rules
- clearly labeled mock/demo data only

Implemented:

- responsive landing, demo access, dashboard, and path-aware navigation
- session-only treasury/event setup with safe USDC minor-unit parsing
- category budget editor with balanced/under/over allocation preview
- mock claim submission with typed receipt evidence
- deterministic receipt amount, duplicate, and category-remaining checks
- advisory Approve / Review / Reject recommendation with human final decision
- transaction/history shell that does not invent Sui evidence
- shared Zod schemas and deterministic session builders
- complete unit and browser coverage for Stage 2 hard rules and navigation

Exit criteria:

- main product workflow is navigable end to end with mock data
- hard financial rules are deterministic and tested
- authoritative money remains integer/minor-unit based
- no UI claims live Gemini, persistence, wallet signing, or Sui payout before those exist
- CI remains green

Verified exit criteria:

- the full mock workflow navigates treasury -> budget -> claim -> review -> human decision -> history
- hard financial rules are deterministic and covered by 45 unit tests
- authoritative input parsing and arithmetic use integer/minor-unit values
- every screen labels mock/session-only data and absent live integrations
- formatting, lint, typecheck, unit tests, production build, and six Playwright smoke tests pass
- desktop and 390 px visual checks pass without horizontal overflow or browser console errors

## Stage 3 — Sui foundation and Move treasury — CURRENT

Goal: make Sui integral to custody, authorization, and payout enforcement.

Required work:

- connect Sui wallet on Testnet
- Move package and tests
- treasury object/state
- treasurer admin capability
- deposit/funding entry point
- category allocation state
- approved payout entry point
- on-chain category-remaining check
- payout event
- transaction error handling
- deploy to Sui Testnet
- record real package/object IDs

Exit criteria: a treasurer can fund a Testnet treasury and execute a verified test payout with real Sui evidence.

## Stage 4 — Gemini AI layer — NOT STARTED

Goal: add Gemini for unstructured budget and receipt understanding while keeping routine development mock-first.

Required work:

- official `@google/genai` SDK
- live `GeminiAIService` behind the existing `AIService` interface
- structured budget parser
- structured receipt/image extraction
- category suggestion and concise reasons
- server-side validation of model output
- billing/live-call guardrails from `docs/AI_USAGE_POLICY.md`
- small explicit quality fixture set

Exit criteria: mock mode remains default; live Gemini is manually enabled and validated without replacing deterministic financial rules.

## Stage 5 — Claim and receipt workflow integration — NOT STARTED

Goal: connect private receipt storage, claim persistence, AI extraction, deterministic checks, and review states.

Required work:

- Supabase schema/migrations
- private receipt bucket
- secure receipt upload
- receipt hashing
- claim persistence
- exact/similar duplicate checks
- mock/live AI through shared adapter
- deterministic budget checks
- Approve / Review / Reject recommendation assembly
- manual Review fallback on AI failure

Exit criteria: a member submits a claim/receipt and the treasurer receives a validated recommendation without automatic money movement.

## Stage 6 — Human approval and on-chain payment — NOT STARTED

Goal: complete the AI -> human -> Sui financial flow.

Required work:

- approve/reject actions
- approved-unpaid state
- Sui transaction construction
- wallet confirmation/signature
- Move payout re-check
- Testnet USDC payout
- transaction finality/status handling
- transaction digest/explorer link
- idempotent database synchronization
- remaining budget changes only after on-chain success

Exit criteria: the full core payment workflow works end to end and AI cannot bypass human approval.

## Stage 7 — Demo hardening and deployment — NOT STARTED

Goal: make the live demo reliable under hackathon conditions.

Required work:

- deploy web app
- configure demo Supabase project
- prepare Testnet SUI + test USDC
- seed clean demo scenario
- sample budget + synthetic receipt
- repeated full-flow rehearsals
- Gemini/wallet/Sui failure handling
- loading/error polish
- backup screenshots/video
- verify no secrets in Git history

Exit criteria: the team can repeatedly perform the demo and has a backup path.

## Stage 8 — Submission and pitch — NOT STARTED

Goal: satisfy all official requirements and optimize both Sui pitches.

Required work:

- final README + real Sui Testnet IDs + setup instructions + team members
- complete AI-tool declaration
- screenshots + live demo URL
- 3–5 minute YouTube/Loom demo video
- Devfolio submission before deadline
- Payments & Stablecoins 5-minute pitch + Q&A
- AI × Sui 5-minute pitch + Q&A

Exit criteria: Devfolio submission is complete and both pitches are rehearsed.

## Stage update rule

A stage may be marked `COMPLETE` only when its exit criteria have been verified. UI mocks, placeholders, fake transaction IDs, and untested integrations do not count.

Every development PR/commit must update:

1. `docs/PROJECT_STATUS.md`
2. `docs/DEVELOPMENT_STAGES.md` if stage status changed
3. `docs/ROADMAP.md`
4. affected setup/architecture docs

The next agent must always be able to determine the current stage without asking a teammate.
