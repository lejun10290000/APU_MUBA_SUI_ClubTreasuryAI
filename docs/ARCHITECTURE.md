# ClubTreasury AI — Architecture

This document defines the finalized hackathon architecture. Exact dependency patch versions will be pinned during scaffolding; the component boundaries and service choices are final for the MVP.

See `docs/TECH_STACK.md` for the complete technology decision.

## Architecture Decision

ClubTreasury AI uses one full-stack Next.js application plus one Move package. There is no separate backend service for the MVP.

```text
Treasurer / Club Member
        |
        v
Next.js 16 Web Application
  - React UI
  - Route Handlers
  - deterministic rules
        |
        +----------------------+----------------------+
        |                      |                      |
        v                      v                      v
OpenAI Responses API    Supabase PostgreSQL    Sui Wallet
  - budget parsing       - app metadata          |
  - receipt extraction   - claims/reviews        v
  - categorization       - payout status     Sui Testnet
                         |                      - Move treasury
                         v                      - native testnet USDC
                 Private Storage               - approved payout
                   - receipts
```

## Final Component Choices

### Web and API

- Next.js 16 App Router
- React 19
- strict TypeScript
- Next.js Route Handlers for AI, database, storage, and wallet-challenge endpoints
- Zod for API and AI schemas
- React Hook Form for user input
- Tailwind CSS 4 and shadcn/ui for the interface

Server-only modules hold secret-bearing OpenAI and Supabase clients. Client components handle wallet interaction and transaction signing.

### Data and Receipt Storage

Supabase PostgreSQL stores application metadata, claims, AI results, payout synchronization state, and transaction references.

Raw receipts are stored off-chain in a private Supabase Storage bucket. Access uses RLS or short-lived signed URLs. Receipt bytes are hashed for duplicate detection; raw files and URLs are never written on-chain.

### AI Layer

Use the OpenAI Responses API with `gpt-5.6-terra`.

AI responsibilities:

- interpret natural-language budget instructions
- extract merchant, amount, date, and description from receipt images
- suggest an expense category
- identify ambiguous or suspicious evidence
- return structured facts and concise recommendation reasons

Implementation requirements:

- image input uses `detail: "original"`
- output follows Zod-backed Structured Outputs
- receipt requests use `store: false`
- malformed or unavailable AI output becomes manual `Review`
- AI does not perform authoritative arithmetic or transfer funds

### Deterministic Domain Layer

Pure TypeScript functions perform:

- positive-amount and currency validation
- budget-total validation
- remaining-category-budget checks
- receipt/request amount comparison
- required-field checks
- exact receipt-hash duplicate checks
- similar claim checks using normalized merchant, amount, and date
- final recommendation policy from validated facts and rule results

This layer is covered by unit tests and is the authoritative source for hard business rules.

### Sui Layer

Use the current Sui SDK and dApp Kit packages:

- `@mysten/sui` v2
- `@mysten/dapp-kit-react`
- Sui Testnet
- Move
- native Sui Testnet USDC

The legacy `@mysten/dapp-kit` package is deprecated and must not be introduced.

The selected USDC coin type is:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

## Move Object Model

The MVP Move package should provide:

- a shared `Treasury<USDC>` object holding treasury funds and confirmed category state
- a treasurer-owned admin capability
- deposit/funding entry point
- budget confirmation/update entry point before claims are paid
- payout entry point restricted by the admin capability
- on-chain check that a payout does not exceed the relevant remaining category amount
- payout event with treasury, claim/category reference, recipient, amount, and remaining amount

This makes Sui responsible for actual custody, budget enforcement at payment time, and stablecoin transfer—not only transaction logging.

## Claim Decision Pipeline

```text
Receipt + member request
        |
        v
Private receipt upload + SHA-256 hash
        |
        v
OpenAI extraction and categorization
        |
        v
Zod validation
        |
        v
Deterministic checks
  - required fields
  - amount match
  - category balance
  - exact/similar duplicate
        |
        v
Approve / Review / Reject recommendation
        |
        v
Treasurer reviews evidence
        |
        v
Treasurer approves and signs
        |
        v
Move payout re-checks category budget
        |
        v
Native testnet USDC transfer
        |
        v
Wait for Sui success, then mark paid and synchronize dashboard
```

## Human Approval Boundary

AI may analyze and recommend. It cannot sign transactions, access the admin capability, or change a claim to `paid`.

The treasurer must:

1. review the evidence and recommendation
2. approve the claim
3. confirm the wallet transaction
4. receive a successful Sui result before the application marks the claim paid

## Identity

The connected Sui wallet address is the MVP identity. Role-sensitive off-chain mutations should use a wallet-signed nonce challenge. On-chain authorization is enforced by the admin capability and the user's wallet signature.

## On-chain vs Off-chain

### On-chain

- treasury object and administrator capability
- native testnet USDC balance
- confirmed category allocations and remaining amounts
- approved payout execution
- payout events and transaction digest

### Off-chain

- club/event display metadata
- raw receipt images
- member/claim metadata
- AI extraction and recommendation
- duplicate comparison details
- application status and synchronization records

## Failure Handling

### AI unavailable or invalid

Store no authoritative decision. Mark the claim for manual `Review` and allow retry.

### Receipt unclear

Return `Review` with missing or conflicting fields highlighted.

### Wallet rejected

Keep the claim `approved_unpaid`; do not decrement the budget. Allow retry.

### Sui transaction fails

Do not mark the claim `paid`. Record the failure safely, refresh on-chain state, and allow retry.

### Database synchronization fails after on-chain success

Use the transaction digest as an idempotency key and reconcile the off-chain record from Sui before allowing another payout.

## Deployment

- Next.js application: Vercel
- PostgreSQL and private receipt storage: Supabase
- Smart contract and payment network: Sui Testnet
- CI: GitHub Actions

The public Sui fullnode endpoint may be used during initial development, but the RPC URL remains configurable for demo reliability.

## Architecture Goal for Judging

A judge should be able to see that:

- AI handles unstructured budget language and receipt evidence.
- TypeScript handles deterministic financial rules.
- The treasurer remains accountable for approval.
- Move enforces authorization and category limits at payout time.
- Sui executes a real native testnet USDC transfer.
- Private receipt data remains off-chain.
