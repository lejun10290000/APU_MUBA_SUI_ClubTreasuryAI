# ClubTreasury AI — Architecture

This document defines the hackathon MVP architecture. The project uses one full-stack Next.js application plus one Move package.

See `docs/TECH_STACK.md`, `docs/DEVELOPMENT_STAGES.md`, and `docs/AI_USAGE_POLICY.md`.

## High-Level Architecture

```text
Treasurer / Club Member
        |
        v
Next.js 16 Web Application
  - React UI
  - Route Handlers
  - deterministic financial rules
        |
        +------------------------+----------------------+-------------------+
        |                        |                      |                   |
        v                        v                      v                   v
AIService                  Supabase PostgreSQL      Sui Wallet      Private Storage
  |                          - metadata                |             - receipts
  +--> MockAIService         - claims/reviews          v
  |                          - payout state        Sui Testnet
  +--> GeminiAIService                              - Move treasury
       (@google/genai)                              - testnet USDC
```

## Web and API

- Next.js 16 App Router
- React 19
- strict TypeScript
- Next.js Route Handlers for AI, database, storage, and wallet challenge endpoints
- Zod for shared API/AI schemas
- React Hook Form for inputs
- Tailwind CSS 4 + shadcn/ui

Server-only modules hold secret-bearing Gemini/Supabase clients. Client components handle wallet interaction and transaction signing.

## AI Layer

The application depends on a shared interface:

```text
AIService
  |- MockAIService
  `- GeminiAIService
```

### MockAIService

Used by default for normal development, CI, unit tests, normal Playwright tests, UI work, Sui work, and most rehearsals.

It returns deterministic schema-valid fixture responses and makes **zero Gemini API calls**.

### GeminiAIService

Uses the official `@google/genai` JavaScript SDK with default model `gemini-2.5-flash`.

Gemini responsibilities:

- interpret natural-language budget instructions
- extract merchant/amount/date/description from receipt images
- suggest an expense category
- identify ambiguity/suspicious evidence
- return concise reasons

All output must pass server-side Zod validation.

Live Gemini is explicitly enabled only under `docs/AI_USAGE_POLICY.md`.

### AI safety boundary

Gemini does not perform authoritative financial enforcement. Gemini cannot:

- authorize payment
- calculate the authoritative remaining balance
- bypass category limits
- determine exact hash duplicates
- sign a transaction
- trigger a payout autonomously

If Gemini is unavailable/invalid, the claim becomes manual `Review` rather than being silently approved or rejected.

## Deterministic Domain Layer

Pure TypeScript functions are authoritative for:

- positive amount/currency validation
- budget-total validation
- remaining-category checks
- receipt/request amount comparison
- required fields
- exact receipt-hash duplicate checks
- similar-claim comparisons
- final recommendation policy based on validated facts/rules

This layer must be unit tested.

## Data and Receipt Storage

Supabase PostgreSQL stores app metadata, claims, AI results, payout synchronization state, and transaction references.

Raw receipt images are stored in a **private** Supabase Storage bucket. Receipt bytes are hashed for duplicate detection. Raw receipt files/URLs remain off-chain.

## Sui Layer

Use:

- `@mysten/sui` v2
- `@mysten/dapp-kit-react`
- Sui Testnet
- Move
- native Sui Testnet USDC

Selected testnet USDC coin type:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

## Move Object Model

### Verified Stage 3 foundation

The package at `move/club_treasury` currently provides:

- a shared `Treasury<phantom Asset>` object
- a `TreasurerCap<phantom Asset>` owned by the creating treasurer
- explicit binding from the capability to one treasury object ID and treasurer address
- an opaque, non-sensitive `external_reference` for mapping to the off-chain treasury record
- a `metadata_revision` counter
- a minimal privileged metadata update that checks the capability, treasury ID, and transaction sender
- an internal `Balance<Asset>` initialized to zero
- a permissionless deposit operation that consumes a positive `Coin<Asset>` into custody
- a read-only `u64` balance getter for exact native coin base units
- one-time confirmed category state using opaque non-empty byte references
- exact `allocated` and `remaining` `u64` values for each category
- treasurer-capability authorization for confirming all categories in one call
- exact equality between total confirmed allocation and current custody balance
- a post-confirmation deposit lock that preserves the custody/allocation invariant

`TreasurerCap` intentionally does not have the `store` ability. Arbitrary modules cannot publicly transfer it, and privileged calls additionally require the transaction sender to match the stored treasurer address. Depositing is permissionless and does not grant or alter withdrawal authority. The generic phantom asset parameter makes `Treasury<A>` accept only `Coin<A>` at compile time, establishing the coin-type boundary that later Stage 3 work will instantiate for verified native Circle-issued Sui Testnet USDC.

Nineteen Move tests verify treasury creation, authorization, custody, exact allocation confirmation, `remaining = allocated`, duplicate/empty/zero/length/total validation, one-time confirmation, and post-confirmation deposit rejection.

Custody amounts are Move `u64` native coin base units. The contract does not assume that the Stage 2 two-decimal demo display scale matches the real USDC on-chain decimal scale; asset metadata must supply the verified display conversion during later integration.

Category references are opaque bytes rather than display names. Confirmation is intentionally one-time in this foundation, exposes only read-only indexed getters, and blocks later deposits so `custody balance == total confirmed allocation` remains true before payout logic is added.

### Stage 2 TypeScript mapping

| Stage 2 TypeScript field/responsibility   | Stage 3 Move representation                     | Boundary                                                                             |
| ----------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Treasury.id` demo/application identifier | `external_reference: vector<u8>`                | Store only an opaque mapping reference on-chain; display metadata remains off-chain. |
| `Treasury.name`                           | Not duplicated on-chain                         | UI/display concern.                                                                  |
| `Treasury.currency = "USDC"`              | `Treasury<phantom Asset>` type parameter        | Later instantiate with the native Sui Testnet USDC coin type.                        |
| `Treasury.totalBudgetMinor`               | Sum of confirmed category `allocated` values    | Must exactly equal `Balance<Asset>` custody in native `u64` base units.              |
| `Treasury.status`                         | Not duplicated yet                              | Workflow state remains off-chain until an on-chain invariant requires it.            |
| Treasurer authority                       | Owned `TreasurerCap` + stored treasurer address | Move enforces privileged access; the UI does not grant authority.                    |

