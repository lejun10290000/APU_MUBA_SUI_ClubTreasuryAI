# ClubTreasury AI — Stage 7 Demo Plan

## Demo Goal

Show one complete, believable university-club treasury workflow where AI helps interpret unstructured information, deterministic rules protect financial correctness, a human treasurer makes the final decision, and Sui Testnet executes the approved USDC payment.

Stage 7 is about **repeatability and recovery**, not adding more features.

## Truthful Demo Baseline

Do not reuse the historical Stage 3 Treasury as the default rehearsal treasury. It was later used by failed Stage 6 acceptance attempts.

Current clean verified Stage 6 acceptance pair:

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101

Verified category:
events

Verified starting allocation before the accepted payment:
1.00 USDC

Verified accepted payment:
0.10 USDC

Verified remaining after acceptance:
0.90 USDC

Verified digest:
DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7
```

For repeated Stage 7 rehearsals, prefer a **fresh deterministic demo treasury/reset procedure** rather than spending the clean acceptance treasury repeatedly. Stage 7 should record the final rehearsal Treasury/Cap once the reset/seed process is chosen.

Stage 7C subsequently used the same reconciled Treasury for exactly one additional verified `0.10 USDC` payout. Its current accepted state is `1.00 allocated / 0.20 spent / 0.80 remaining USDC`, with digest `9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL`. The Stage 7D default is now the no-spend evidence path in `docs/STAGE7_DEMO_RUNBOOK.md`; do not create another Treasury or payout merely to rehearse screenshots.

## Product Story

Recommended club/event story:

- Club: university blockchain/technology club
- Event: workshop or campus event
- Treasurer creates/funds a small Testnet treasury
- AI converts a natural-language budget instruction into structured categories
- Treasurer confirms the budget
- Member submits a synthetic reimbursement receipt
- AI extracts/suggests evidence
- deterministic checks show amount/category/duplicate/budget status
- Treasurer makes the final human decision
- wallet explicitly signs the approved Sui transaction
- UI shows paid state and the public Testnet digest

The exact amounts/categories used in the final live pitch must match the seeded on-chain and Supabase state. Do not narrate a `Marketing 200 USDC` budget while the actual live treasury contains only an `events` category.

## Recommended Final Demo Order

1. Open deployed application and show the product problem/role split.
2. Connect the known-good Sui Testnet wallet.
3. Show/create the rehearsed clean treasury.
4. Enter the known-good natural-language budget instruction.
5. Show Gemini-generated or intentionally selected mock structured budget depending on the official demo mode.
6. Confirm the budget and show that the hard totals are deterministic.
7. Open member claim submission.
8. Upload the known-good synthetic receipt.
9. Show extracted receipt evidence and recommendation/reasons.
10. Show deterministic amount, duplicate, category, and remaining-budget checks.
11. Treasurer enters a decision note and approves.
12. Pause on the immutable payout snapshot: Treasury, category, recipient, amount.
13. Click Pay exactly once.
14. Review and approve the wallet transaction exactly once.
15. Wait for Sui finality and exact payout-event verification.
16. Show `Paid`, updated budget, digest, and explorer link.
17. Refresh the paid claim to demonstrate that it remains paid with the same digest and no second payment action.

## AI Demo Mode

Normal development/rehearsal should stay:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
```

Use live Gemini only for a controlled final rehearsal, official demo-video recording, or live pitch when the team intentionally enables it with the server-side key.

If live Gemini is used, prepare one known-good budget instruction and one known-good synthetic receipt. Do not improvise expensive/repeated provider calls during the pitch.

## Stage 7 Reset / Seed Requirement

Before repeated full rehearsals, define one deterministic procedure that answers:

1. Which Sui Treasury/Cap will be used?
2. What Testnet USDC amount is deposited?
3. Which category references/allocations are confirmed?
4. Which Supabase treasury/category rows represent that same on-chain state?
5. Which member/treasurer wallets are used?
6. Which synthetic receipt and claim amount are used?
7. How do we return to a known starting state after a rehearsal payment?

A reset must never manually rewrite a successful on-chain payment as though it did not happen. Prefer creating a fresh small Testnet treasury/claim scenario when a clean state is required.

## Preflight Checklist Before Every Full Rehearsal

- [ ] Deployed app URL responds successfully
- [ ] Sui wallet is on Testnet
- [ ] Wallet owns the intended TreasurerCap
- [ ] Wallet has enough Testnet SUI for gas
- [ ] Treasury has enough native Testnet USDC
- [ ] On-chain category reference and remaining amount are known
- [ ] Supabase treasury/category allocation/spent state matches the same on-chain state
- [ ] Live claim form shows the expected persisted category
- [ ] Synthetic receipt is available and privacy-safe
- [ ] Intended recipient and payout amount are known
- [ ] No old active/reconciliation-required payment attempt exists for the claim
- [ ] If live Gemini is enabled, key/guard/model are configured server-side only

## Rehearsal Success Checklist

- [ ] Wallet connects without confusing network state
- [ ] Budget input/AI result is understandable
- [ ] Budget values validate correctly
- [ ] Claim submission succeeds
- [ ] Private receipt upload succeeds
- [ ] AI extraction/recommendation appears within acceptable time
- [ ] Deterministic reasons are understandable
- [ ] Treasurer approval persists
- [ ] Approved snapshot displays exact payout values
- [ ] One wallet signature executes the payout
- [ ] UI waits for finality before saying Paid
- [ ] Budget updates once after verified success
- [ ] Digest/explorer link is visible
- [ ] Refresh keeps the same paid state/digest
- [ ] No second wallet popup/payment attempt occurs
- [ ] Full flow fits comfortably within the 5-minute presentation window

## Failure Rehearsal Checklist

Stage 7 should deliberately exercise safe, non-destructive failure paths before the official demo:

- [ ] Gemini unavailable/disabled → manual Review remains usable
- [ ] wallet disconnected → clear connect instruction
- [ ] wrong wallet/network → payout blocked before signing
- [ ] wallet rejects signature → claim stays approved-unpaid
- [ ] transaction not yet visible → reconciliation-required with same digest
- [ ] successful transaction cannot be finalized immediately → no blind second payment
- [ ] Supabase/API error → understandable message and recoverable state
- [ ] receipt invalid/too large/wrong bytes → rejected before unsafe side effects

Do not intentionally create another duplicate-payment or destructive mismatch on the final demo treasury.

## What to Say During Demo

### Payments & Stablecoins framing

Emphasize:

- university clubs struggle with scattered budget/reimbursement workflows
- Testnet USDC is held in a programmable Sui treasury
- Move enforces category limits and treasurer authorization
- a human explicitly signs the stablecoin payout
- public digest/event evidence creates an auditable payment trail

### AI × Sui framing

Emphasize:

- Gemini converts unstructured budget/receipt information into structured facts
- deterministic TypeScript independently verifies hard financial rules
- AI recommends but cannot authorize or move funds
- the treasurer makes the final decision
- Sui turns that approved decision into verifiable execution

## Backup Plan

Prepare before the pitch:

- screenshots of the critical workflow states
- short backup recording of the full successful deployed flow
- known-good synthetic receipt
- known-good budget instruction
- current clean/rehearsal public object IDs
- one verified successful digest/explorer page
- enough Testnet gas/funds for the live run

If Gemini, Sui RPC, wallet provider, Supabase, or venue internet fails during the pitch, explain the external dependency briefly and switch to backup evidence rather than spending the presentation debugging.

## Demo Principle

Do not showcase every optional feature. Show the strongest end-to-end story:

**AI understands → deterministic rules verify → human approves → Sui executes → app reconciles safely.**
