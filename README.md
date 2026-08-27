# ClubTreasury AI

AI-powered programmable treasury for university clubs, built on Sui.

## Project Overview

ClubTreasury AI helps university club treasurers manage budgets, reimbursement requests, approvals, and payouts in one workflow. The treasurer describes budget rules in natural language, AI converts them into structured spending rules, club members later submit reimbursement or payment requests with receipts, AI checks each request against the rules, and a human treasurer approves the final action before Sui executes the stablecoin payment.

## Target User

Primary target user: university club treasurers and finance committee members.

## Problem

University clubs often manage event budgets, receipts, reimbursement requests, approvals, and bank transfers through spreadsheets, chat messages, and manual processes. This makes it difficult to enforce spending rules, track remaining budgets, detect duplicate claims, and maintain a clear payment history.

## Solution

ClubTreasury AI combines AI-assisted financial review with programmable payments on Sui.

Core workflow:

1. Treasurer creates an event or club treasury.
2. Treasurer deposits stablecoins into the Sui treasury.
3. Treasurer describes the budget in natural language.
4. Gemini (or deterministic mock AI during normal development) converts the instruction into structured categories and spending rules.
5. Treasurer reviews and confirms the budget.
6. Club members submit reimbursement/payment requests with receipt evidence.
7. Gemini or the mock AI adapter extracts useful receipt facts and suggests a category; deterministic TypeScript checks hard financial rules and the system returns Approve / Review / Reject with concise reasons.
8. Treasurer makes the final decision.
9. If approved, Sui executes the stablecoin payout.
10. The dashboard updates only after successful on-chain confirmation.

## AI Responsibilities

- Natural-language budget creation
- Receipt/invoice information extraction
- Expense categorization
- Ambiguity/suspicious-evidence hints
- Concise recommendation reasons

Hard financial checks such as arithmetic, category balances, duplicate receipt hashes, and payout authorization are not delegated to Gemini. AI does not silently transfer funds in the MVP. A human treasurer remains in the approval loop.

## Sui Responsibilities

- Hold treasury funds
- Enforce meaningful payout/treasury rules in Move
- Execute approved stablecoin payments
- Provide verifiable transaction history
- Support real on-chain payment execution

## Hackathon Tracks

### Sui Track 01 — Payments & Stablecoins

ClubTreasury AI is a programmable treasury and reimbursement system for university clubs. The project focuses on stablecoin money management, controlled payouts, budget enforcement, and a real payment workflow.

### Sui Track 02 — AI × Sui

AI solves the operational problem of understanding budget instructions and reviewing real-world payment evidence. Sui is integral because the approved financial action is executed on-chain rather than being a separate demo-only blockchain feature.

## MVP Scope

The hackathon MVP should prioritize one complete end-to-end demo:

1. Connect Sui wallet
2. Create one club/event treasury
3. Generate a budget with AI from natural-language instructions
4. Confirm the budget
5. Submit a reimbursement/payment request
6. Upload a receipt
7. Run AI analysis
8. Show Approve / Review / Reject recommendation
9. Treasurer approves
10. Execute Sui testnet payment
11. Update budget and show transaction result

Do not prioritize extra features until this full workflow works reliably.

## Current Development Stage

The authoritative current stage is always recorded in `docs/PROJECT_STATUS.md`.

Every coding agent must read `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/DEVELOPMENT_STAGES.md`, and `docs/AI_USAGE_POLICY.md` before development, then print the current stage/status/completed stages/next task before editing anything.

The project uses these official stages:

- Stage 0 — Planning and repository setup
- Stage 1 — Application foundation
- Stage 2 — Core UI and deterministic domain rules
- Stage 3 — Sui foundation and Move treasury
- Stage 4 — Gemini AI layer
- Stage 5 — Claim and receipt workflow integration
- Stage 6 — Human approval and on-chain payment
- Stage 7 — Demo hardening and deployment
- Stage 8 — Submission and pitch

See `docs/DEVELOPMENT_STAGES.md` for exact scope and exit criteria.

## AI Cost-Control Policy

The product AI provider is the **Google Gemini Developer API** using the official `@google/genai` SDK. The default MVP model is `gemini-2.5-flash`.

