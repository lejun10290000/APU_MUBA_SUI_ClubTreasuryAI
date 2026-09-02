# ClubTreasury AI

AI-powered programmable treasury for university clubs, built on Sui.

## Project Overview

ClubTreasury AI brings university-club budgeting, receipt review, human approval, and stablecoin payout into one workflow. Gemini helps interpret unstructured budget/receipt information, deterministic TypeScript enforces hard financial rules, a human treasurer makes the final decision, and Sui Move enforces treasury custody, authorization, category limits, and Testnet USDC payout.

Primary users: **university club treasurers and finance committee members**.

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

**Stage 7 — Demo hardening and deployment — CURRENT**

Completed:

- Stage 0 — Planning and repository setup
- Stage 1 — Application foundation
- Stage 2 — Core UI and deterministic domain rules
- Stage 3 — Sui foundation and Move treasury
- Stage 4 — Gemini AI layer
- Stage 5 — Claim and receipt workflow integration
- Stage 6 — Human approval and on-chain payment

Stage 6 merged to `main` through **PR #20** at merge commit:

```text
61fb9c86f5077f9813add6dc94aa69b311aaf4d7
```

The exact merged `main` commit passed GitHub CI with lint, strict TypeScript, production build, **171/171 unit tests**, and **7/7 Playwright smoke tests**.

Read `docs/PROJECT_STATUS.md` before development; it is the authoritative current handoff.

## Verified Stage 6 End-to-End Payment

Stage 6 starts only after a human-approved, immutable payout snapshot. The implemented flow provides:

- payout construction only from immutable `approved_*` fields
- one active payment-attempt boundary per claim
- Testnet wallet/TreasurerCap verification
- one explicit human wallet signature
- signed transaction validation
- digest persistence before broadcast
- Sui Testnet submission
- canonical `PayoutEvent` BCS verification with safe JSON fallback
- same-digest reconciliation for interrupted/ambiguous outcomes
- no blind replacement payment after a successful/ambiguous transaction
- claim/budget synchronization only after verified on-chain success
- visible public transaction digest/explorer evidence

The first owner-controlled live acceptance exposed a duplicate-payout safety defect. That incident is preserved as failed acceptance evidence rather than hidden or rewritten. The defect was repaired and covered by regression tests.

A fresh aligned owner-controlled acceptance then passed:

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101

Category:
events

Approved payout:
0.10 USDC

Confirmed digest:
DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7
```

Before payout, the synchronized category was **1.00 USDC allocated / 0 spent** with zero payment attempts. After exactly one wallet signature, exactly one attempt became confirmed, the claim became paid, and the category became **0.10 spent / 0.90 remaining**. Refresh kept the same paid state/digest and did not offer or sign a second payout.

Full evidence: `docs/STAGE6_LIVE_VALIDATION.md`.

## Current Clean Demo Objects

The clean Stage 6 acceptance Treasury/Cap are the current public demo defaults:

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101
```

The historical Stage 3 Treasury/Cap remain valid Stage 3 evidence but are **not** the clean current demo defaults because that treasury was later used during failed Stage 6 acceptance attempts.

## Verified Sui Testnet Deployment

Network: **Sui Testnet**

Native Circle Testnet USDC coin type:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

Move package:

```text
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f
```

Publish digest:

```text
DdQQEcGD8FWmAde2rziBDjwua5CjcwRUtfN4p2Lkoeb
```

UpgradeCap:

```text
0x711ea01bd5ed070582897c86b93340723f425e2cee634ef5d0e55adbb1363ce2
```

Historical Stage 3 demo objects:

```text
Treasury: 0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4
TreasurerCap: 0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7
```

Stage 3 verified a real browser-wallet flow:

1. create Treasury + TreasurerCap
2. deposit **1.00 Testnet USDC**
3. confirm **1.00 USDC** allocation to `events`
4. execute a human-approved **0.10 USDC** payout
5. refresh the Treasury and verify **0.90 USDC** remaining

The Move package has **31/31 passing Move tests** and has not changed since the verified deployment.

## Move Treasury Design

The package at `move/club_treasury` provides:

