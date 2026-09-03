# Stage 7C Live Rehearsal Evidence

## Status

**Stage 7C: COMPLETE**

Date: **4 September 2026 (MYT)**

Production app:

`https://apumubasuiclubtreasuryai000.vercel.app`

The goal of Stage 7C was to prove the deployed application can complete the real persisted claim → human approval → pre-sign safety gate → explicit wallet signature → verified Sui Testnet payout → synchronized Supabase paid state flow, then remain idempotent after refresh.

## Production configuration used

- Claims: **live Supabase**
- AI: **deterministic mock**
- Live Gemini requests: **disabled**
- Sui network: **Testnet**
- Sui package configured: **yes**
- `/api/health`: `ok=true`, `ready=true`, `stage=7`

Supabase project:

`arldlnqiywhcuungvgei`

Production Site URL:

`https://apumubasuiclubtreasuryai000.vercel.app`

## Clean Treasury baseline

```text
Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101

Treasurer / recipient wallet:
0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea

Category:
events

Before Stage 7C payout:
allocated = 1.00 USDC
spent     = 0.10 USDC
remaining = 0.90 USDC
```

## Production issues discovered and fixed before payment

### 1. Wallet auth / workspace ordering deadlock

Observed behavior:

- production claim form loaded in live mode
- protected workspace required Supabase auth
- wallet identity was only established inside claim submission
- submit remained disabled because the workspace was unavailable

This created:

`workspace needs auth → auth only happens during submit → submit needs workspace`

Fix:

- authenticate the connected wallet before loading the protected workspace
- regression test added first
- implementation merged through **PR #24**
- post-merge CI passed

No claim or payout was created while fixing this issue.

### 2. Fresh anonymous Supabase session did not reuse canonical wallet identity

Observed behavior after PR #24:

- wallet challenge/signature succeeded
- fresh production browser had a new anonymous Supabase `auth.uid()`
- the same Sui wallet was already uniquely bound to the existing canonical treasurer user
- workspace authorization therefore still saw the temporary anonymous user rather than the durable treasurer identity

Fix:

- resolve a successfully verified temporary session through its consumed wallet challenge to the canonical `wallet_profiles.user_id`
- preserve unique `wallet_profiles.wallet_address`
- preserve RLS rather than bypassing data access with service-role reads
- update relevant RLS/access helpers and human/payment actor attribution to use the canonical verified wallet principal
- reuse the canonical wallet profile after signature verification
- migration applied to live Supabase:

`stage7c_wallet_principal_portability`

Implementation merged through **PR #25**.

Verified mapping during acceptance:

```text
fresh production session:
e6c53a4d-c941-421b-b69f-a49c3e8b8b2d

verified wallet:
0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea

canonical treasurer user:
de029617-d36c-452a-b0a6-17a89b0fa220
```

The clean Treasury, category budget, historical paid claim, and confirmed attempt counts were verified unchanged after migration.

## Live rehearsal claim

Fresh unique synthetic receipt evidence was uploaded in production.

```text
Claim ID:
69a20a42-ae58-4547-b2f5-28bb2de52262

Merchant:
Stage 7C Rehearsal Merchant

Description:
Stage 7C deployed end-to-end rehearsal claim

Requested amount:
0.10 USDC

Category:
events

Recipient:
0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea
```

Mock AI intentionally returned the deterministic Stage 5 receipt fixture (`75.00 USDC`, Marketing), so the app correctly recommended **Review** rather than silently approving. Duplicate checks reported no exact or similar match for the fresh receipt.

The human treasurer explicitly approved the claim with the decision note:

> Stage 7C rehearsal claim verified. Unique receipt uploaded. Treasury, recipient, and Events budget checked. Approving for unpaid payout preparation.

The persisted immutable payout snapshot was verified before payment:

```text
status = approved_unpaid
payment_status = unpaid
approved amount = 0.10 USDC
approved category = events
approved Treasury = clean Stage 7 Treasury
approved recipient = connected treasurer wallet
confirmed digest = null
payment attempts = 0
```

## Stage 7B pre-sign gate

Before wallet signing, the deployed app used the Stage 7B server-authoritative preflight to compare persisted Supabase state with current Sui Treasury state.

The gate passed for the clean aligned fixture. No mismatch override or weakened invariant was used.

## Successful Sui Testnet payout

Exactly one wallet transaction signature was approved.

```text
Amount:
0.10 USDC

Category:
events

Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

Recipient:
0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea

Confirmed digest:
9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL
```

The application only rendered `Paid` after its Stage 6 on-chain finality and exact `PayoutEvent` verification path completed.

## Final Supabase verification

```text
Claim:
status = paid
payment_status = paid
confirmed_transaction_digest = 9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL

Payment attempt:
fae3fbfb-0738-47ae-b08b-764601b96ef1
status = confirmed
failure_code = null

Attempt counts:
total = 1
confirmed = 1
active = 0

Budget after payout:
allocated = 1.00 USDC
spent     = 0.20 USDC
remaining = 0.80 USDC
```

## Refresh / idempotency proof

After confirmation, the production page was hard-refreshed.

Observed after refresh:

- `Paid` remained visible
- amount remained `0.10 USDC`
- category remained `events`
- Treasury and recipient remained unchanged
- the exact same digest remained visible
- the Pay button did not return
- no wallet signature prompt opened
- database attempt count remained exactly 1
- confirmed attempt count remained exactly 1
- active attempt count remained 0
- category remaining stayed 0.80 USDC

This verifies the deployed paid state is idempotent and does not create a replacement transaction on refresh.

## Automated verification around Stage 7C fixes

PR #24 and PR #25 were developed with regression-first tests. Their merge candidates and post-merge `main` runs passed lint, strict TypeScript, unit tests, production build, and Playwright smoke.

Latest Stage 7C hotfix merge commit:

`4d4d18f6fdf3cb826c0488c285b6ea222b50bcb4`

Post-merge CI run #136: **PASS**.

Normal CI remained mock-only and did not perform this live payout.

## Stage 7C exit decision

Stage 7C is **VERIFIED COMPLETE** because the deployed application successfully demonstrated:

1. production wallet authentication
2. canonical persisted treasury/category loading
3. private receipt claim submission
4. deterministic advisory AI review
5. explicit human approval
6. immutable approved payout snapshot
7. server-side Supabase ↔ Sui pre-sign consistency gate
8. one explicit wallet transaction signature
9. verified Testnet payout finality / event evidence
10. synchronized paid claim and budget state
11. idempotent paid refresh with no replacement attempt

## Next stage

Proceed to **Stage 7D — final reliability hardening, recovery/evidence, and readiness audit**.

Do not perform another live payout unless the 7D plan demonstrates it is necessary. Prefer read-only checks, failure simulations, mock regression tests, and preservation of the successful Stage 7C evidence above.
