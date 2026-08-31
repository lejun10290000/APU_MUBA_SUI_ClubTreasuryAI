# ClubTreasury AI — Architecture

ClubTreasury AI uses one full-stack Next.js application plus one Sui Move package.

## High-Level Architecture

```text
Treasurer / Club Member
        |
        v
Next.js 16 Web Application
  - React UI
  - deterministic financial rules
  - AIService boundary
        |
        +-----------------------+----------------------+-------------------+
        |                       |                      |                   |
        v                       v                      v                   v
AIService                 Supabase PostgreSQL     Sui Wallet      Private Storage
  |- MockAIService        + RLS/Auth              (Stage 6 payout) (Supabase receipts)
  `- GeminiAIService                                 |
     (@google/genai 2.19.0)                          v
                                                Sui Testnet
                                                - Move treasury
                                                - native Testnet USDC
```

## Responsibility Split

```text
AI
→ understand unstructured language/receipt evidence
→ suggest categories / ambiguity / concise reasons

Deterministic TypeScript
→ validate schemas
→ authoritative amount parsing
→ budget totals / category limits
→ duplicate logic
→ recommendation policy

Human treasurer
→ final approve/reject decision
→ explicit wallet approval/signature

Sui Move
→ treasury custody
→ treasurer authorization
→ category allocation enforcement
→ remaining-balance enforcement
→ payout execution
→ public payout evidence
```

AI never owns authoritative financial balances, payout authorization, wallet signing, or Sui transaction execution.

## AI Layer

The app depends on a shared interface:

```text
AIService
  |- MockAIService
  `- GeminiAIService
```

Mock mode is the default for development, CI, ordinary browser tests, and Sui work. It makes zero Gemini API calls.

Stage 4 implements `GeminiAIService` with the official `@google/genai` `2.19.0` SDK. The SDK/client is lazy-loaded only for an explicitly enabled live request, and every JSON response is independently validated with Zod before it crosses the service boundary. Owner-controlled budget and synthetic receipt live validation passed on 30 August 2026, after which configuration returned to mock mode.

Budget analysis accepts untrusted natural-language text and requests USDC category amounts directly as integer application minor units. Receipt analysis accepts explicit bounded JPEG/PNG/WebP base64 data; it never reads arbitrary local paths or persists/logs the image. The output includes extracted evidence, category suggestion, missing fields, `needsReview`, and concise reasons.

`AI_MODE=mock` returns `MockAIService` without constructing a Gemini client. Live calls require both the server-side key and `GEMINI_LIVE_REQUESTS_ENABLED=true`. Empty, malformed, schema-invalid, unavailable, or blocked provider responses fail safely so later claim integration can route to manual `Review`.

Gemini may:

- interpret natural-language budgets
- extract receipt facts
- suggest categories
- identify ambiguity
- provide concise reasons

Gemini may not:

- authorize payment
- calculate authoritative remaining balance
- bypass category limits
- determine authoritative duplicate state by itself
- sign transactions
- trigger payouts autonomously

## Deterministic Domain Layer

Pure TypeScript remains authoritative for:

- positive amount/currency validation
- integer/minor-unit parsing
- budget-total validation
- category-remaining checks
- receipt/request amount comparison
- exact/similar duplicate checks
- final recommendation policy from validated facts/rules

## Sui Layer — Stage 3 Verified

Network: **Sui Testnet**

Native Circle Testnet USDC:

```text
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

Verified package:

```text
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f
```

Verified demo Treasury:

```text
0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4
```

Verified demo TreasurerCap:

```text
0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7
```

Publish digest:

```text
DdQQEcGD8FWmAde2rziBDjwua5CjcwRUtfN4p2Lkoeb
```

## Move Object Model

The Move package at `move/club_treasury` provides:

- shared `Treasury<phantom Asset>`
- address-owned `TreasurerCap<phantom Asset>`
- explicit capability binding to one treasury ID and treasurer
- opaque external reference
- internal `Balance<Asset>` custody
- permissionless positive deposits before allocation confirmation
- one-time opaque category references
- exact `allocated` and `remaining` `u64` values
- exact equality between confirmed allocations and custody
- post-confirmation deposit lock
- treasurer/capability-authorized payout
- exact category lookup
- positive amount / non-zero recipient enforcement
- category remaining and custody sufficiency checks
- pre/post `sum(category_remaining) == custody balance` invariant
- exact typed `Coin<Asset>` payout
- typed `PayoutEvent`

`TreasurerCap` does not have the `store` ability, and privileged calls additionally require the transaction sender to match the stored treasurer address.

**31/31 Move tests pass** with Sui CLI `1.78.1-722ac4fcf484`.

## Application-side Sui Integration

The App Router keeps wallet integration behind a client-only dApp Kit provider.

The configured network set contains only Testnet. Automatic wallet connection is disabled. The user must explicitly connect and explicitly approve each transaction.

The typed transaction layer builds:

- `create`
- `deposit`
- `confirm_allocations`
- `payout`

Runtime package/treasury/capability/source-coin/recipient values are validated inputs. Money values are positive `bigint` inputs checked against Move `u64` limits.

The verified execution boundary is:

```text
TypeScript builds a deterministic transaction
        ↓
