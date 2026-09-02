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

**Stage 6 — Human approval and on-chain payment — CURRENT (fresh live re-validation required)**

Completed stages:

- Stage 0 — Planning and repository setup
- Stage 1 — Application foundation
- Stage 2 — Core UI and deterministic domain rules
- Stage 3 — Sui foundation and Move treasury
- Stage 4 — Gemini AI layer
- Stage 5 — Claim and receipt workflow integration

Stage 4 implementation and live-validation documentation were merged into `main` through **PR #16** and **PR #17**.

Stage 5 is **COMPLETE**. Its local verification and owner-controlled live Supabase acceptance gate passed, and **PR #18** merged the implementation into `main`.

Stage 6 implementation now includes approved-claim payout preparation, explicit wallet signing, digest-first persistence, Sui Testnet submission, exact payout-event verification, reconciliation, paid evidence, and atomic database finalization. The first owner-controlled Stage 6 live acceptance exposed a duplicate-payout safety defect: a successful Testnet payout whose event category was not parsed correctly was treated as failed, allowing a second payout for the same claim. The affected claim and both public Testnet digests are preserved as failed-acceptance evidence. The repair accepts both string and byte-array Sui category representations and keeps successful-but-unverifiable outcomes in `reconciliation_required`, which blocks blind replacement signing.

GitHub CI run #80 passes lint, strict TypeScript, **169 unit tests**, production build, and **7/7 Playwright smoke tests** after the repair. Stage 6 remains CURRENT until a fresh clean aligned claim/treasury proves exactly one payout plus idempotent same-digest reconciliation.

Read `docs/PROJECT_STATUS.md` for the authoritative current task before coding, and `docs/STAGE6_LIVE_VALIDATION.md` before any further live payout.

## Stage 6 Approved-Claim Payout — CURRENT

The Stage 6 branch now provides:

- payout preparation from the immutable human-approved snapshot only
- one active payment-attempt boundary per claim
- wallet/Testnet/TreasurerCap authorization checks
- one explicit wallet signature for the exact approved payout
- transaction digest derivation and persistence before broadcast
- Sui Testnet submission without server-side private keys
- same-digest reconciliation for interrupted/ambiguous outcomes
- exact typed `PayoutEvent` verification before paid-state finalization
- category/budget synchronization only after verified on-chain success
- transaction digest and Testnet explorer evidence after confirmation
- UTF-8 string and byte-array handling for Sui `vector<u8>` category evidence
- non-terminal reconciliation handling when a successful chain transaction cannot yet be verified exactly, preventing blind replacement signing

The first live Stage 6 acceptance is intentionally recorded as **FAILED** because it produced two successful Testnet payouts for the same claim before the safety defect was repaired. Do not reuse that affected claim. A fresh clean acceptance scenario is required before Stage 6 can be marked complete.

## Stage 4 Gemini Adapter — COMPLETE

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

The project owner explicitly validated one live budget parse and one live in-memory synthetic receipt/image extraction with `gemini-2.5-flash` on 30 August 2026. The five expected budget categories validated, the receipt amount matched, and intentionally missing currency produced `needsReview=true`. The key was never committed or printed, the temporary runner was deleted, and local configuration returned to mock mode. AI remains advisory and cannot authorize or execute money movement.

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

## Stage 5 Claim and Receipt Workflow

Stage 5 adds:

- normalized persisted treasuries, memberships, budget categories, and claims
- private receipt storage with RLS, JPEG/PNG/WebP, 10 MB, and image-signature checks
- SHA-256 hashing of the exact receipt bytes and immutable evidence metadata
- idempotent submission plus deterministic exact/similar duplicate detection
- one explicit shared `AIService` analysis followed by deterministic financial/evidence checks
- persisted Approve / Review / Reject recommendations with manual Review fallback
- wallet-signed nonce identity binding in live mode
- persisted human Approve/Reject decisions with a decision note
- immutable `approved_*` payout snapshot while `payment_status` remains `unpaid`

There is no wallet popup, Sui transaction, payout, digest, or paid state in Stage 5. The completed owner-controlled acceptance record is in `docs/STAGE5_LIVE_VALIDATION.md`; those effects belong to Stage 6.

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

Claim data defaults to the in-memory mock repository:

```text
NEXT_PUBLIC_CLAIM_DATA_MODE=mock
```

For owner-controlled live claim/payment validation, first apply the migrations in `supabase/migrations/`, enable Supabase Anonymous Sign-ins, and set these values in untracked `.env.local`:

```text
NEXT_PUBLIC_CLAIM_DATA_MODE=live
NEXT_PUBLIC_SUPABASE_URL=<project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SECRET_KEY=<server-only secret key>
SUPABASE_RECEIPTS_BUCKET=receipts
```

Never expose `SUPABASE_SECRET_KEY` with a `NEXT_PUBLIC_` prefix. Return claim mode to `mock` after live validation if the project is not being used as the shared demo backend.

Before any Stage 6 live payout, read `docs/STAGE6_LIVE_VALIDATION.md` and use a fresh clean aligned acceptance scenario. Do not reuse a claim whose prior digest outcome is ambiguous or whose acceptance history contains a successful payout.

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
- verified Google Gemini Developer API adapter with `@google/genai` `2.19.0`
- Stage 5/6 persistence: Supabase PostgreSQL, Auth, RLS, private Storage, and claim payment-attempt ledger

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

Live validation used only a fixed budget instruction and an in-memory synthetic receipt image, recorded no sensitive payloads, and returned to mock mode. Both live paths are verified and Stage 4 is complete.

## AI Tools Used During Development

The hackathon requires disclosure of AI development tools.

Currently declared:

- **ChatGPT** — ideation, planning, architecture, documentation, repository assistance, implementation/debugging assistance
- **OpenAI Codex** — coding assistance, implementation, debugging, repository work when used

Product AI provider:

- **Google Gemini Developer API** — verified product adapter for budget parsing and receipt/image analysis

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
- `docs/STAGE5_LIVE_VALIDATION.md` — owner-controlled migration/private-receipt acceptance record
- `docs/STAGE6_IMPLEMENTATION_PLAN.md` — reviewed approved-claim payout safety boundary
- `docs/STAGE6_LIVE_VALIDATION.md` — Stage 6 live acceptance incident evidence and required fresh re-validation checklist

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
