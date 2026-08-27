# ClubTreasury AI — Project Specification

## Target Customer

Primary customer/user: **university club treasurers and finance committee members**.

## Core Problem

University clubs often handle budgets, receipts, reimbursement requests, approvals, and transfers through spreadsheets, chat messages, and manual banking. This creates several problems:

- unclear remaining budget
- inconsistent spending rules
- duplicate claims
- slow reimbursement approval
- poor transparency
- weak audit trail

## Product Promise

ClubTreasury AI turns a university club budget into a programmable treasury where AI helps interpret rules and review claims, while Sui executes approved stablecoin payments.

## Main User Roles

### Treasurer

Can:

- connect wallet
- create treasury/event
- define budget using natural language
- review AI-generated categories/rules
- confirm budget
- review payment/reimbursement requests
- approve/reject/request more information
- view spending and transaction history

### Club Member

Can:

- submit reimbursement/payment request
- upload receipt/evidence
- view request status
- view payout result

## Main Workflow A — Budget Setup

1. Treasurer creates an event treasury.
2. Treasurer enters total budget and/or deposits testnet stablecoin funds.
3. Treasurer enters a natural-language instruction, e.g.:
   - "Allocate 300 USDC food, 200 marketing, 250 venue, 150 prizes and keep 100 emergency."
4. AI parses the instruction.
5. App returns structured categories and rules.
6. Treasurer edits if necessary.
7. Treasurer confirms.
8. Treasury state is stored using the selected architecture, with Sui used meaningfully for fund execution and relevant on-chain state.

## Main Workflow B — Payment / Reimbursement Request

1. Member selects the relevant treasury/event.
2. Member enters description and amount.
3. Member uploads receipt/evidence.
4. AI extracts merchant/vendor, amount, date, description, and likely category where possible.
5. System checks:
   - requested amount
   - category budget remaining
   - applicable spending rules
   - duplicate/similar previous claims
   - suspicious inconsistencies that can be detected reliably
6. AI returns:
   - Approve
   - Review
   - Reject
   with a short explanation.
7. Treasurer reviews the recommendation and evidence.
8. Treasurer makes the final decision.
9. If approved, Sui testnet transaction executes the payout.
10. App updates remaining budget and request status.

## AI Output Shape — Recommended

The AI should return structured data rather than free-form text only.

Example conceptual output:

```json
{
  "merchant": "ABC Printing",
  "amount": 75,
  "currency": "USDC",
  "category": "Marketing",
  "duplicateRisk": "low",
  "budgetCheck": "within_limit",
  "recommendation": "approve",
  "reasons": [
    "Receipt amount matches the request",
    "Marketing budget has sufficient balance",
    "No matching prior claim found"
  ]
}
```

The exact schema may change during implementation, but machine-readable output is preferred.

## Human Approval

AI is advisory in the MVP.

The treasurer remains responsible for the final financial decision.

This avoids an autonomous transfer model where AI can silently move money.

## On-chain vs Off-chain Guidance

### Suitable for Sui / on-chain

- actual treasury/payment execution
- package/object IDs
- approved transaction records
- relevant treasury state that benefits from verifiability

### Better kept off-chain

- raw receipt images
- personal information on receipts
- AI prompts/responses containing private data
- large files
- sensitive club/member metadata

## MVP Must-Have Features

- Sui wallet connection
- one treasury/event creation flow
- AI budget parser
- structured budget confirmation
- member claim form
- receipt upload
- AI claim analysis
- recommendation UI
- treasurer approval UI
- real Sui testnet payout
- budget update
- visible transaction result

## Nice-to-Have Features Only After MVP

- multiple clubs
- multiple approval roles
- president + treasurer dual approval
- advanced fraud scoring
- notification system
- recurring budgets
- analytics dashboard
- zkLogin
- sponsored transactions
- Walrus storage
- mobile optimization beyond core responsiveness

## Success Criteria

The project should be considered demo-ready when a judge can watch one uninterrupted flow from budget creation to an approved on-chain payout and understand:

1. the real-world club problem
2. why AI is useful
3. why Sui is necessary
4. what the human approves
5. what transaction happened on-chain
