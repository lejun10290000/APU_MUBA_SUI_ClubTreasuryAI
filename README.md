# ClubTreasury AI

AI-powered programmable treasury for university clubs, built on Sui.

## Project Overview

ClubTreasury AI helps university club treasurers manage budgets, reimbursement requests, approvals, and payouts in one workflow. AI interprets unstructured budget/receipt information, deterministic TypeScript enforces hard financial rules, a human treasurer makes the final decision, and Sui Move enforces treasury custody, authorization, category limits, and Testnet USDC payout.

## Target User

University club treasurers and finance committee members.

## Core Responsibility Model

```text
AI understands and recommends
        ↓
Deterministic TypeScript verifies hard rules
        ↓
Human treasurer approves
        ↓
Sui wallet signs explicitly
        ↓
Move enforces and Sui executes
```

AI never owns authoritative balances, payout authorization, wallet signing, or Sui transaction execution.

## Current Development Stage

**Stage 4 — Gemini AI layer — CURRENT**

Completed stages:

- Stage 0 — Planning and repository setup
- Stage 1 — Application foundation
- Stage 2 — Core UI and deterministic domain rules
- Stage 3 — Sui foundation and Move treasury

Stage 4 implementation is on:

```text
stage4/gemini-ai-layer
```

Read `docs/PROJECT_STATUS.md` for the authoritative current task before coding.

## Stage 4 Gemini Adapter — Implemented, Live Validation Pending

The application now includes:

- official `@google/genai` `2.19.0`
- `GeminiAIService` behind the existing `AIService` interface
- lazy SDK/client construction only on an explicitly enabled live request
- JSON structured-output requests for natural-language budget parsing
- explicit bounded JPEG/PNG/WebP base64 input for receipt extraction
- merchant, amount, date, description, category suggestion, missing-field, review, and reason output
- independent Zod validation after every provider response
- safe errors for disabled live mode, missing keys/images, malformed output, invalid schemas, and provider failures
- fake-client tests that make zero Gemini API calls

Normal development and CI still use `MockAIService`. Lint, strict TypeScript, **87 unit tests**, the production build, and **7 Playwright smoke tests** pass in mock mode.

No real Gemini result is claimed yet. Stage 4 remains **CURRENT** until the project owner explicitly validates one budget parse and one synthetic receipt/image extraction with a local server-side key. AI remains advisory and cannot authorize or execute money movement.

## Stage 3 Verified Sui Testnet Deployment

Network: **Sui Testnet**

Native Circle Testnet USDC coin type:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

Move package:

```text
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f
```

Publish transaction digest:

```text
DdQQEcGD8FWmAde2rziBDjwua5CjcwRUtfN4p2Lkoeb
```

UpgradeCap:

```text
0x711ea01bd5ed070582897c86b93340723f425e2cee634ef5d0e55adbb1363ce2
```

Verified demo Treasury object:

```text
0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4
```

Verified demo TreasurerCap object:

```text
0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7
```

Stage 3 was exercised end to end with a real browser wallet and native Circle Testnet USDC:

1. create shared treasury + address-owned TreasurerCap
2. deposit **1.00 Testnet USDC**
3. confirm the full **1.00 USDC** allocation to the `events` category
4. execute a human-approved **0.10 USDC** payout
5. refresh the Treasury object from Sui Testnet

Verified post-payout on-chain state:

```text
allocations_confirmed: true
category_allocated: 1000000
category_remaining: 900000
funds: 900000
```

USDC metadata reported 6 decimals, so the authoritative base-unit state verifies:

```text
1.00 USDC deposited
1.00 USDC allocated
0.10 USDC paid
0.90 USDC remaining
```

The payout produced the typed `PayoutEvent`, and the Testnet demo records confirmed explorer links for create, fund, allocation, and payout. No fabricated package/object IDs or transaction evidence are used.

## Stage 3 Sui / Move Foundation

The Move package at `move/club_treasury` provides:

- generic `Treasury<Asset>` shared object custody
- `TreasurerCap<Asset>` authorization bound to one treasury and treasurer
- permissionless positive deposits before allocation confirmation
- one-time exact category allocation confirmation
- category `allocated` and `remaining` accounting
- post-confirmation deposit lock
- treasurer-only payout enforcement
- pre/post `sum(category_remaining) == treasury balance` invariant checks
- exact typed `Coin<Asset>` payout to a non-zero recipient
- typed payout events
- deterministic abort/error boundaries

**31/31 Move tests pass** with Sui CLI `1.78.1-722ac4fcf484`.

The web application provides:

