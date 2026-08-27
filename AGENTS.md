# AGENTS.md — Instructions for Codex and AI Coding Agents

## Project Identity

Project: **ClubTreasury AI**  
Hackathon: **MUBA Blockchain Hackathon 2026**  
Blockchain: **Sui**  
Primary user: **University club treasurers and finance committee members**

This repository is the official hackathon submission repository. Protect the project concept, hackathon compliance, demo reliability, clear commit history, and secret safety.

## Core Product Concept

ClubTreasury AI combines two workflows:

1. **AI-assisted funding setup** — a treasurer describes how club/event money should be allocated in natural language. Gemini converts it into structured categories/rules.
2. **AI-assisted payment verification** — members submit reimbursement/payment requests with receipts. Gemini extracts/suggests facts, deterministic code checks financial rules, and the system recommends Approve / Review / Reject.

A human treasurer makes the final financial approval. **Sui executes the approved payment.**

## Core End-to-End Workflow

1. Treasurer connects a Sui wallet.
2. Treasurer creates a club/event treasury.
3. Stablecoin funds are deposited into the Sui treasury.
4. Treasurer enters a natural-language budget instruction.
5. Gemini or the mock AI adapter converts the instruction into structured categories/rules.
6. Treasurer reviews and confirms the budget.
7. A member submits a reimbursement/payment request and receipt.
8. Gemini or the mock adapter extracts receipt facts and suggests a category.
9. Deterministic TypeScript checks budget, amount, required fields, and duplicate indicators.
10. System returns Approve / Review / Reject with concise reasons.
11. Treasurer makes the final decision.
12. If approved, the treasurer signs and Sui executes the testnet stablecoin payment.
13. Dashboard updates only after successful on-chain confirmation.

## Competition Tracks

The same project competes in both Sui tracks.

### Track 01 — Payments & Stablecoins

Emphasize programmable treasury, stablecoin management, reimbursement/payout workflow, spending controls, and real Sui execution.

### Track 02 — AI × Sui

Emphasize natural-language budget understanding, receipt/evidence analysis, useful AI recommendations, human approval, and Sui as an integral execution layer.

## Mandatory Stage-First Startup Rule

Before doing any development, every coding agent must read:

1. `docs/PROJECT_STATUS.md`
2. `docs/DEVELOPMENT_STAGES.md`
3. `AGENTS.md`
4. `README.md`
5. `HACKATHON_REQUIREMENTS.md`
6. `docs/PROJECT_SPEC.md`
7. `docs/ROADMAP.md`
8. `docs/TECH_STACK.md`
9. `docs/ARCHITECTURE.md`
10. `docs/AI_USAGE_POLICY.md`

Then check recent commits and open pull requests.

**Before editing anything, the agent must show the user this status block:**

```text
CURRENT PROJECT STAGE: Stage X — <name>
STATUS: <CURRENT / BLOCKED>
COMPLETED STAGES: <list>
NEXT TASK: <exact next task from docs/PROJECT_STATUS.md>
```

Do not begin implementation until this status has been shown.

## Development Stages

The authoritative stage plan is `docs/DEVELOPMENT_STAGES.md`.

- Stage 0 — Planning and repository setup
- Stage 1 — Application foundation
- Stage 2 — Core UI and deterministic domain rules
- Stage 3 — Sui foundation and Move treasury
- Stage 4 — Gemini AI layer
- Stage 5 — Claim and receipt workflow integration
- Stage 6 — Human approval and on-chain payment
- Stage 7 — Demo hardening and deployment
- Stage 8 — Submission and pitch

A stage is complete only after its exit criteria are verified and merged to `main`.

## Stage 1 Foundation Guardrails

While Stage 1 is current, agents must prioritize reproducibility and boundaries over features.

Required principles:

- pin Node and pnpm project versions
- keep one centralized validated config/environment module
- default to `AI_MODE=mock`
- Stage 1 must make zero live Gemini calls
- create clear AI/Sui/Supabase module boundaries before live integrations
- create deterministic mock fixtures for budget/claim/AI responses
- use integer/minor-unit semantics for authoritative money values; do not use floating-point money arithmetic
- add base loading, not-found, and recoverable error UI
- add a home/health smoke test
- CI must pass without Gemini API keys or live external services
- README must provide a fresh-clone quick-start that another teammate can actually follow

Do not add Stage 2+ business features just because scaffolding makes them easy. Complete the Stage 1 exit criteria first.

