# ClubTreasury AI

AI-powered programmable treasury for university clubs, built on Sui.

## Project Overview

ClubTreasury AI helps university club treasurers manage budgets, reimbursement requests, approvals, and payouts in one workflow. AI helps interpret natural-language budgets and receipt evidence, deterministic code enforces hard financial rules, a human treasurer makes the final approval, and Sui will execute the approved stablecoin payment.

## Target User

University club treasurers and finance committee members.

## Problem

University clubs often manage event budgets, receipts, reimbursement requests, approvals, and transfers through spreadsheets and chat. That makes remaining budgets, spending-rule enforcement, duplicate claims, and audit history difficult to manage reliably.

## Core Workflow

1. Treasurer creates an event/club treasury.
2. Treasurer funds it with testnet stablecoin.
3. Treasurer describes the budget in natural language.
4. Gemini, or deterministic mock AI during normal development, returns structured budget data.
5. Treasurer reviews and confirms the budget.
6. Member submits a reimbursement/payment request with receipt evidence.
7. AI extracts/suggests facts; deterministic TypeScript checks hard rules.
8. App recommends Approve / Review / Reject with concise reasons.
9. Treasurer makes the final decision.
10. Sui executes the approved testnet stablecoin payout.
11. Dashboard updates only after successful on-chain confirmation.

## AI vs Deterministic Rules

Gemini may interpret unstructured language, extract receipt facts, suggest categories, and highlight ambiguity. Gemini is **not** authoritative for arithmetic, remaining budget, duplicate receipt hashes, payout authorization, wallet signing, or Sui transaction execution.

The MVP keeps a human treasurer in the final approval loop.

## Hackathon Tracks

### Sui Track 01 — Payments & Stablecoins

Focus: programmable treasury, stablecoin management, reimbursement/payout workflow, spending controls, and real Sui execution.

### Sui Track 02 — AI × Sui

Focus: useful AI for budget/receipt understanding, deterministic financial safety, human approval, and Sui as the integral payment execution layer.

## Current Development Stage

**Stage 3 — Sui foundation and Move treasury — CURRENT**

Completed:

- Stage 0 — Planning and repository setup
- Stage 1 — Application foundation
- Stage 2 — Core UI and deterministic domain rules

Read `docs/PROJECT_STATUS.md` for the authoritative current task before coding.

Every coding agent must first read `AGENTS.md`, `docs/PROJECT_STATUS.md`, `docs/DEVELOPMENT_STAGES.md`, and `docs/AI_USAGE_POLICY.md`, then show the current stage/status/completed stages/next task before editing.

## Stage 1 Foundation

The repository now includes:

- Next.js 16 App Router + React 19 + strict TypeScript
- Node `24.16.0` pinned in `.nvmrc` and `.node-version`
- pnpm `10.15.1` pinned in `package.json`
- committed `pnpm-lock.yaml`
- Tailwind CSS 4
- Sui TypeScript SDK + dApp Kit React packages
- Zod + React Hook Form
- Vitest + React Testing Library + Playwright
- centralized environment validation
- `AIService` + deterministic `MockAIService`
- Sui and Supabase module boundaries
- integer/minor-unit money helpers
- deterministic AI fixtures
- health homepage + `/api/health`
- loading/error/not-found boundaries
- GitHub Actions CI
- unit and browser smoke tests

Stage 1 CI has verified frozen dependency install, lint, typecheck, unit tests, production build, Chromium setup, and Playwright smoke testing without a Gemini API key.

## Stage 2 — Complete

The Stage 2 domain foundation now includes:

- shared Zod schemas for treasuries, budgets, categories, claims, statuses, and USDC minor-unit amounts
- positive safe-integer amount and currency validation
- deterministic budget-total and category-remaining checks
- unit tests for the new schemas and financial rules

The Stage 2 product shell now includes:

