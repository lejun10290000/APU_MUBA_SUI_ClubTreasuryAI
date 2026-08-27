# ClubTreasury AI — Finalized Technical Stack

Status: **Final for the hackathon MVP**  
Decision date: **28 August 2026**

This stack is intentionally small: one full-stack TypeScript application, one Move package, one managed database/storage service, and one AI provider. Do not introduce a separate backend service or optional Sui features until the end-to-end demo is stable.

## Stack Summary

| Area | Final choice | Purpose |
|---|---|---|
| Runtime | Node.js 24 LTS | Supported production runtime |
| Package manager | pnpm with committed lockfile | Reproducible installs |
| Web application | Next.js 16 App Router, React 19, strict TypeScript | Frontend and server API in one app |
| UI | Tailwind CSS 4, shadcn/ui, Lucide icons | Fast dashboard construction |
| Forms/schemas | React Hook Form + Zod | Shared validation |
| Backend/API | Next.js Route Handlers + server-only modules | AI, auth, rules, storage |
| Database | Supabase PostgreSQL | Treasury/claim/review/payout metadata |
| Receipt storage | Private Supabase Storage bucket | Off-chain private receipt files |
| AI provider | Google Gemini Developer API | Budget parsing and multimodal receipt analysis |
| AI SDK/model | `@google/genai`, default `gemini-2.5-flash` | Official JS SDK + fast multimodal structured extraction |
| AI development mode | Mock-first adapter architecture | Avoid unnecessary API calls/billing during normal development |
| Blockchain client | `@mysten/sui` v2 + `@mysten/dapp-kit-react` | Sui queries/wallet/transactions |
| Smart contract | Move on Sui | Treasury custody, limits, payout/events |
| Network/asset | Sui Testnet + native testnet USDC | Real testnet stablecoin flow |
| Hosting | Vercel + Supabase | Low-operations deployment |
| Unit/integration tests | Vitest + React Testing Library | Rules/schemas/UI |
| End-to-end tests | Playwright | Critical browser flow |
| Contract tests | `sui move test` | Treasury invariants |
| CI | GitHub Actions | Lint/typecheck/tests/build |

Dependency patch versions will be pinned by `pnpm-lock.yaml` during Stage 1 scaffolding.

## Application Structure

```text
app/                         Next.js routes/pages/API handlers
src/components/              Shared UI
src/features/treasury/       Treasury setup/dashboard
src/features/budgets/        Budget entry/preview/confirmation
src/features/claims/         Claim/receipt/review
src/domain/                  Zod schemas + deterministic financial rules
src/lib/ai/                  AI interface + mock + Gemini adapters
src/lib/sui/                 Sui clients/transaction builders
src/lib/supabase/            Database/private-storage adapters
move/club_treasury/          Move package/tests
supabase/migrations/         SQL schema/RLS
tests/e2e/                   Playwright demo flow
tests/fixtures/ai/           Deterministic mock AI fixtures
```

Do not create microservices for the MVP.

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
