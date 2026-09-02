# Stage 6 Live Validation — Approved Claim to Sui Testnet Payment

Stage 6 remains **CURRENT**. This document records owner-controlled live acceptance evidence and must distinguish failed acceptance attempts from a successful exit gate.

## Safety rule

A live acceptance passes only when one approved claim produces exactly one verified Sui Testnet USDC payout, the database marks that claim paid only after exact on-chain evidence is verified, and repeated refresh/reconciliation uses the same digest without creating or signing a replacement transaction.

Do not delete or rewrite failed acceptance evidence to make a run appear successful.

## 2 September 2026 — First live acceptance: FAILED

The first owner-controlled Stage 6 acceptance exposed a duplicate-payout safety defect and therefore **does not satisfy the Stage 6 exit criteria**.

Affected claim:

```text
claim id:
855dc49e-c8ba-4d9e-a20b-97c3cc1ad86f

external reference:
0de58db5-ec8f-4670-8fb2-5e6594009662

approved amount:
0.10 USDC

category:
events

treasury:
0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4

recipient:
0x6b5ccd6b9abe76887fd93bdf04659cbbe32c42c3e9c308a240963df0cd4e2560
```

Two different signed payout transactions for that same approved snapshot were confirmed successful on Sui Testnet:

```text
first digest:
9oZCwv5iLuHYWd5LJoAQUFfy55K8LK1wBe26zxRyx5AH

second digest:
FXzWfw3wwD4AWQKB8Q4pcyWGH3FwJmrP25GCzChvZdEG
```

The project owner independently opened both transactions in the Testnet explorer and confirmed that both show `Success` and call the verified package's `payout` function.

### Database evidence after the failed acceptance

The first payment attempt had been persisted as:

```text
status = failed
failure_code = payout_event_verification_failed
```

The second attempt was persisted as:

```text
status = reconciliation_required
failure_code = transaction_not_yet_confirmed
```

The claim itself remained:

```text
status = approved_unpaid
payment_status = unpaid
```

The affected records are preserved. Do not delete them, manually mark the claim paid as a successful acceptance result, or authorize another payout for this claim.

## Root cause

Two failures combined:

1. The payout-event verifier accepted `category_reference` only as a numeric byte array. Sui JSON may provide the Move `vector<u8>` category as a UTF-8 string such as `"events"`, so valid successful payout evidence could fail parsing.
2. A transaction that was already confirmed successful on Sui but whose exact payout event failed application verification was classified as definitive `failed`. That released the one-active-attempt boundary, so a later prepare call could create another payment attempt and the wallet could sign a second payout.

The unsafe assumption was:

```text
PayoutEvent verification failed
        ≠
Sui payout did not execute
```

A successful chain transaction with unverifiable application evidence is ambiguous from the application's point of view and must never authorize a blind replacement transaction.

## Repair

The Stage 6 branch now:

- accepts both UTF-8 string and byte-array representations of payout `category_reference`
- returns a non-terminal `pending` chain status when a successful transaction's payout evidence cannot be verified exactly
- persists that result as `reconciliation_required`
- keeps the existing transaction digest active
- prevents the normal prepare/sign flow from constructing a blind replacement transaction while that active digest exists
- still permits a new attempt after a genuinely confirmed Sui execution failure

## TDD / automated verification

A regression-test commit was added before the production repair.

GitHub CI run #77 provided the expected RED evidence:

```text
2 new Stage 6 safety tests failed
167 existing tests passed
```

The failures proved that the old implementation:

- rejected the UTF-8 string category representation
- classified successful-but-unverifiable payout evidence as definitive failure

After the repair and smoke-test fixture alignment, GitHub CI run #80 passed:

```text
lint: pass
strict TypeScript: pass
unit tests: 169/169 pass
production build: pass
Playwright smoke: 7/7 pass
```

Normal CI made zero live Gemini requests and zero live Sui payouts.

## Required fresh acceptance

The next owner-controlled acceptance must use a **fresh synthetic claim and clean aligned Testnet treasury/category**. Do not reuse the affected claim above.

Before signing:

1. verify the Treasury object ID on Sui Testnet
2. verify the connected wallet owns the matching TreasurerCap
3. verify the exact category reference on-chain
4. verify the exact category remaining balance on-chain
5. verify the database category allocation/spent state represents the same budget state
6. verify the immutable approved snapshot recipient and amount
7. use a small Testnet USDC amount

Then:

1. prepare the approved claim payout
2. approve exactly one wallet signature
3. confirm exactly one Sui Testnet payout
4. verify the exact typed `PayoutEvent`
5. verify claim/payment becomes paid only after server-side finalization
6. verify the stored digest/explorer evidence
7. refresh/reconcile the same digest again
8. confirm no second wallet popup, new attempt, or second payout occurs

Stage 6 can be marked COMPLETE only after this fresh acceptance passes and its evidence is added to this file.