- responsive landing and demo-access pages
- reusable desktop and mobile treasurer navigation
- schema-validated mock dashboard fixtures
- treasury balance, budget-category, claim-queue, activity, and safety-boundary views
- browser smoke coverage for landing-to-dashboard navigation and mobile layout

The Stage 2 mock treasury setup now includes:

- an accessible React Hook Form event/treasury creation page
- exact USDC display parsing into safe integer minor units
- shared Zod validation with recoverable field errors
- a live local preview with demo-draft status
- a schema-validated session-only dashboard handoff
- explicit no-persistence, no-wallet, and no-on-chain safety labels
- unit and browser coverage for valid and invalid setup paths

The completed Stage 2 workflow also includes:

- an editable category budget builder with balanced, under-allocated, and over-allocated states
- deterministic confirmation that categories equal the treasury total exactly
- a mock claim submission form with typed receipt facts
- receipt/request amount comparison
- exact receipt-reference and similar merchant/amount duplicate helpers
- category-remaining validation
- advisory Approve / Review / Reject recommendations
- explicit human approve/reject demo actions that never execute money movement
- an audit/transaction history shell with no fake transaction digests
- responsive navigation through treasury, budget, claims, review, and history
- 45 unit tests and six Playwright smoke tests covering the hard rules and workflow

## Stage 3 — Current Foundation

The first Stage 3 Move foundation now includes:

- a Move 2024 package at `move/club_treasury`
- a shared `Treasury<phantom Asset>` object for one club/event treasury
- a treasurer-owned, module-controlled `TreasurerCap<phantom Asset>`
- capability binding to one treasury object ID and treasurer address
- an opaque off-chain `external_reference` plus metadata revision
- a typed internal `Balance<Asset>` initialized to zero
- permissionless deposits of positive `Coin<Asset>` values into treasury custody
- exact `u64` native base-unit balance accounting
- one-time treasurer-authorized confirmation of opaque category IDs and exact allocations
- category `remaining` values initialized exactly to their `allocated` values
- total confirmed allocation required to equal the treasury custody balance
- deposits blocked after confirmation to preserve the custody/allocation invariant
- treasurer-capability and sender-authorized payouts from confirmed categories
- exact category `remaining` and custody decrements with pre/post accounting invariant checks
- exact typed `Coin<Asset>` transfer directly to a non-zero recipient
- deterministic payout events with treasury, category, recipient, amount, and post-payout balances
- hardened abort boundaries for unconfirmed, missing, zero, invalid, insufficient, and corrupt-accounting cases
- 31 passing Move tests covering creation, authorization, funding, allocation, payout, events, and failure boundaries

The phantom asset parameter statically requires treasury custody and payouts to use the same coin type, preserving the intended native Sui Testnet USDC direction. This is verified local generic Move logic only: no real Testnet USDC transaction has occurred, no wallet or TypeScript transaction integration is connected, and no Testnet package/object ID or transaction digest exists. Deployment, Gemini, and Supabase remain unimplemented.

The next recommended task remains within Stage 3: connect the Sui Testnet wallet in the app and build the typed transaction/integration layer for treasury creation, funding, allocation confirmation, and payout, without deploying or fabricating package/object IDs.

## Developer Quick Start

### 1. Clone

```bash
git clone https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI.git
cd APU_MUBA_SUI_ClubTreasuryAI
```

### 2. Use the pinned runtime

Recommended:

```bash
nvm use
```

The project expects Node `24.16.0` and pnpm `10.15.1`.

Install the pinned pnpm version if needed:

```bash
npm install --global pnpm@10.15.1
```

### 3. Install dependencies

```bash
pnpm install --frozen-lockfile
```

### 4. Create local environment file

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

For Stage 1/2 normal development, keep:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
```

**No Gemini API key is required for normal Stage 1/2 development.**

### 5. Run

```bash
pnpm dev
```

Open `http://localhost:3000`.

Health endpoint:

```text
http://localhost:3000/api/health
```

