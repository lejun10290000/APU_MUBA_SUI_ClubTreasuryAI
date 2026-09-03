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

## Clean rehearsal baseline

The active Supabase workspace must be the persisted treasury/category pair
that maps exactly to this public Sui Testnet pair:

| Item | Required clean value |
| --- | --- |
| Sui package | `0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f` |
| Native Testnet USDC type | `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC` |
| Sui Treasury / Supabase treasury mapping | `0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3` |
| Sui and Supabase category | `events` |
| TreasurerCap | `0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101` |
| TreasurerCap owner | The designated demo treasurer's connected owner wallet; confirm the wallet currently owns the cap before signing. |
| Category allocation | `1.00 USDC` (`100` minor units) |
| Category spent before a new rehearsal | `0.00 USDC` (`0` minor units) |
| Category remaining before a new rehearsal | `1.00 USDC` (`100` minor units) |
| Rehearsal claim | A newly created claim, `events`, `0.10 USDC` (`10` minor units), approved but unpaid |
| Recipient | A current, controlled Testnet recipient address, verified against the immutable approved claim snapshot before payment; do not reuse an incident recipient by default. |

The package, USDC type, Treasury, and TreasurerCap above are public Testnet
values copied from `docs/PROJECT_STATUS.md` and
`docs/STAGE6_LIVE_VALIDATION.md`. The `events` category's expected on-chain
allocation and spent amounts must equal the persisted Supabase category's
`allocated_minor` and `spent_minor` values. A mismatch is a stop condition:
do not sign or broadcast.

## Owner-only preparation

These actions require the project owner and must not be performed by a normal
rehearsal operator:

1. Confirm the connected wallet is the intended Testnet wallet and owns the
   listed TreasurerCap. Confirm it has enough SUI for gas and enough native
   Testnet USDC for the Treasury's intended allocation and one `0.10 USDC`
   rehearsal payout. Do not disclose wallet credentials.
2. Inspect the public Treasury and its `events` allocation using trusted Sui
   tooling. Confirm the Treasury is for the package and native USDC type in
   the baseline table, `events` has `1.00 USDC` allocated and `0.00 USDC`
   spent, and the Treasury can cover the planned `0.10 USDC` payout.
3. Inspect the persisted Supabase workspace. Select only the treasury record
   mapped to the clean Treasury object ID and its persisted `events` category.
   Confirm `allocated_minor = 100`, `spent_minor = 0`, and that it is the
   active live workspace; do not substitute the local mock/demo budget.
4. If the public Treasury, cap ownership, gas, USDC balance, or matching
   Supabase data is unsuitable, stop. The owner may prepare a separate
   Treasury and matching persisted workspace only after recording the new
   public mapping and funding it through an owner-wallet transaction. This is
   a new baseline, not a reset of old chain history.

## Preflight checklist

Complete every item before opening the payment action:

- [ ] The application targets Sui `testnet`; the configured package and native
      USDC type equal the clean baseline table.
- [ ] The active Supabase treasury object reference is
      `0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3`.
- [ ] The active persisted Supabase category is `events`, with `100` allocated
      minor units and `0` spent minor units.
- [ ] Public Sui state shows that same Treasury and `events` category with
      `1.00 USDC` allocated, `0.00 USDC` spent, and enough remaining USDC.
- [ ] The designated connected wallet visibly owns
      `0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101`
      and has sufficient SUI gas; do not attempt a signature if either check
      fails.
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
- [ ] `events` remains allocated at `1.00 USDC`, has `0.10 USDC` spent, and
      has `0.90 USDC` remaining in both the verified chain state and Supabase
      (`allocated_minor = 100`, `spent_minor = 10`).
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

If the clean Treasury now reflects a completed rehearsal (`0.10 USDC` spent),
do not pretend it is clean. Either use its actual remaining balance only when
the matching Supabase category is reconciled and the next claim is new, or ask
the owner to establish and record a genuinely clean, separately funded
Treasury/workspace mapping. In both cases, repeat the full preflight and keep
each earlier claim and digest immutable. These controls prevent duplicate
payments while preserving the Stage 6 finalization and reconciliation
invariants.
