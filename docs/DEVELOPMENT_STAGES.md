# ClubTreasury AI — Development Stages

This file defines the official implementation stages for the hackathon project. Every teammate and coding agent must use these stages when reporting progress.

## Status labels

- `COMPLETE` — acceptance criteria are verified and merged to `main`.
- `CURRENT` — the team is actively working on this stage.
- `NOT STARTED` — no implementation should be claimed yet.
- `BLOCKED` — work cannot continue until the listed blocker is resolved.

## Mandatory agent startup rule

Before any development, every Codex/AI coding agent must first output a short status block containing:

```text
CURRENT PROJECT STAGE: Stage X — <name>
STATUS: <CURRENT / BLOCKED>
COMPLETED STAGES: <list>
NEXT TASK: <exact task from docs/PROJECT_STATUS.md>
FILES I WILL READ FIRST: AGENTS.md, docs/PROJECT_STATUS.md, docs/DEVELOPMENT_STAGES.md
```

The agent must not start editing until it has read those files and checked recent commits/open pull requests.

## Stage 0 — Planning and repository setup — COMPLETE

Goal: create one clean hackathon repository and lock the product concept before implementation.

Completed scope:

- project concept and target user
- dual Sui-track positioning
- hackathon submission requirements
- README and agent instructions
- product specification
- architecture boundaries
- technical-stack decision
- demo plan
- contribution rules
- secret-safe environment template
- live project-status handoff

Exit criteria: planning documents exist and the next implementation task is clearly defined.

## Stage 1 — Application foundation — CURRENT

Goal: create a reproducible, testable application scaffold without business features.

Required work:

- Next.js 16 App Router + React 19 + strict TypeScript
- pnpm with committed lockfile
- Tailwind CSS 4
- Sui SDK packages
- Zod + React Hook Form
- Vitest + React Testing Library + Playwright
- standard scripts for lint/typecheck/test/build
- environment validation
- minimal health page/route
- GitHub Actions CI
- directory boundaries from `docs/TECH_STACK.md`

Exit criteria:

- clean `pnpm install --frozen-lockfile`
- lint passes
- typecheck passes
- unit tests pass
- production build passes
- Playwright config loads
- CI is present
- no secrets committed

## Stage 2 — Core UI and deterministic domain rules — NOT STARTED

Goal: create the basic club-treasury user experience and hard financial rules before AI or on-chain integration.

Required work:

- landing/login shell
- treasurer dashboard shell
- treasury/event setup UI
- budget creation form and editable structured preview
- claim submission form
- claim review screen shell
- transaction/history view shell
- shared Zod schemas
- deterministic amount/currency validation
- budget-total and category-balance checks
- receipt/request amount comparison
- duplicate-rule helpers and tests

Exit criteria: the main product flow can be navigated with mock/demo data and all hard financial checks are deterministic and tested.

## Stage 3 — Sui foundation and Move treasury — NOT STARTED

Goal: make Sui integral to custody, authorization, and payout enforcement.

Required work:

- connect Sui wallet on Testnet
- Move package
- treasury object/state
- treasurer admin capability
- deposit/funding entry point
- category allocation state
- approved payout entry point
- on-chain category-remaining check
- payout event
- Move tests
- transaction error handling
- deploy to Sui Testnet
- record real package/object IDs

Exit criteria: a treasurer can fund a Testnet treasury and execute a verified test payout with real Sui transaction evidence.

## Stage 4 — Gemini AI layer — NOT STARTED

Goal: add Gemini for unstructured budget and receipt understanding while keeping routine development free from unnecessary API use.

Required work:

- official Google Gen AI JavaScript SDK (`@google/genai`)
- Gemini budget parser with structured schema
- Gemini receipt/image extraction with structured schema
- expense-category suggestion
- concise evidence/recommendation reasons
- server-side validation of all model outputs
- `mock` and `live` AI adapters with the same interface
- deterministic fixture responses for tests/demo development
- live-call guardrails from `docs/AI_USAGE_POLICY.md`

Exit criteria: mock mode works by default; live Gemini mode is manually enabled and passes a small set of quality fixtures without changing deterministic financial rules.

## Stage 5 — Claim and receipt workflow integration — NOT STARTED

Goal: connect private receipt storage, AI extraction, deterministic checks, and review states.

Required work:

- Supabase schema/migrations
- private receipt bucket
- secure receipt upload
- receipt hashing
- claim persistence
- exact/similar duplicate checks
- Gemini or mock extraction
- deterministic budget checks
- Approve / Review / Reject recommendation assembly
- understandable reasons
- manual-review fallback when AI fails

Exit criteria: a member can submit a claim and receipt and the treasurer receives a validated recommendation without any money moving automatically.

## Stage 6 — Human approval and on-chain payment — NOT STARTED

Goal: complete the core AI -> human -> Sui financial flow.

Required work:

- treasurer approve/reject actions
- approved-unpaid state
- transaction construction
- wallet confirmation/signature
- Move payout re-check
- Sui Testnet stablecoin payout
- transaction finality/status handling
- transaction digest/explorer link
- idempotent database synchronization
- remaining-budget update only after on-chain success

Exit criteria: the full core payment workflow works end to end and AI cannot bypass human approval.

## Stage 7 — Demo hardening and deployment — NOT STARTED

Goal: make the live demo reliable under hackathon conditions.

Required work:

- deploy web app
- configure Supabase production/demo project
- prepare Testnet SUI and test USDC
- seed clean demo scenario
- sample natural-language budget
- sample synthetic receipt
- repeated end-to-end rehearsals
- loading/error states
- AI failure fallback
- wallet rejection handling
- transaction failure handling
- backup screenshots/video
- verify no secrets in Git history

Exit criteria: the team can repeat the demo reliably and has a backup if internet/API access fails.

## Stage 8 — Submission and pitch — NOT STARTED

Goal: satisfy every official requirement and optimize both Sui pitches.

Required work:

- final README
- real Sui Testnet package/object IDs
- setup/install instructions
- all team members
- complete AI-tool declaration
- screenshots
- live demo URL
- 3–5 minute YouTube/Loom demo video
- Devfolio submission before deadline
- Payments & Stablecoins 5-minute pitch + Q&A
- AI × Sui 5-minute pitch + Q&A

Exit criteria: Devfolio submission is complete and both live pitches are rehearsed.

## Stage update rule

A stage may be marked `COMPLETE` only when its exit criteria have been verified. UI mocks, stubs, placeholder transaction IDs, or untested integrations do not count as completion.

Every development PR/commit must update:

1. `docs/PROJECT_STATUS.md`
2. `docs/DEVELOPMENT_STAGES.md` if stage status changed
3. `docs/ROADMAP.md`
4. any setup/architecture docs affected by the work

The next agent must always be able to determine the current stage without asking a teammate.