## Gemini and Mock-AI Rule

The AI provider is **Google Gemini Developer API** using the official `@google/genai` SDK. The default MVP model is `gemini-2.5-flash` unless the team explicitly changes it after validation.

Normal development must use:

```text
AI_MODE=mock
```

Mock mode must not make Gemini API calls. Live Gemini usage is reserved for explicit integration/quality checks, official demo-video recording, final regression checks, and the live hackathon demo.

Read `docs/AI_USAGE_POLICY.md` before adding or calling any AI API.

Never make live Gemini requests in normal unit tests, normal Playwright tests, CI, UI styling work, Sui contract work, or repeated local development.

Gemini is advisory. Deterministic code remains authoritative for arithmetic, category limits, remaining budget, receipt hash duplicates, and final recommendation policy. Gemini never signs or executes payments.

## MVP Priority

The highest priority is a **reliable live end-to-end demo**:

- connect wallet
- create/fund treasury
- AI budget generation
- human budget confirmation
- submit claim + receipt
- AI extraction/recommendation
- human approval
- Sui testnet payout
- updated budget
- visible transaction result

Do not prioritize optional features until this works reliably.

## Architecture Principles

- Keep Sui meaningful, not decorative.
- Keep AI useful, not merely a chatbot wrapper.
- Keep hard financial rules deterministic.
- Keep a human in the final approval loop.
- Keep receipts private and off-chain.
- Never let a backend hold wallet private keys.
- Prefer the simplest architecture that can be completed and demoed reliably.
- Feature code should depend on internal interfaces/modules rather than vendor SDKs directly.
- Feature code should not read scattered environment variables directly; use the centralized config module.

## Money Safety Rule

Authoritative monetary values must not be calculated using JavaScript floating-point arithmetic.

Agents should establish and preserve integer/minor-unit money handling so that:

- display strings are parsed into validated integer units
- addition/subtraction/comparison use integer semantics
- decimals are explicit per asset
- TypeScript values remain compatible with later Move/Sui amounts

Do not introduce `number`-based financial calculations that can create rounding ambiguity.

## Repository and Security Rules

- Never commit `.env` or `.env.local`.
- Never commit API keys.
- Never commit wallet private keys or seed phrases.
- Never commit real passwords or personal secrets.
- Keep `.env.example` current.
- Do not invent package IDs, object IDs, transaction hashes, or deployment status.
- Mark unfinished deployment values as `TBD`.
- Update the AI-tool declaration whenever the team uses a new AI development tool.

## Hackathon Authenticity Rules

- Official hacking period: **26 Aug 2026 through 5 Sep 2026, 11:59 PM MYT**.
- Code for this submission must be written during the event.
- Do not import a pre-existing private/proprietary codebase or old hackathon project.
- Keep commit history clear and meaningful.
- Do not hide AI-tool usage; the submission requires declaration of every AI tool used.

See `HACKATHON_REQUIREMENTS.md`.

## Project Status and Handoff Requirement

`docs/PROJECT_STATUS.md` is the single source of truth for current stage, completed work, active work, blockers, and next task.

Every development PR/commit must:

1. update the current snapshot and current stage
2. move genuinely completed work to Completed
3. keep missing/blocked work accurate
4. update the next recommended task
5. update matching `docs/ROADMAP.md` items
6. update `docs/DEVELOPMENT_STAGES.md` if a stage status changed
7. record verification results and a recent-development entry
8. update setup/architecture/env docs when affected

A development task is not complete if these handoff files are stale.

## Definition of Done

A hackathon-critical feature is complete only when:

- the real user flow works
- relevant errors are handled
- mock/demo data is clearly identified
- Sui integration is real where claimed
- deterministic rules are tested where practical
- docs/status/stages are updated
- no secrets are committed

For Stage 1 specifically, completion also requires a reproducible fresh-clone setup, pinned runtime/package-manager metadata, centralized config, mock-only AI development, smoke testing, and CI that does not depend on live external services.

## Q&A Readiness

Team members should be able to explain:

- why Gemini is needed
- why Sui is needed
- what is on-chain vs off-chain
- why hard financial rules are deterministic
- why the treasurer remains in control
- how duplicate claims are detected
- how receipt privacy is protected
- what happens if Gemini is wrong or unavailable
- what happens if a Sui transaction fails

## Current Status

Always read `docs/PROJECT_STATUS.md` and `docs/DEVELOPMENT_STAGES.md`. Do not infer implementation status from planning documents alone.