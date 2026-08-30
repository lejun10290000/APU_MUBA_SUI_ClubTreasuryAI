# ClubTreasury AI — Finalized Technical Stack

Status: **Final for the hackathon MVP**  
Decision date: **28 August 2026**

This stack is intentionally small: one full-stack TypeScript application, one Move package, one managed database/storage service, and one AI provider. Do not introduce a separate backend service or optional Sui features until the end-to-end demo is stable.

## Stack Summary

| Area                   | Final choice                                         | Purpose                                                                                         |
| ---------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Runtime                | Node.js 24 LTS                                       | Supported production runtime                                                                    |
| Package manager        | pnpm with committed lockfile                         | Reproducible installs                                                                           |
| Web application        | Next.js 16 App Router, React 19, strict TypeScript   | Frontend and server API in one app                                                              |
| UI                     | Tailwind CSS 4, shadcn/ui, Lucide icons              | Fast dashboard construction                                                                     |
| Forms/schemas          | React Hook Form + Zod                                | Shared validation                                                                               |
| Backend/API            | Next.js Route Handlers + server-only modules         | AI, auth, rules, storage                                                                        |
| Database               | Supabase PostgreSQL                                  | Treasury/claim/review/payout metadata                                                           |
| Receipt storage        | Private Supabase Storage bucket                      | Off-chain private receipt files                                                                 |
| AI provider            | Google Gemini Developer API                          | Budget parsing and multimodal receipt analysis                                                  |
| AI SDK/model           | `@google/genai` `2.19.0`, default `gemini-2.5-flash` | Implemented official JS SDK adapter + multimodal structured extraction; live validation pending |
| AI development mode    | Mock-first adapter architecture                      | Avoid unnecessary API calls/billing during normal development                                   |
| Blockchain client      | `@mysten/sui` v2 + `@mysten/dapp-kit-react`          | Sui queries/wallet/transactions                                                                 |
| Smart contract         | Move on Sui                                          | Treasury custody, limits, payout/events                                                         |
| Network/asset          | Sui Testnet + native testnet USDC                    | Real testnet stablecoin flow                                                                    |
| Hosting                | Vercel + Supabase                                    | Low-operations deployment                                                                       |
| Unit/integration tests | Vitest + React Testing Library                       | Rules/schemas/UI                                                                                |
| End-to-end tests       | Playwright                                           | Critical browser flow                                                                           |
| Contract tests         | `sui move test`                                      | Treasury invariants                                                                             |
| CI                     | GitHub Actions                                       | Lint/typecheck/tests/build                                                                      |

Dependency patch versions will be pinned by `pnpm-lock.yaml` during Stage 1 scaffolding.

## Foundation Reproducibility Rules

Stage 1 must establish a stable development baseline before feature work begins.

Required project metadata:

- commit `pnpm-lock.yaml`
- commit `.nvmrc` or `.node-version` for Node.js 24 LTS
- set `packageManager` in `package.json` to the chosen pnpm version
- keep setup commands in README synchronized with the actual scripts

A teammate should be able to clone the repo, copy `.env.example` to `.env.local`, install, run, test, and build without hidden local setup.

## Application Structure

```text
app/                         Next.js routes/pages/API handlers
  error.tsx                  Base application error boundary
  loading.tsx                Base loading state
  not-found.tsx              Base not-found state
src/config/                  Central validated runtime/environment config
src/components/              Shared UI primitives/layout components
src/features/treasury/       Treasury setup/dashboard
src/features/budgets/        Budget entry/preview/confirmation
src/features/claims/         Claim/receipt/review
src/domain/money/            Integer/minor-unit money helpers
src/domain/schemas/          Shared Zod domain schemas
src/lib/ai/                  AI interface + mock + guarded Gemini adapter
src/lib/sui/                 Sui client/transaction boundary
src/lib/supabase/            Database/private-storage boundary
move/club_treasury/          Move package/tests
supabase/migrations/         SQL schema/RLS
tests/e2e/                   Playwright demo flow
tests/fixtures/ai/           Deterministic mock AI fixtures
tests/fixtures/domain/       Sample budget/claim fixtures
```

Do not create microservices for the MVP.

## Configuration Boundary

All runtime configuration should be parsed/validated through one central module such as:

```text
src/config/env.ts
```

Feature code should not directly read scattered `process.env.*` values. This makes local development, CI, Vercel, mock/live AI switching, and test behavior predictable.

Minimum behavior:

- invalid required values fail clearly at startup/server initialization
- `AI_MODE` defaults safely to `mock`
- CI can run without a Gemini key
- public environment variables are explicitly separated from server-only secrets
- Gemini/Supabase secret keys never use a `NEXT_PUBLIC_` prefix

## Service Boundary Rule

Stage 1 establishes interfaces/module boundaries before real integrations are added.

Application feature code should not depend directly on vendor SDKs.

Conceptual boundaries:

```text
AIService
  |- MockAIService
  `- GeminiAIService        // implemented; live validation pending

SuiService / transaction module
  `- concrete Sui behavior // implemented in Stage 3+

Storage/Data adapter
  `- Supabase implementation // implemented in Stage 5