The responsibility split remains:

```text
TypeScript -> UI, schemas, session/persistence workflow, deterministic off-chain validation
Move       -> treasury identity, ownership/authorization, later custody and payout enforcement
```

### Remaining Stage 3 work

The Move package must still add:

- payout restricted by the admin capability
- payout-time category-remaining enforcement
- payout events
- transaction error handling and Testnet deployment evidence

Local generic custody, deposit accounting, and confirmed category allocation are now verified. No withdrawal or payout path exists yet. Only after the remaining pieces are implemented, deployed, and exercised with the verified Testnet USDC type will Sui provide the full planned payout-time budget enforcement and stablecoin transfer behavior.

## Claim Decision Pipeline

```text
Receipt + member request
        |
        v
Private receipt upload + SHA-256 hash
        |
        v
AIService
  Mock fixture OR live Gemini (explicitly enabled)
        |
        v
Zod-valid structured facts
        |
        v
Deterministic TypeScript checks
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
Treasurer approves
        |
        v
Wallet signature + Move payout check
        |
        v
Sui Testnet USDC transfer
        |
        v
After Sui success: mark paid + synchronize dashboard
```

## Human Approval Boundary

AI may analyze and recommend. The treasurer must:

1. review evidence/recommendation
2. approve or reject
3. confirm/sign the wallet transaction
4. receive successful Sui confirmation before the app marks the claim paid

## Identity

The connected Sui wallet address is the MVP identity. Role-sensitive off-chain mutations should use a wallet-signed nonce challenge. On-chain authorization is enforced by the admin capability and wallet signature.

## On-chain vs Off-chain

### On-chain

- treasury/admin capability
- testnet USDC balance
- confirmed category allocations/remaining amounts
- approved payout execution
- payout events and transaction digest

### Off-chain

- club/event display metadata
- raw receipt images
- member/claim metadata
- AI extraction/recommendation
- duplicate comparison details
- application/synchronization status

## Failure Handling

### AI unavailable/invalid

Return manual `Review`; do not create an authoritative automatic decision.

### Receipt unclear

Return `Review` with missing/conflicting fields highlighted.

### Wallet rejected

Keep claim `approved_unpaid`; do not decrement budget.

### Sui transaction fails

Do not mark claim paid. Refresh state and allow safe retry.

### Database synchronization fails after Sui success

Use transaction digest as an idempotency key and reconcile from Sui before allowing another payout.

## Deployment

- Next.js: Vercel
- PostgreSQL/private receipt storage: Supabase
- Move/payment network: Sui Testnet
- CI: GitHub Actions

## Architecture Goal for Judging

A judge should clearly see:

- Gemini handles unstructured budget language and receipt evidence.
- deterministic TypeScript handles hard financial rules.
- the treasurer remains accountable for approval.
- Move enforces authorization/category limits at payout time.
- Sui executes real testnet stablecoin movement.
- private receipt data remains off-chain.
- mock AI is used during development for reliability/cost control, while live Gemini is separately verifiable and clearly identified.