### 6. Verify before pushing

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e:smoke
```

Verify the current Move foundation separately with a compatible Sui CLI:

```bash
cd move/club_treasury
sui move test
```

The first Playwright run on a new machine may require browser installation:

```bash
pnpm exec playwright install chromium
```

## Common Scripts

```bash
pnpm dev             # local development
pnpm lint            # ESLint
pnpm format          # formatting check
pnpm format:write    # format files
pnpm typecheck       # TypeScript check
pnpm test            # unit tests
pnpm test:e2e        # all Playwright tests
pnpm test:e2e:smoke  # foundation smoke test
pnpm build           # production build
pnpm start           # run production build
```

## AI Cost-Control Policy

Committed/default development mode:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
```

Mock mode must make **zero Gemini API calls**. Use it for routine UI work, CI, tests, Sui/Move development, and most rehearsals.

Live Gemini is reserved for Stage 4+ explicit integration/quality validation and later official demo needs. See `docs/AI_USAGE_POLICY.md`.

## Environment Safety

Never commit:

- `.env` or `.env.local`
- Gemini/Supabase API keys
- wallet private keys
- seed phrases
- passwords or tokens

Use `.env.example` only as a placeholder template.

## Technology Stack

- Runtime: Node.js 24 LTS
- Package manager: pnpm
- App: Next.js 16 App Router, React 19, strict TypeScript
- UI: Tailwind CSS 4
- Validation/forms: Zod + React Hook Form
- Product AI planned for Stage 4: Google Gemini Developer API using `@google/genai`, default `gemini-2.5-flash`
- Normal development AI: deterministic mock-first `AIService`
- Database/storage later: Supabase PostgreSQL + private Storage
- Blockchain: Sui Testnet, Move, `@mysten/sui`, `@mysten/dapp-kit-react`
- Payment asset: native Sui Testnet USDC
- Testing: Vitest, React Testing Library, Playwright, later `sui move test`
- CI: GitHub Actions

See `docs/TECH_STACK.md` for architecture details.

## Sui Testnet Deployment

- Network: Sui Testnet
- Payment asset: native testnet USDC
- USDC coin type: `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC`
- Package / Contract ID: TBD
- Treasury Object ID: TBD
- Other deployed object/address IDs: TBD

Do not invent IDs before deployment.

## Important Documentation

- `AGENTS.md` — mandatory coding-agent/project rules
- `HACKATHON_REQUIREMENTS.md` — official submission/pitch requirements
- `CONTRIBUTING.md` — collaboration workflow
- `docs/PROJECT_STATUS.md` — current stage, completed work, blockers, next task
- `docs/DEVELOPMENT_STAGES.md` — Stage 0–8 scope/exit criteria
- `docs/ROADMAP.md` — task checklist
- `docs/PROJECT_SPEC.md` — product requirements
- `docs/AI_USAGE_POLICY.md` — Gemini/mock billing rules
- `docs/ARCHITECTURE.md` — architecture
- `docs/TECH_STACK.md` — stack decisions
- `docs/DEMO_PLAN.md` — demo flow

## AI Tools Used During Development

The hackathon requires declaration of every AI development tool used.

Currently declared:

- ChatGPT — ideation, planning, architecture, documentation, repository assistance
- OpenAI Codex — coding assistance, implementation, debugging, repository work when used

Product AI provider:

- Google Gemini Developer API — planned live budget parsing and receipt/image analysis when explicitly enabled in later stages

Add every other AI tool used by any teammate before submission.

## Team Members

Add all official team members before submission.

| Name | Role | University/Organization | GitHub |
| ---- | ---- | ----------------------- | ------ |
| TBD  | TBD  | TBD                     | TBD    |

## Submission

See `HACKATHON_REQUIREMENTS.md` for the full official checklist. The repository must remain public, source/commit history clear, AI tools declared, testnet IDs recorded after deployment, and the final 3–5 minute demo video linked before submission.
