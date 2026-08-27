# ClubTreasury AI — Finalized Technical Stack

Status: **Final for the hackathon MVP**  
Decision date: **28 August 2026**

This stack is intentionally small: one full-stack TypeScript application, one Move package, one managed database/storage service, and one AI provider. Do not introduce a separate backend service or optional Sui features until the end-to-end demo is stable.

## Stack Summary

| Area | Final choice | Purpose |
|---|---|---|
| Runtime | Node.js 24 LTS | Supported production runtime |
| Package manager | pnpm with a committed lockfile | Fast, reproducible installs |
| Web application | Next.js 16 App Router, React 19, strict TypeScript | Frontend and server-side API in one deployable application |
| UI | Tailwind CSS 4, shadcn/ui, Lucide icons | Fast, accessible dashboard construction |
| Forms and schemas | React Hook Form and Zod | Shared client/server validation |
| Backend/API | Next.js Route Handlers and server-only modules | AI calls, authorization, business rules, and storage access |
| Database | Supabase PostgreSQL | Treasuries, claims, reviews, payout state, and transaction references |
| Receipt storage | Private Supabase Storage bucket | Off-chain receipt files with controlled access |
| AI | OpenAI Responses API using `gpt-5.6-terra` | Budget parsing and multimodal receipt/claim analysis |
| Blockchain client | `@mysten/sui` v2 and `@mysten/dapp-kit-react` | Sui queries, wallet connection, transaction construction, and signing |
| Smart contract | Move on Sui | Treasury custody, confirmed category limits, approved payouts, and events |
| Network and asset | Sui Testnet and native testnet USDC | Real testnet stablecoin treasury and payout flow |
| Hosting | Vercel for Next.js; Supabase hosted project | Lowest-operations hackathon deployment |
| Unit/integration tests | Vitest and React Testing Library | Financial rules, schemas, and UI behavior |
| End-to-end tests | Playwright | Critical browser demo flow |
| Contract tests | `sui move test` | Treasury authorization, budget, and payout invariants |
| CI | GitHub Actions | Lint, typecheck, tests, and Move tests |

Dependency patch versions will be pinned by `pnpm-lock.yaml` when implementation is scaffolded. Do not use floating dependency versions in deployment.

## Why This Stack

- A single Next.js application reduces deployment and integration failure points.
- TypeScript and Zod allow the AI output, API payloads, and deterministic financial rules to share one schema.
- Supabase provides PostgreSQL and private object storage without operating a separate server.
- The new Sui dApp Kit packages support the current Sui SDK; the legacy `@mysten/dapp-kit` package must not be used.
- Native Sui Testnet USDC makes the stablecoin payment real while keeping the demo valueless and safe.
- OpenAI image input plus Structured Outputs supports both budget parsing and receipt extraction without a separate OCR service.

## Application Structure

The repository should be scaffolded as one application with clear internal boundaries:

```text
app/                         Next.js routes, pages, and API handlers
src/components/              Shared UI components
src/features/treasury/       Treasury setup and dashboard
src/features/budgets/        Budget entry, preview, and confirmation
src/features/claims/         Submission, receipt, analysis, and review
src/domain/                  Pure schemas and deterministic financial rules
src/lib/ai/                  OpenAI client, prompts, and structured outputs
src/lib/sui/                 Sui clients and transaction builders
src/lib/supabase/            Database and private-storage adapters
move/club_treasury/          Move package and contract tests
supabase/migrations/         SQL schema and RLS policies
tests/e2e/                   Critical Playwright demo flow
```

Do not create microservices for the MVP.

## AI Implementation Decision

Use the official OpenAI JavaScript SDK and the Responses API.

Primary model:

```text
gpt-5.6-terra
```

Configuration:

