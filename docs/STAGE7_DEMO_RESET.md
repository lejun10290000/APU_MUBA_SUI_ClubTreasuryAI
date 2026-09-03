# Stage 7B Demo Reset and Preflight Runbook

Use this runbook to prepare a repeatable ClubTreasury AI rehearsal on **Sui
Testnet**. It describes public identifiers and verification steps only. It
does not reset Sui, create funds, submit a payout, or replace any historical
Stage 6 evidence.

## Safety boundary

There is no fake blockchain reset. Sui history is immutable: a prior payout,
transaction, event, or object history remains public and must not be hidden or
rewritten. Creating a new Treasury or sending it funds is an **owner-wallet
action only**, and is appropriate only when the existing public state is
genuinely unsuitable for a new rehearsal. It is never a way to erase a
historical payment.

Never put a wallet secret, recovery phrase, signed transaction bytes, Gemini
key, or Supabase secret in this runbook, a screenshot, the repository, or a
demo record.

## Named Treasury reference and actual-state branches

The default path uses the persisted Supabase workspace that maps exactly to
this public Sui Testnet pair:

| Item | Public reference |
| --- | --- |
| Sui package | `0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f` |
| Native Testnet USDC type | `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC` |
| Sui Treasury / Supabase treasury mapping | `0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3` |
| Sui and Supabase category | `events` |
| TreasurerCap | `0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101` |
| TreasurerCap owner | The designated demo treasurer's connected owner wallet; confirm the wallet currently owns the cap before signing. |
| Rehearsal claim | A newly created claim, `events`, `0.10 USDC` (`10` minor units), approved but unpaid |
| Recipient | A current, controlled Testnet recipient address, verified against the immutable approved claim snapshot before payment; do not reuse an incident recipient by default. |

The package, USDC type, Treasury, and TreasurerCap above are public Testnet
values copied from `docs/PROJECT_STATUS.md` and
`docs/STAGE6_LIVE_VALIDATION.md`.

For every run on the named Treasury, capture its **current reconciled state**
immediately before payment. Do not use a fixed reset value. Record these
minor-unit variables from both Sui and Supabase:

| Variable | Required meaning and rule |
| --- | --- |
| `A` | Current `events` allocated amount; Sui and Supabase must be exactly equal. |
| `S` | Current `events` spent amount; Sui and Supabase must be exactly equal. |
| `R` | Current remaining amount, calculated as `R = A - S`; both systems must yield the same result. |
| Claim | Exactly `10` minor units (`0.10 USDC`); require `R >= 10` before signing. |
| Expected post-run | Allocation stays `A`; spent becomes `S + 10`; remaining becomes `R - 10`. |

The first-next-rehearsal reference from the Stage 6 record is an example only:
`A = 100`, `S = 10`, `R = 90` (`1.00/0.10/0.90 USDC`). One confirmed
`0.10 USDC` payout would then produce `A = 100`, `S = 20`, `R = 80`
(`1.00/0.20/0.80 USDC`). A later rehearsal must capture its own current
values; it is not required to begin at either example state.

There are two explicit preflight branches:

1. **Default recorded-Treasury branch:** use the named Treasury only when the
   captured `A`, `S`, and calculated `R = A - S` are exactly equal in Sui and
   Supabase, and `R >= 10`. Its post-run target is `A`, `S + 10`, and `R - 10`.
2. **Fresh-Treasury branch (owner-only):** if a genuinely fresh `0.00 USDC`
   spent Treasury is required, the owner must create/fund it, establish its
   matching persisted Supabase workspace/category, and record the new public
   Treasury/Cap mapping before it becomes active. Only that separately
   recorded mapping may use the `1.00/0.00/1.00 USDC`
   allocated/spent/remaining starting state. It does not alter the named
   Treasury's history.

## Owner-only preparation

These actions require the project owner and must not be performed by a normal
rehearsal operator:

1. For the default branch, confirm the connected wallet is the intended
   Testnet wallet and owns the listed TreasurerCap. For a fresh-Treasury
   branch, confirm ownership of the newly recorded corresponding cap instead.
   Confirm it has enough SUI for gas and enough native Testnet USDC for the
   Treasury's intended allocation and one `0.10 USDC` rehearsal payout. Do
   not disclose wallet credentials.
2. For the default branch, inspect the public named Treasury and its `events`
   allocation using trusted Sui tooling. Confirm the package/native USDC type
   and capture current `A` and `S`; calculate `R = A - S` and require
   `R >= 10`. For a fresh-Treasury branch, inspect the newly recorded public
   Treasury with the same capture and calculation.
3. Inspect the persisted Supabase workspace. For the default branch, select
   the record mapped to the named Treasury and its persisted `events` category
   and capture its current `allocated_minor` and `spent_minor`. For a fresh
   branch, select only its matching owner-recorded workspace/category. In
   either case, require exact equality with Sui before calculating `R`; do not
   substitute the local mock/demo budget.
