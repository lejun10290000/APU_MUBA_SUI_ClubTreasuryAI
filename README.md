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
4. AI converts the instruction into structured categories and spending rules.
5. Treasurer reviews and confirms the budget.
6. Club members submit reimbursement/payment requests with receipt evidence.
7. AI analyzes the request, extracts key information, categorizes the expense, checks budget limits, checks for duplicates or suspicious inconsistencies, and recommends Approve / Review / Reject.
8. Treasurer makes the final decision.
9. If approved, Sui executes the stablecoin payout.
10. The dashboard updates the remaining category budget and transaction history.

## AI Responsibilities

- Natural-language budget creation
- Receipt/invoice information extraction
- Expense categorization
- Budget-rule checking
- Duplicate/suspicious claim detection
- Approve / Review / Reject recommendation

AI does not silently transfer funds in the MVP. A human treasurer remains in the approval loop.

## Sui Responsibilities

- Hold treasury funds
- Execute approved stablecoin payments
- Store/represent programmable treasury logic where appropriate
- Provide verifiable transaction history
- Support on-chain payment execution

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

- `AGENTS.md` — project rules and instructions for Codex/AI coding agents
- `HACKATHON_REQUIREMENTS.md` — official submission and pitch requirements
- `CONTRIBUTING.md` — team workflow and Git contribution rules
- `docs/PROJECT_SPEC.md` — detailed product specification
- `docs/ROADMAP.md` — implementation plan
- `docs/PROJECT_STATUS.md` — live status, blockers, next task, and agent handoff
- `docs/ARCHITECTURE.md` — technical architecture
- `docs/TECH_STACK.md` — finalized MVP technologies and implementation boundaries
- `docs/DEMO_PLAN.md` — demo flow and backup plan

## Start Here for Development

Before starting any work, read `AGENTS.md` and `docs/PROJECT_STATUS.md`. The status file states what is actually implemented, what is missing, and the exact next recommended task.

Every development pull request or direct commit must update `docs/PROJECT_STATUS.md` and the relevant `docs/ROADMAP.md` checkboxes. A feature is not complete while the status handoff is stale.

For a new teammate or coding agent, use the starter prompt provided at the bottom of `docs/PROJECT_STATUS.md`.

## Technology Stack

The hackathon MVP stack is finalized:

- Runtime/tooling: Node.js 24 LTS, pnpm, strict TypeScript
- Full-stack app: Next.js 16 App Router and React 19
- UI: Tailwind CSS 4, shadcn/ui, Lucide icons
- Validation/forms: Zod and React Hook Form
- Backend/API: Next.js Route Handlers and server-only modules
- Database/storage: Supabase PostgreSQL and a private Supabase Storage bucket
- AI: OpenAI Responses API with `gpt-5.6-terra`, image input, and Structured Outputs
- Blockchain: Sui Testnet, Move, `@mysten/sui` v2, and `@mysten/dapp-kit-react`
- Payment asset: native Circle-issued Sui Testnet USDC
- Hosting: Vercel and Supabase
- Testing: Vitest, React Testing Library, Playwright, and `sui move test`
- CI: GitHub Actions

See `docs/TECH_STACK.md` for the full decision, boundaries, versions, and rationale.

## Setup / Installation

Installation instructions will be updated as implementation begins.

```bash
git clone https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI.git
cd APU_MUBA_SUI_ClubTreasuryAI
```

Further dependency and environment setup: TBD.

## Environment Variables

Never commit real keys, passwords, wallet private keys, or seed phrases.

Use `.env.example` as the template and keep local secrets in `.env`.

## AI Tools Used During Development

The hackathon requires declaration of every AI tool used. Keep this section updated throughout development.

Currently declared:

- ChatGPT — ideation, project planning, architecture discussion, documentation assistance
- OpenAI Codex — coding assistance, implementation, debugging, and repository work (when used)

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