- Use Structured Outputs backed by Zod-derived JSON Schema.
- Use image input with `detail: "original"` for receipt OCR/extraction.
- Default to low reasoning effort for demo latency; evaluate medium only if quality tests show a meaningful improvement.
- Set `store: false` for receipt-analysis requests.
- Validate every response server-side before storing or applying it.
- Keep arithmetic, category balance checks, duplicate matching, and final recommendation policy deterministic in TypeScript.
- Store extracted facts and short recommendation reasons, not hidden model reasoning.
- Keep the model configurable through `OPENAI_MODEL`. If the primary model is unavailable to the team's API project, the documented emergency fallback is `gpt-5.4-mini`; it must pass the same schemas and demo fixtures before use.

AI never signs, submits, or autonomously triggers a payout.

## Sui and Stablecoin Decision

Use:

- Sui Testnet
- Move
- `@mysten/sui` v2
- `@mysten/dapp-kit-react`
- Wallet Standard-compatible Sui wallets
- Native Circle-issued Sui Testnet USDC

Sui Testnet USDC coin type:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

Testnet USDC has no financial value. Obtain demo USDC through Circle's testnet faucet and obtain SUI separately for gas.

The Move package should implement:

- a shared `Treasury<USDC>` object
- a treasurer-owned admin capability
- stablecoin deposit/funding
- confirmed category allocations and remaining amounts
- an admin-authorized payout that re-checks the remaining category amount
- payout events containing treasury, claim/category reference, recipient, amount, and resulting balance

The treasurer's wallet must sign budget confirmation and payout transactions. The backend must never hold a wallet private key.

## Data Boundaries

### On-chain

- treasury object and administrator capability
- native testnet USDC balance
- confirmed category allocations/remaining amounts
- approved payout execution
- payout events and transaction digest

### Off-chain in PostgreSQL

- treasury display metadata
- claim descriptions and statuses
- receipt metadata and hash
- structured AI extraction/recommendation
- duplicate-match evidence
- transaction digest and synchronization status

### Private object storage

- raw receipt images

Receipts must use a private bucket. Upload/download access should use RLS or short-lived signed URLs. Raw receipt URLs must not be written on-chain.

## Identity and Approval

The connected Sui wallet address is the MVP identity. Role-sensitive API mutations should use a wallet-signed nonce challenge. The Move admin capability and wallet signature remain the final authorization for money movement.

The state transition is:

```text
submitted -> analyzing -> recommended -> approved_unpaid
          -> rejected
approved_unpaid -> payment_pending -> paid
                                \-> payment_failed -> approved_unpaid
```

A claim becomes `paid` only after a successful finalized Sui transaction. Budget remaining must not be reduced in the off-chain read model before transaction success.

## Minimum Database Tables

- `treasuries`
- `budget_categories`
- `claims`
- `claim_files`
- `ai_reviews`
- `payouts`
- `wallet_nonces`

Use migrations and database constraints for state values, positive amounts, unique transaction digests, and receipt hashes where appropriate.

## Security Baseline

- OpenAI and Supabase secret keys are server-only.
- The Supabase secret key must never be exposed through a `NEXT_PUBLIC_` variable.
- Enable RLS for all exposed Supabase tables and storage objects.
- Accept only JPEG, PNG, or WebP receipts with an MVP size limit.
- Hash receipt bytes for duplicate detection.
- Re-check recipient, amount, category, treasury object, and network immediately before constructing a payout transaction.
- Never log raw secrets, private receipt URLs, or full AI request payloads.
- Use Sui Testnet only for the hackathon demo.

## Deferred Until the Core Demo Is Stable

- zkLogin
- sponsored transactions
- Walrus
- multisig/dual approval
- multiple clubs per user
- notifications
- advanced fraud scoring
- analytics beyond the core dashboard
- mobile-native application
- separate backend services

## Authoritative References

- [Next.js App Router documentation](https://nextjs.org/docs)
- [Node.js release status](https://nodejs.org/en/about/previous-releases)
- [Sui TypeScript SDK](https://sdk.mystenlabs.com/sui)
- [Sui dApp Kit](https://sdk.mystenlabs.com/dapp-kit)
- [Circle USDC contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [OpenAI GPT-5.6 guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI image and vision guide](https://developers.openai.com/api/docs/guides/images-vision)
- [Supabase private storage](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase API keys](https://supabase.com/docs/guides/api/api-keys)