Normal development must default to:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
```

Mock mode must make zero Gemini API calls. Use it for routine UI work, unit tests, CI, normal Playwright runs, Sui/Move development, repeated local testing, and most demo rehearsals.

Live Gemini may be enabled only for explicit integration/quality checks, small fixture validation, official demo-video recording, final regression checks, and the live hackathon demo. Never claim a mock response is a live Gemini result.

See `docs/AI_USAGE_POLICY.md` for the authoritative rules.

## Sui Testnet Deployment

- Network: Sui Testnet
- Payment asset: native testnet USDC
- USDC coin type: `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC`
- Package / Contract ID: TBD
- Treasury Object ID: TBD
- Other deployed object/address IDs: TBD

These values must be updated after deployment.

## Repository Documentation

Important files for teammates and coding agents:

- `AGENTS.md` — mandatory project and coding-agent rules
- `HACKATHON_REQUIREMENTS.md` — official submission and pitch requirements
- `CONTRIBUTING.md` — team workflow and Git contribution rules
- `docs/PROJECT_SPEC.md` — detailed product specification
- `docs/PROJECT_STATUS.md` — live current stage, completed work, blockers, and exact next task
- `docs/DEVELOPMENT_STAGES.md` — official Stage 0–8 plan and exit criteria
- `docs/ROADMAP.md` — detailed task checklist aligned to the stages
- `docs/AI_USAGE_POLICY.md` — Gemini vs mock usage/billing policy
- `docs/ARCHITECTURE.md` — technical architecture
- `docs/TECH_STACK.md` — finalized MVP technologies and implementation boundaries
- `docs/DEMO_PLAN.md` — demo flow and backup plan

## Start Here for Development

Before starting any work:

1. Read `docs/PROJECT_STATUS.md` and `docs/DEVELOPMENT_STAGES.md`.
2. Read `AGENTS.md` and `docs/AI_USAGE_POLICY.md`.
3. Read the remaining required project docs.
4. Check recent commits and open pull requests.
5. Print the current stage/status/completed stages/next task.
6. Only then begin the exact next task.

Every development pull request or direct commit must update project status, roadmap, and stage status if it changed. A feature is not complete while the handoff is stale.

## Technology Stack

The hackathon MVP stack is finalized:

- Runtime/tooling: Node.js 24 LTS, pnpm, strict TypeScript
- Full-stack app: Next.js 16 App Router and React 19
- UI: Tailwind CSS 4, shadcn/ui, Lucide icons
- Validation/forms: Zod and React Hook Form
- Backend/API: Next.js Route Handlers and server-only modules
- Database/storage: Supabase PostgreSQL and a private Supabase Storage bucket
- AI: Google Gemini Developer API, `@google/genai`, default `gemini-2.5-flash`
- AI development: mock-first `AIService` architecture to control API usage/cost
- Blockchain: Sui Testnet, Move, `@mysten/sui` v2, and `@mysten/dapp-kit-react`
- Payment asset: native Circle-issued Sui Testnet USDC
- Hosting: Vercel and Supabase
- Testing: Vitest, React Testing Library, Playwright, and `sui move test`
- CI: GitHub Actions

See `docs/TECH_STACK.md` for the full decision and `docs/AI_USAGE_POLICY.md` for AI billing rules.

## Setup / Installation

Installation instructions will be updated as Stage 1 implementation begins.

```bash
git clone https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI.git
cd APU_MUBA_SUI_ClubTreasuryAI
```

Further dependency and environment setup: TBD.

## Environment Variables

Never commit real keys, passwords, wallet private keys, or seed phrases.

Use `.env.example` as the template and keep local secrets in `.env.local`.

## AI Tools Used During Development

The hackathon requires declaration of every AI tool used. Keep this section updated throughout development.

Currently declared:

- ChatGPT — ideation, project planning, architecture discussion, documentation assistance
- OpenAI Codex — coding assistance, implementation, debugging, and repository work (when used)

Product AI provider:

- Google Gemini Developer API — budget parsing and receipt/image analysis when live AI mode is explicitly enabled

Add every other AI tool used by any team member before submission.

## Team Members

Add all official team members before submission.

| Name | Role | University/Organization | GitHub |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Submission Status

See `HACKATHON_REQUIREMENTS.md` for the full checklist.

## Important Development Rule

This project is for MUBA Blockchain Hackathon 2026. Development and commit history must comply with the official hackathon period and originality requirements. Do not copy in pre-existing private/proprietary project code or old codebases.