- Wallet Standard-compatible Sui wallet discovery
- explicit connect/disconnect
- Sui Testnet-only guard
- typed create/fund/allocate/payout transaction builders
- exact positive `bigint`/`u64` validation
- explicit one-signature-per-action UX
- confirmation through the configured Sui Testnet client before success is shown
- real Testnet coin metadata / owned coin reads
- real object IDs, transaction evidence, events, and treasury-state refresh

No application code stores private keys or recovery phrases.

## Stage 2 Product Workflow

The mock product workflow remains available for product/UI development and includes:

- treasury/event setup
- editable category budgets
- exact balanced/under/over allocation checks
- claim submission with typed receipt facts
- receipt/request amount comparison
- exact/similar duplicate helpers
- category remaining checks
- advisory Approve / Review / Reject recommendations
- explicit human approve/reject demo decisions
- transaction/history shell without fake Sui evidence

Mock financial data is visually labeled as mock/demo and is separate from the dedicated real Sui Testnet treasury page.

## Developer Quick Start

```bash
git clone https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI.git
cd APU_MUBA_SUI_ClubTreasuryAI
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
corepack pnpm dev
```

Open:

```text
http://localhost:3000
```

Real Testnet treasury page:

```text
http://localhost:3000/dashboard/testnet
```

The committed `.env.example` contains only public Testnet identifiers and blank server-side secret placeholders. Never commit `.env.local`, Gemini API keys, wallet private keys, or recovery phrases.

## Verification Commands

Application:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e:smoke
```

Move package:

```bash
cd move/club_treasury
sui move test
```

## Technology Stack

- Next.js 16 App Router
- React 19
- strict TypeScript
- Tailwind CSS 4
- Zod + React Hook Form
- pnpm
- Vitest + React Testing Library + Playwright
- Sui Testnet + Move
- `@mysten/sui` 2.27.0
- `@mysten/dapp-kit-react` 2.1.20
- native Circle Sui Testnet USDC
- mock-first `AIService`
- implemented Google Gemini Developer API adapter with `@google/genai` `2.19.0`; live validation pending
- planned later persistence/private receipt storage: Supabase

## AI Cost-Control Policy

Normal development stays mock-first:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
```

Mock mode makes zero Gemini API calls. Live Gemini is reserved for explicit owner-controlled integration/quality validation and the later official demo path.

For the small owner-controlled validation session only, place these values in untracked `.env.local`:

```text
AI_MODE=live
GEMINI_LIVE_REQUESTS_ENABLED=true
GEMINI_API_KEY=<owner enters locally; never share or commit>
GEMINI_MODEL=gemini-2.5-flash
```

Validate only a fixed budget instruction and a synthetic receipt image, record no sensitive payloads, then return to mock mode. Stage 4 is not complete until both live paths are explicitly verified.

## AI Tools Used During Development

The hackathon requires disclosure of AI development tools.

Currently declared:

- **ChatGPT** — ideation, planning, architecture, documentation, repository assistance, implementation/debugging assistance
- **OpenAI Codex** — coding assistance, implementation, debugging, repository work when used

Product AI provider:

- **Google Gemini Developer API** — implemented product adapter for budget parsing and receipt/image analysis; owner-controlled live validation pending

Add every other AI tool used by any teammate before submission.

## Important Documentation

- `AGENTS.md` — mandatory coding-agent/project rules
- `HACKATHON_REQUIREMENTS.md` — official submission/pitch requirements
- `docs/PROJECT_STATUS.md` — authoritative current stage and next task
- `docs/DEVELOPMENT_STAGES.md` — Stage 0–8 scope/exit criteria
- `docs/ROADMAP.md` — implementation checklist
- `docs/PROJECT_SPEC.md` — product requirements
- `docs/AI_USAGE_POLICY.md` — Gemini/mock billing rules
- `docs/ARCHITECTURE.md` — architecture and responsibility boundaries
- `docs/TECH_STACK.md` — technology decisions
- `docs/DEMO_PLAN.md` — demo flow

## Team Members

Add all official team members before submission.

| Name | Role | University/Organization | GitHub |
| ---- | ---- | ----------------------- | ------ |
| TBD  | TBD  | TBD                     | TBD    |

## Hackathon Tracks

### Sui Track 01 — Payments & Stablecoins

Programmable treasury, native Testnet USDC custody, category spending controls, human-approved payout, and public Sui evidence.

### Sui Track 02 — AI × Sui

AI assists with unstructured budget/receipt understanding while deterministic rules and human approval protect financial decisions, and Sui remains the integral execution/custody layer.