- generic shared `Treasury<Asset>` custody
- address-owned `TreasurerCap<Asset>` authorization
- typed `Balance<Asset>` custody
- positive deposits before allocation confirmation
- one-time exact category allocation confirmation
- category `allocated` and `remaining` accounting
- post-confirmation deposit lock
- treasurer-authorized payout
- category/custody sufficiency checks
- pre/post `sum(category_remaining) == custody balance` invariant
- exact typed `Coin<Asset>` transfer to non-zero recipient
- typed `PayoutEvent`

No application backend stores wallet private keys or recovery phrases.

## Gemini AI Layer — Verified

The application includes:

- official `@google/genai` `2.19.0`
- `GeminiAIService` behind the shared `AIService` interface
- natural-language budget parsing into structured data
- multimodal receipt/image extraction
- category suggestion and concise reasons
- independent Zod validation after every model response
- safe failure to human `Review`
- explicit live-call guardrails

The project owner verified a small owner-controlled live fixture set with `gemini-2.5-flash`. Normal development and CI remain mock-first and make zero Gemini API calls.

Gemini is advisory. It does not calculate authoritative balances, authorize payouts, sign transactions, or move funds.

## Supabase Claim / Receipt Layer — Verified

Stage 5/6 provide:

- Supabase PostgreSQL schema + migrations
- Auth/wallet identity binding
- RLS-protected treasuries, memberships, categories, claims, and payment attempts
- private receipt Storage
- JPEG/PNG/WebP validation and size/signature checks
- SHA-256 receipt evidence
- submission idempotency
- exact/similar duplicate detection
- persisted AI extraction/recommendation
- manual Review fallback
- persisted human decision notes
- immutable approved payout snapshots
- claim payment-attempt ledger and paid-state reconciliation

Raw receipt files remain private/off-chain.

## Main User Workflow

### Treasurer

1. Connect Sui Testnet wallet.
2. Create/fund a Treasury.
3. Enter natural-language budget instructions.
4. Review/edit structured categories.
5. Confirm allocations.
6. Review submitted claim + private receipt evidence.
7. Inspect AI recommendation and deterministic checks.
8. Make the final human decision.
9. If approved, review the immutable payout snapshot.
10. Explicitly sign one Sui Testnet payout.
11. Wait for verified finality/event evidence.
12. View paid state, updated budget, digest, and explorer evidence.

### Club Member

1. Select the relevant persisted treasury/category.
2. Enter reimbursement details.
3. Upload receipt/evidence privately.
4. Submit claim.
5. Await human review/payment result.

## Developer Quick Start

Requirements:

- Node.js `24.16.0` (project pins Node 24)
- pnpm `10.15.1`

Clone/install:

```bash
git clone https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI.git
cd APU_MUBA_SUI_ClubTreasuryAI
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open:

```text
http://localhost:3000
```

Dedicated Sui Testnet setup page:

```text
http://localhost:3000/dashboard/testnet
```

## Environment Configuration

Committed `.env.example` contains public Testnet identifiers and blank secret placeholders only. Never commit `.env.local`.

For the Stage 7 Vercel matrix, owner-only steps, non-secret health contract, and rollback/recovery limits, read [`docs/STAGE7_DEPLOYMENT.md`](docs/STAGE7_DEPLOYMENT.md). A production deployment must set `APP_ENV=production` and the exact HTTPS `NEXT_PUBLIC_APP_URL`; localhost and HTTP origins are rejected in that mode.

Safe/default development mode:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
NEXT_PUBLIC_CLAIM_DATA_MODE=mock
NEXT_PUBLIC_SUI_NETWORK=testnet
```

For owner-controlled live Supabase claim/payment use, configure untracked `.env.local` with:

```text
NEXT_PUBLIC_CLAIM_DATA_MODE=live
NEXT_PUBLIC_SUPABASE_URL=<project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<browser-safe publishable key>
SUPABASE_SECRET_KEY=<server-only secret>
SUPABASE_RECEIPTS_BUCKET=receipts
```

For explicitly approved live Gemini use:

```text
AI_MODE=live
GEMINI_LIVE_REQUESTS_ENABLED=true
GEMINI_API_KEY=<server-only/local secret>
GEMINI_MODEL=gemini-2.5-flash
```

Never use a `NEXT_PUBLIC_` prefix for Gemini or Supabase server secrets.

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

Latest merged Stage 6 `main` baseline:

```text
lint: pass
strict TypeScript: pass
unit tests: 31 files / 171 tests pass
production build: pass
Playwright smoke: 7/7 pass
```

## Stage 7 — Current Work

Stage 7 does **not** need more core payment features. The current priority is reliability:

1. deploy the Next.js app to Vercel
2. configure production environment variables safely
3. connect the intended Supabase live project
4. verify clean Testnet assets and wallet/TreasurerCap
5. define a deterministic demo reset/seed procedure
6. rehearse the complete deployed flow repeatedly
7. harden loading/error/recovery states discovered during rehearsal
8. verify paid-state refresh/reconciliation remains idempotent
9. prepare backup screenshots/video
10. perform repository/secret safety checks before submission

See `docs/DEMO_PLAN.md` for the Stage 7 rehearsal checklist.

Live application URL: **TBD during Stage 7 deployment**.

## Technology Stack

- Next.js 16 App Router
- React 19
- strict TypeScript
- Tailwind CSS 4
- Zod + React Hook Form
- Node.js 24 + pnpm
- Vitest + React Testing Library + Playwright
- Sui Testnet + Move
- `@mysten/sui` `2.27.0`
- `@mysten/dapp-kit-react` `2.1.20`
- native Circle Sui Testnet USDC
- Google Gemini Developer API / `@google/genai` `2.19.0`
- Supabase PostgreSQL/Auth/RLS/private Storage
- GitHub Actions CI
- Vercel deployment target

## AI Tools Used During Development

Hackathon development AI tools currently declared:

- **ChatGPT** — ideation, planning, architecture, documentation, repository work, implementation/debugging assistance
- **OpenAI Codex** — coding assistance, implementation, debugging, repository work when used

Product AI:

- **Google Gemini Developer API** — budget parsing and receipt/image analysis

Every teammate must add any other AI tool used before final submission.

## Hackathon Tracks

### Sui Track 01 — Payments & Stablecoins

ClubTreasury AI demonstrates programmable stablecoin treasury custody, spending controls, human-approved payouts, and public Sui transaction evidence.

### Sui Track 02 — AI × Sui

Gemini handles useful unstructured financial understanding; deterministic rules and human approval protect the decision; Sui is the integral custody/execution layer.

## Important Documentation

- `AGENTS.md` — coding-agent/project rules
- `HACKATHON_REQUIREMENTS.md` — official submission/pitch requirements
- `docs/PROJECT_STATUS.md` — authoritative current stage and exact next task
- `docs/DEVELOPMENT_STAGES.md` — official Stage 0–8 boundaries
- `docs/ROADMAP.md` — implementation checklist
- `docs/PROJECT_SPEC.md` — product requirements
- `docs/AI_USAGE_POLICY.md` — mock/live Gemini policy
- `docs/ARCHITECTURE.md` — architecture/responsibility boundaries
- `docs/TECH_STACK.md` — technical decisions
- `docs/DEMO_PLAN.md` — Stage 7 rehearsal/demo plan
- `docs/STAGE5_LIVE_VALIDATION.md` — Stage 5 live acceptance record
- `docs/STAGE6_IMPLEMENTATION_PLAN.md` — historical approved Stage 6 safety plan
- `docs/STAGE6_LIVE_VALIDATION.md` — failed incident + successful Stage 6 acceptance evidence

## Team Members

Add all official team members before Devfolio submission (Stage 8).

| Name | Role | University/Organization | GitHub |
| ---- | ---- | ----------------------- | ------ |
| TBD  | TBD  | TBD                     | TBD    |

## Security Rules

Never commit:

- `.env` / `.env.local`
- Gemini API keys
- Supabase server secrets
- wallet private keys
- seed/recovery phrases
- passwords/tokens
- private receipt URLs or sensitive receipt contents

Public Sui Testnet object IDs and transaction digests are intentionally safe to document.
