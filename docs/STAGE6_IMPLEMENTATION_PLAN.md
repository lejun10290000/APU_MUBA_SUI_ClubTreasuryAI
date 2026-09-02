# Stage 6 Implementation Plan — Approved Claim to Sui Payment

Status: **HISTORICAL PLAN — Stage 6 COMPLETE**

Stage 6 was implemented, owner-controlled live acceptance was verified, and the work was merged to `main` through PR #20. This file remains as the approved safety/design boundary. Current live evidence is recorded in `docs/STAGE6_LIVE_VALIDATION.md`; current development status is in `docs/PROJECT_STATUS.md`.

## Verified input contract

Stage 6 starts only from a persisted claim with:

```text
status = approved_unpaid
decision = approve
payment_status = unpaid
approved_treasury_object_id
approved_category_reference
approved_recipient_sui_address
approved_amount_minor
approved_currency = USDC
```

The immutable `approved_*` values are the only source for payout treasury, category, recipient, amount, and currency. AI output, editable form data, current receipt extraction, and request payload values cannot override that snapshot.

## Implemented payment architecture

```text
Approved-unpaid claim
        ↓
Server prepares/returns one active payment attempt
        ↓
Client reads immutable approved snapshot only
        ↓
Verify connected Testnet treasurer + matching TreasurerCap
        ↓
Build exactly one payout transaction
        ↓
Human wallet explicitly signs
        ↓
Validate signed transaction semantics + derive digest
        ↓
Persist digest before broadcast
        ↓
Relay signed transaction to Sui Testnet
        ↓
Reconcile the exact digest
        ↓
Verify finality + exact typed PayoutEvent
        ↓
Short atomic database finalization
        ↓
Paid claim + synchronized category budget + public digest evidence
```

The server never holds a wallet private key and never signs for the user.

## Implemented payment-attempt rules

Operational states include:

```text
prepared
signed
submitted
confirmed
failed
cancelled
reconciliation_required
```

Safety rules:

- only one active attempt may exist per claim
- `payment_status=unpaid` remains until exact confirmed payout evidence is verified
- once signed evidence/digest exists, retries recover by the same digest rather than constructing a blind replacement transaction
- a definitively checkpointed Sui execution failure may permit a later fresh attempt
- unavailable/not-yet-checkpointed transactions remain `reconciliation_required`
- successful Sui transactions whose exact application evidence cannot yet be verified remain `reconciliation_required`, not `failed`
- once paid, later prepare/reconcile actions return the existing confirmed result instead of creating another transaction

## Incident discovered during first acceptance

The first owner-controlled live acceptance exposed a critical unsafe assumption: a Sui transaction that had already succeeded was treated as failed because application-side payout-event parsing failed. That released the active-attempt boundary and allowed a second signed transaction for the same approved claim.

The failed acceptance and both successful Testnet digests remain preserved in `docs/STAGE6_LIVE_VALIDATION.md`.

The repair included:

1. successful-but-unverifiable evidence stays non-terminal and keeps the existing digest active
2. canonical `PayoutEvent` BCS bytes are the primary verification source, with JSON only as a compatibility fallback
3. live claim submission loads the real persisted Supabase treasury/category workspace rather than stale demo budget values
4. database finalization requires on-chain remaining amounts to match the same persisted budget state

The safety principle is:

```text
PayoutEvent verification failed
        ≠
Sui payout did not execute
```

## Verified clean acceptance

A fresh aligned Testnet/Supabase scenario passed the Stage 6 exit gate:

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101

Category:
events

Approved payout:
0.10 USDC

Confirmed digest:
DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7
```

Before signing, the database showed `1.00 USDC allocated`, `0 spent`, and zero payment attempts. After exactly one wallet signature, exactly one payment attempt became `confirmed`, the claim became `paid`, and the category showed `0.10 spent / 0.90 remaining`. Refresh preserved the same paid state/digest and did not offer or sign a second payment.

## Stage 6 exit result

- implementation merged through PR #20
- merge commit: `61fb9c86f5077f9813add6dc94aa69b311aaf4d7`
- `main` push CI run #100: lint/typecheck/build passed, **171/171 unit tests** passed, **7/7 Playwright smoke tests** passed
- owner-controlled clean Testnet acceptance: **PASSED**
- same-digest refresh/idempotency: **PASSED**
- failed first acceptance remains preserved as incident evidence

**Stage 6 is COMPLETE. Stage 7 — Demo hardening and deployment — is CURRENT.**