Human treasurer reviews/signs in Slush
        ↓
App submits signed bytes through configured Sui Testnet client
        ↓
App waits for confirmed Testnet result
        ↓
Move enforces authorization/custody/category rules
        ↓
UI stores/display public IDs and digest evidence only after confirmation
```

No application code holds a wallet private key or recovery phrase.

## Stage 3 Real Testnet Evidence

The project owner completed the dedicated Testnet demo with a browser wallet and native Circle Testnet USDC:

```text
Create Treasury
→ confirmed

Deposit 1.00 USDC
→ confirmed

Confirm events allocation = 1.00 USDC
→ confirmed

Human-approved payout = 0.10 USDC
→ confirmed
```

The application displayed confirmed transaction links for all four steps and the real typed `PayoutEvent`.

A read-only post-payout Treasury refresh returned:

```text
allocations_confirmed: true
category_allocated: 1000000
category_remaining: 900000
funds: 900000
```

With Testnet USDC metadata `decimals = 6`, the final on-chain accounting is:

```text
1.00 USDC allocated
0.10 USDC paid
0.90 USDC remaining
```

This verifies the Stage 3 custody/allocation/payout invariant in a real Testnet flow.

## Claim Decision Pipeline

Stage 5 implements and persists the workflow through the human decision boundary:

```text
Receipt + member request
        ↓
Private receipt upload + hash
        ↓
AIService (mock or explicitly enabled Gemini)
        ↓
Zod-valid structured facts
        ↓
Deterministic checks
        ↓
Approve / Review / Reject recommendation
        ↓
Treasurer final decision
        ↓
Immutable approved_* snapshot + payment_status=unpaid
```

Stage 6 begins only after that persisted boundary:

```text
Approved-unpaid claim snapshot
        ↓
Explicit wallet signature
        ↓
Move payout re-check
        ↓
Sui Testnet USDC transfer
        ↓
Only after confirmation: synchronize paid status / remaining budget
```

The Stage 5 API never imports the Sui transaction execution layer. In live data mode, it first binds an anonymous Supabase Auth session to a Sui address through a signed, single-use, expiring nonce. Standard and zkLogin personal-message signatures are checked against the expected address; network-bound zkLogin verification uses the official Sui Testnet GraphQL service. PostgreSQL RLS then limits treasury, membership, category, and claim access. Receipt objects stay private and the server returns short-lived signed URLs only after an RLS-authorized claim lookup.

Receipt evidence is validated as JPEG/PNG/WebP up to 10 MB, hashed from the exact uploaded bytes with lowercase SHA-256, stored under the authenticated user path, and made immutable after claim creation. A unique external reference protects submission retries. An exact receipt hash or reference cannot receive an Approve recommendation; similar merchant/amount evidence routes to Review.

AI analysis runs once after explicit submission through `getAIService()`, and its validated result is stored. Provider or output failure leaves the claim persisted and forces manual Review. Deterministic TypeScript checks remain authoritative for amount/category/budget/duplicate/evidence decisions.

## On-chain vs Off-chain

### On-chain

- treasury/capability
- native Testnet USDC custody
- confirmed category allocations/remaining amounts
- approved payout execution
- payout event and transaction evidence

### Off-chain

- club/event display metadata
- raw receipt images
- member/claim metadata
- AI extraction/recommendation
- duplicate comparison details
- application synchronization state

## Failure Handling

- AI unavailable/invalid → manual `Review`
- unclear receipt → `Review` with missing/conflicting fields
- wallet rejected in Stage 6 → no payout; keep the Stage 5 approved-unpaid state
- Sui transaction fails → do not mark claim paid
- database synchronization fails after Sui success → reconcile from digest before retry

## Deployment Direction

- Web app: Vercel (Stage 7)
- Persistence/private receipt storage: Supabase (implemented in Stage 5; live acceptance pending)
- Payment network: Sui Testnet

## Architecture Goal for Judging

A judge should clearly see:

- AI handles unstructured budget/receipt understanding.
- deterministic TypeScript handles hard financial rules.
- the treasurer remains accountable for approval and signing.
- Move enforces authorization/category limits at payout time.
- Sui executes real Testnet stablecoin movement.
- private receipt data remains off-chain.
