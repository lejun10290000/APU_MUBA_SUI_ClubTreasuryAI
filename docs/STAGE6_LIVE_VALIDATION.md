# Stage 6 Live Validation — Approved Claim to Sui Testnet Payment

Stage 6 live acceptance is **VERIFIED COMPLETE**. This document preserves both the failed first acceptance and the successful clean exit-gate run.

## Safety rule

A live acceptance passes only when one approved claim produces exactly one verified Sui Testnet USDC payout, the database marks that claim paid only after exact on-chain evidence is verified, and repeated refresh/reconciliation uses the same digest without creating or signing a replacement transaction.

Do not delete or rewrite failed acceptance evidence to make a run appear successful.

## 2 September 2026 — Fresh aligned live acceptance: PASSED

A new Sui Testnet treasury and matching Supabase workspace were prepared specifically for the Stage 6 exit gate after the first acceptance exposed a duplicate-payout defect.

Clean public Sui identifiers:

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101

Category:
events

Initial allocation:
1.00 USDC

Initial spent:
0.00 USDC
```

The matching Supabase treasury/category fixture was verified before claim approval. The live claim form was also corrected so live mode reads the persisted Supabase workspace instead of the local demo budget, preventing stale demo categories from overwriting or misaligning live budget state.

Successful acceptance claim:

```text
claim id:
20dcaac6-a208-4037-8338-15d0ded4a64d

requested / approved amount:
0.10 USDC

category:
events

recipient:
0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea

approved treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3
```

Before payment, live database verification confirmed:

```text
status = approved_unpaid
decision = approve
payment_status = unpaid
approved_amount_minor = 10
approved_category_reference = events
allocated_minor = 100
spent_minor = 0
payment_attempt_count = 0
```

The project owner then clicked `Pay approved claim` exactly once and approved exactly one wallet signature.

Confirmed Sui Testnet payout digest:

```text
DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7
```

After server-side Sui finality and exact payout evidence verification, Supabase reported:

```text
claim status = paid
payment_status = paid
payment attempt count = 1
latest attempt status = confirmed
failure_code = null
allocated_minor = 100
spent_minor = 10
confirmed digest = DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7
```

This proves the synchronized budget transition:

```text
1.00 USDC allocated
0.10 USDC paid
0.90 USDC remaining
```

The owner then refreshed the paid claim page. The page remained `Paid`, displayed the same digest, did not show `Pay approved claim`, and did not open the wallet. A follow-up database read still showed exactly one payment attempt and the same confirmed digest.

Therefore the fresh acceptance proves:

1. immutable approved snapshot is the only payout source
2. one explicit human wallet signature produces one payment attempt
3. exactly one Sui Testnet payout is confirmed
4. exact on-chain evidence is verified before the database becomes paid
5. Supabase budget synchronization occurs once after finality
6. page refresh is idempotent and preserves the same digest
7. no replacement transaction, second wallet popup, or duplicate payment occurs

**Stage 6 exit criteria are VERIFIED.**

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

## Root cause and repair

The incident exposed three alignment/safety problems that were repaired before the successful run:

1. Sui event JSON rendering was too transport-sensitive. Stage 6 now verifies canonical `PayoutEvent` BCS bytes when available and keeps JSON only as a compatibility fallback.
2. A successful chain transaction with application-level event-verification uncertainty was incorrectly treated as definitive failure. It now remains non-terminal/reconciliation-required so the existing digest continues to block blind replacement signing.
3. The live claim form still sourced the local demo workspace/categories. Live mode now loads the persisted Supabase treasury/category relationship for the configured Sui Treasury object ID instead of submitting stale demo budget values.

The unsafe assumption corrected by the repair is:

```text
PayoutEvent verification failed
        ≠
Sui payout did not execute
```

A successful chain transaction with unverifiable application evidence is ambiguous from the application's point of view and must never authorize a blind replacement transaction.

## TDD / automated verification

Regression tests were added before the relevant production repairs, including successful-but-unverifiable chain status, UTF-8/byte category handling, canonical BCS verification when JSON is unusable, and persisted live-workspace mapping.

The original RED run proved the duplicate-payout defect, while later CI runs caught implementation lint/type issues before live use.

The latest Stage 6 branch verification before the successful live acceptance passed:

```text
lint: pass
strict TypeScript: pass
unit tests: pass
production build: pass
Playwright smoke: 7/7 pass
```

Normal CI made zero live Gemini requests and zero live Sui payouts.

## Exit gate

The fresh aligned owner-controlled acceptance passed with exactly one confirmed payment attempt and idempotent refresh. Stage 6 can therefore be marked **COMPLETE**, and the next development stage is **Stage 7 — Demo hardening and deployment**.
