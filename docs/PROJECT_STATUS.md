# ClubTreasury AI — Project Status and Agent Handoff

This file is the **single source of truth for current implementation status and the next recommended task**.

Every teammate and coding agent must read this file before starting work. Every development change must update this file in the same pull request or commit.

## Current Snapshot

- Last updated: **28 August 2026 (MYT)**
- Default branch: `main`
- Current phase: **Ready to begin implementation**
- Latest completed milestone: **Project-status and mandatory agent handoff process added**
- Active implementation work: **None**
- Current blockers: **None for project scaffolding**
- Demo readiness: **Planning complete; no executable application yet**

## Completed

- Project concept, target user, and dual-track positioning
- Hackathon requirements and submission checklist
- Product specification and MVP boundaries
- Architecture and on-chain/off-chain data boundaries
- Demo scenario and rehearsal plan
- Finalized technical stack
- Current Sui SDK v2 and new dApp Kit package selection
- Native Sui Testnet USDC selection
- Security rules and environment-variable template
- Project status and agent handoff process

## Not Yet Implemented

- Next.js application scaffold
- Dependency manifest and lockfile
- Frontend pages or reusable UI
- Domain schemas and deterministic financial rules
- Supabase migrations or private receipt bucket
- OpenAI budget or receipt analysis
- Sui wallet connection
- Move package and tests
- Treasury creation, deposit, budget confirmation, or payout
- Integrated claim and human-approval workflow
- Automated CI
- Sui Testnet deployment
- Live demo, screenshots, or video

Do not describe any item in this section as working until real code and appropriate verification exist.

## Next Recommended Task

### Task: Scaffold the application foundation

Create the implementation foundation specified in `docs/TECH_STACK.md` without adding business features yet.

Required deliverables:

1. Scaffold Next.js 16 App Router with React 19 and strict TypeScript.
2. Use pnpm and commit `pnpm-lock.yaml`.
3. Configure Tailwind CSS 4.
4. Add the current `@mysten/sui` v2 and `@mysten/dapp-kit-react` packages.
5. Add Zod, React Hook Form, Vitest, React Testing Library, and Playwright.
6. Add lint, format, typecheck, unit-test, end-to-end-test, and build scripts.
7. Create the directory boundaries documented in `docs/TECH_STACK.md`.
8. Add server-side environment validation without adding real secrets.
9. Add a minimal health route or page proving the application builds and runs.
10. Add GitHub Actions for install, lint, typecheck, unit tests, and build.
11. Update setup instructions in `README.md`.
12. Update this status file and `docs/ROADMAP.md` in the same pull request.

Acceptance criteria:

- clean `pnpm install --frozen-lockfile`
- lint passes
- typecheck passes
- unit tests pass
- production build passes
- Playwright configuration loads
- no secrets or `.env.local` are committed
- no fake Sui package IDs, transaction digests, or deployment claims
- no treasury, AI, or claim business features are prematurely marked complete

Non-goals for this task:

- no Move business logic
- no live Supabase project setup
- no OpenAI API calls
- no treasury or claim UI beyond a minimal scaffold
- no Sui Testnet deployment

## Locked MVP Decisions

Do not change these without explicit team approval:

- Target user: university club treasurers and finance committee members
- AI is advisory; a treasurer approves the final payment
- Sui performs real testnet stablecoin custody/payment execution
- Payment asset: native Sui Testnet USDC
- Frontend/backend: one Next.js application
- AI: OpenAI Responses API with `gpt-5.6-terra` as primary model
- Database/storage: Supabase PostgreSQL and private Supabase Storage
- Blockchain packages: `@mysten/sui` v2 and `@mysten/dapp-kit-react`
- Raw receipts remain private and off-chain
- Optional features wait until the full demo is stable

See `docs/TECH_STACK.md` and `docs/ARCHITECTURE.md` for the complete decisions.

## External Setup Needed Later

The team will eventually need:

- an OpenAI API project/key
- a Supabase project with publishable and secret keys
- a private Supabase receipt bucket
- one or more Sui wallets
- Sui Testnet SUI for gas
- native Sui Testnet USDC for the demo

Never place real keys, private keys, seed phrases, or secrets in this file, GitHub issues, pull requests, chat messages, screenshots, or committed environment files.

## Mandatory Update Rules

A task is not complete until its agent updates this file.

For every development pull request or direct commit:

1. Update **Current Snapshot**.
2. Move genuinely completed work into **Completed**.
3. Remove implemented items from **Not Yet Implemented**.
4. Replace **Next Recommended Task** with the next smallest demo-critical task.
5. Record active blockers or required human setup truthfully.
6. Update matching checkboxes in `docs/ROADMAP.md`.
7. Record verification commands and results in the pull request.
8. Add a short entry to **Recent Development Log** below.
9. Update README, architecture, technical stack, and `.env.example` when the change affects them.
10. Never claim deployment, testnet execution, or AI behavior without evidence.

If multiple agents work in parallel, each must check recent commits and open pull requests before starting. Do not duplicate or overwrite another agent's active work.

## Recent Development Log

Keep the newest entry first. Retain the latest ten entries here; older history remains available in Git.

### 2026-08-28 — Added project-status handoff

- Status: Completed
- Change: Added the live project snapshot, next-task contract, and mandatory agent update rules.
- Verification: Documentation consistency and secret-safety checks.
- Next: Scaffold the application foundation.

### 2026-08-28 — Finalized technical stack

- Status: Completed
- Pull request: #1
- Change: Finalized the web, AI, Sui, stablecoin, storage, deployment, and testing stack.
- Verification: Documentation consistency and no-secret checks.
- Next: Establish the agent handoff process, then scaffold the application.

## Starter Prompt for a New Coding Agent

Use this when handing the repository to another Codex session:

```text
Open this repository and read AGENTS.md and docs/PROJECT_STATUS.md first, followed
by the other required project documents. Complete only the Next Recommended Task
from docs/PROJECT_STATUS.md. Preserve the locked MVP decisions, run every listed
acceptance check, and update docs/PROJECT_STATUS.md plus docs/ROADMAP.md in the
same pull request before declaring the task complete.
```