```

The Stage 4 Gemini implementation remains behind this boundary. Stage 5 UI/API work must call `AIService` rather than importing the provider SDK directly.

## Money Representation Rule

Authoritative money values must not use JavaScript floating-point arithmetic.

Use integer/minor-unit semantics for amounts. For example, an amount is represented as an integer number of the asset's smallest relevant units and formatted only for display.

Requirements:

- parse user display amounts into validated integer units
- perform comparisons/addition/subtraction using integer semantics
- never rely on `number` floating-point calculations for authoritative balances
- keep asset decimals/conversion logic explicit
- ensure TypeScript and Move interpretations of amounts remain consistent

This rule should be established in Stage 1 so later budget and payout logic does not require a financial-data rewrite.

## Base UX Reliability

Before feature development, the app should have:

- shared layout shell
- basic loading state
- not-found state
- recoverable application error boundary
- health/home route used by smoke testing

The goal is not visual polish yet. The goal is preventing raw framework failures from becoming the user experience during development or demos.

## AI Implementation Decision

Use the official Google Gen AI JavaScript SDK:

```text
@google/genai
```

Default MVP model:

```text
gemini-2.5-flash
```

The provider/model must remain configurable through environment variables so the team can change model only after validation.

### AI adapter boundary

Application code must depend on one interface with two implementations:

```text
AIService
  |- MockAIService
  `- GeminiAIService
```

Both return identical Zod-validated structures.

Stage 1 created the interface and mock-safe structure. Stage 4 implements guarded Gemini budget/receipt behavior with lazy client construction, JSON structured-output requests, and independent Zod validation. Owner-controlled live quality validation is still pending.

### Mock-first rule

Committed/default configuration is:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
```

Mock mode must never call Gemini. It is used for routine UI work, unit tests, CI, normal Playwright tests, Sui development, repeated local testing, and most rehearsals.

Live Gemini calls are allowed only for explicit integration/quality checks, final demo validation, official video recording, and the live hackathon demo.

See `docs/AI_USAGE_POLICY.md` for the authoritative billing/usage policy.

### Gemini responsibilities

Gemini may:

- interpret natural-language budget instructions
- extract merchant/amount/date/description from receipt images
- suggest an expense category
- identify ambiguity/suspicious evidence
- produce short understandable reasons

Gemini must not be authoritative for:

- arithmetic
- remaining-budget calculations
- category-limit checks
- exact receipt-hash duplicate checks
- final recommendation policy
- payout authorization
- wallet signing/transaction execution

Hard financial rules remain deterministic TypeScript. A treasurer remains the final human approver.

## Test Fixture Strategy

Stage 1 should create deterministic fixtures that later UI/business development can reuse without API cost or unstable external dependencies.

Minimum fixture cases:

- valid sample event budget
- valid sample claim
- valid marketing receipt extraction result
- ambiguous receipt result
- amount mismatch result
- over-budget result
- duplicate-claim result

Fixtures must be clearly identified as mock/test data and conform to the same schemas later used by live Gemini.

## CI Baseline

GitHub Actions should run, at minimum:

1. install with frozen lockfile
2. lint
3. typecheck
4. unit tests
5. production build

CI requirements:

- force/use `AI_MODE=mock`
- do not require `GEMINI_API_KEY`
- do not call Gemini
- do not require live Supabase or Sui Testnet to verify the Stage 1 scaffold

A basic smoke test should verify that the home/health route loads. Full product E2E behavior belongs to later stages.

## Sui and Stablecoin Decision

Use:

- Sui Testnet
- Move
- `@mysten/sui` v2
- `@mysten/dapp-kit-react`
- Wallet Standard-compatible Sui wallets
- native Circle-issued Sui Testnet USDC

Sui Testnet USDC coin type:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

The Move package should implement:

- shared `Treasury<USDC>` object
- treasurer-owned admin capability
- deposit/funding
- confirmed category allocations/remaining amounts
- admin-authorized payout that re-checks remaining category amount
- payout events

The backend never holds wallet private keys.

## Data Boundaries

### On-chain

- treasury/admin capability
- testnet USDC balance
- confirmed category allocations/remaining amounts
- approved payout execution
- payout events/transaction digest

### Off-chain PostgreSQL

- treasury display metadata
- claim descriptions/statuses
- receipt metadata/hash
- structured AI extraction/recommendation
- duplicate-match evidence
- transaction synchronization status

### Private storage

- raw receipt images

Raw receipt URLs must not be written on-chain.

## Identity and Approval

The connected Sui wallet address is the MVP identity. Role-sensitive API mutations should use a wallet-signed nonce challenge. Move admin capability + wallet signature are final authorization for money movement.

A claim becomes `paid` only after successful Sui transaction confirmation.

## Minimum Database Tables

- `treasuries`
- `budget_categories`
- `claims`
- `claim_files`
- `ai_reviews`
- `payouts`
- `wallet_nonces`

## Security Baseline

- Gemini and Supabase secrets are server-only.
- Never expose `GEMINI_API_KEY` through `NEXT_PUBLIC_` variables.
- CI runs in mock AI mode and does not need a Gemini key.
- Enable RLS for exposed Supabase tables/storage.
- Prefer synthetic receipts for development/testing.
- Hash receipt bytes for duplicate detection.
- Re-check recipient/amount/category/treasury/network before payout construction.
- Never log raw secrets, private receipt URLs, or sensitive full request payloads.
- Use Sui Testnet only for the hackathon demo.

## Deferred Until Core Demo Is Stable

- zkLogin
- sponsored transactions
- Walrus
- multisig/dual approval
- multi-club support
- notifications
- advanced fraud scoring
- advanced analytics
- mobile-native app
- separate backend service

## Authoritative References

- Next.js App Router: https://nextjs.org/docs
- Sui TypeScript SDK: https://sdk.mystenlabs.com/sui
- Sui dApp Kit: https://sdk.mystenlabs.com/dapp-kit
- Circle USDC addresses: https://developers.circle.com/stablecoins/usdc-contract-addresses
- Gemini API docs: https://ai.google.dev/gemini-api/docs
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Google Gen AI SDK: https://googleapis.github.io/js-genai/
- Supabase docs: https://supabase.com/docs
