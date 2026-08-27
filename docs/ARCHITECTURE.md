# ClubTreasury AI — Architecture

This document describes the intended hackathon architecture. Exact libraries/services may change after technical validation.

## High-Level Architecture

```text
Treasurer / Club Member
        |
        v
   Web Frontend
        |
        +--------------------+
        |                    |
        v                    v
 Backend / API           Sui Wallet
        |                    |
        v                    v
   AI Service          Sui Testnet
        |                    |
        +----------+---------+
                   |
                   v
         ClubTreasury Workflow
```

## Responsibilities

### Frontend

Responsible for:

- wallet connection UI
- treasury/event setup UI
- natural-language budget entry
- structured budget preview
- claim submission
- receipt upload
- AI recommendation display
- treasurer approval/rejection UI
- transaction status and history

### Backend / API

Responsible for:

- validating requests
- calling AI services
- converting AI output into strict structured data
- applying deterministic budget/business rules
- duplicate-claim comparison where appropriate
- storing off-chain app data
- protecting AI/API credentials

### AI Layer

Responsible for:

- interpreting natural-language budget instructions
- extracting receipt/invoice fields
- suggesting expense category
- generating a concise recommendation with reasons

Important: deterministic checks such as `requested amount <= remaining category budget` should not rely only on an LLM. The backend/application should verify such rules in code.

### Sui Layer

Responsible for:

- testnet treasury/payment execution
- relevant Move smart-contract logic
- verifiable approved payouts
- transaction digest/status
- on-chain state where it creates real value

## Recommended Decision Pipeline

For a claim:

```text
Receipt + member request
        |
        v
AI extraction / categorization
        |
        v
Structured claim data
        |
        v
Deterministic rule checks
  - budget balance
  - category limit
  - duplicate match
  - required fields
        |
        v
Recommendation assembled
        |
        v
Treasurer reviews
        |
        v
Treasurer confirms payout
        |
        v
Sui transaction
```

This architecture prevents the product from depending on AI for simple arithmetic or hard financial rules.

## On-chain Data Guidance

Prefer storing only what needs transparency/verifiability.

Potential on-chain information:

- treasury identifier/object
- owner/admin address
- available treasury funds
- approved payout amount/recipient
- payment transaction
- selected policy identifiers or budget state if useful

Avoid putting raw receipt images or unnecessary personal data directly on-chain.

## Off-chain Data Guidance

Likely off-chain:

- raw receipt image
- merchant OCR/AI extraction details
- private club/member profile information
- AI reasoning/result payloads
- UI metadata

## Smart Contract / Move Concept

Potential contract responsibilities for the MVP:

- create treasury
- accept/deposit funds
- authorize treasury admin/treasurer
- execute approved payout
- emit/record useful events

Do not over-engineer the Move package before the basic payout workflow works.

## Security Considerations

- Private keys remain in the user's wallet; backend must not hold them.
- API keys stay server-side in environment variables.
- Never commit secrets.
- Validate all AI-produced structured data before using it.
- Re-check payment amount and recipient immediately before transaction construction.
- User must confirm/sign the final payment transaction.

## Failure Handling

### AI unavailable

Show a retry/manual-review state rather than blocking access to the entire dashboard.

### AI output invalid

Reject malformed output and request another analysis or manual review.

### Wallet rejected

Keep claim approved-but-unpaid and allow retry.

### Sui transaction fails

Do not mark the claim as paid. Show failure and allow retry after checking status.

### Receipt unclear

AI recommendation should be `Review`, and the treasurer can inspect manually.

## Architecture Goal for Judging

A judge should be able to clearly see:

- AI handles unstructured human/receipt information.
- Normal application logic handles deterministic financial checks.
- Human makes the final decision.
- Sui performs the real financial execution.

This separation is intentional and should be easy to explain during Q&A.