4. If the public Treasury, cap ownership, gas, USDC balance, or matching
   Supabase data is unsuitable, stop. The owner may prepare a separate
   Treasury and matching persisted workspace only after recording the new
   public mapping and funding it through an owner-wallet transaction. This is
   the owner-only fresh-Treasury branch, not a reset of old chain history.

## Preflight checklist

Complete every item before opening the payment action:

- [ ] The application targets Sui `testnet`; the configured package and native
      USDC type equal the clean baseline table.
- [ ] For the default branch, the active Supabase treasury object reference is
      `0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3`.
      For a fresh-Treasury branch, use only the owner-recorded new Treasury
      and its matching persisted workspace/category.
- [ ] Select one actual-state branch. The default named-Treasury branch uses
      current captured `A`, `S`, and `R`; a fresh-Treasury branch is valid only
      after the owner has recorded its new public mapping.
- [ ] Capture the active persisted Supabase `events` category's current
      `allocated_minor` as `A` and `spent_minor` as `S`, then calculate
      `R = A - S`.
- [ ] Capture the active Sui `events` category's current allocation and spent
      amounts. They must exactly equal Supabase `A` and `S`; its calculated
      remaining amount must exactly equal `R`. Require `R >= 10` minor units
      for the new `0.10 USDC` payout. Otherwise stop and reconcile.
- [ ] For the default branch, the designated connected wallet visibly owns
      `0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101`.
      For a fresh-Treasury branch, it owns that branch's recorded TreasurerCap.
      In either case it has sufficient SUI gas; do not attempt a signature if
      either check fails.
- [ ] The claim is newly created for this rehearsal, is in the persisted clean
      workspace, has `status = approved_unpaid`, `decision = approve`,
      `payment_status = unpaid`, `approved_amount_minor = 10`, and approved
      category reference `events`.
- [ ] The recipient is a reviewed, controlled Testnet address and equals the
      approved snapshot. The amount is exactly `0.10 USDC`; never edit the
      request after approval to make it fit a demo.
- [ ] The claim has no payment attempts. In particular, it is not a paid claim
      and has no `confirmed` or `reconciliation_required` attempt.
- [ ] The operator has checked the claim ID, Treasury ID, category, recipient,
      amount, and available balance with the owner before the single intended
      wallet signature.

## Rehearsal procedure

1. Use the active persisted Supabase treasury/category pair from the preflight
   checklist. Do not select a historical treasury merely because it has a
   familiar balance.
2. Create one new claim for `events` at exactly `0.10 USDC` to the reviewed
   Testnet recipient. Complete the normal review so the immutable approved
   snapshot is the payout source.
3. Re-read the preflight fields immediately before payment. The app's
   Supabase-to-Sui consistency check must pass. If it reports any mismatch or
   ambiguous previous attempt, stop; do not open the wallet or retry by making
   another claim.
4. The owner performs one explicit wallet signature for this one approved
   claim. Do not sign a replacement transaction after an interruption, slow
   response, failed event read, or uncertain transaction result.
5. Wait for finality and exact payout evidence verification. The app must
   persist the signed digest before broadcast and reconcile that same digest if
   the result is ambiguous.

## Post-demo verification

- [ ] The claim is `paid` only after exact on-chain payout evidence verifies.
- [ ] There is exactly one payment attempt, it is `confirmed`, and it records
      one confirmed digest.
- [ ] The active `events` category has the recorded preflight allocation `A`,
      spent amount `S + 10`, and remaining amount `R - 10` in both verified
      chain state and Supabase. Otherwise stop and reconcile; do not treat a
      fixed historical balance as the expected result.
- [ ] Refresh the paid-claim page. It stays paid, shows the same digest, offers
      no new payment action, and opens no wallet.
- [ ] Retain the claim ID and digest as rehearsal evidence. Do not reuse that
      paid claim for a later rehearsal.

## Preparing another safe rehearsal

Start with a different newly created, approved-but-unpaid claim only after the
active Treasury/category balance and Supabase mapping have been reconciled.
The former rehearsal's paid claim is excluded. So are all claims with a
confirmed payment attempt and all claims/attempts marked
`reconciliation_required`; those require same-digest reconciliation, never
replacement signing.

The failed Stage 6 evidence is permanently excluded from rehearsals: claim
`855dc49e-c8ba-4d9e-a20b-97c3cc1ad86f`, its two recorded payout digests, and
its failed/reconciliation-required attempts are incident evidence, not demo
fixtures. Do not delete, relabel, manually mark paid, or pay it again.

For every later rehearsal, recapture and reconcile `A`, `S`, and `R = A - S`
from the active Treasury/category rather than carrying forward a fixed reset
value or an assumed result. If either system differs, stop and reconcile. If a
fresh starting balance is genuinely needed, ask the owner to establish and
record a separately funded Treasury/workspace mapping. In all cases, repeat
the full preflight and keep each earlier claim and digest immutable. These
controls prevent duplicate payments while preserving the Stage 6 finalization
and reconciliation invariants.
