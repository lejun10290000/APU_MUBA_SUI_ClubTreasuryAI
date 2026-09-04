# Stage 7 Final Demo Runbook

Use this runbook for the official ClubTreasury AI demonstration. It preserves the verified Stage 7C evidence and defaults to a no-spend evidence path. For any new live payout, the owner must separately complete every preflight in `docs/STAGE7_DEMO_RESET.md` and explicitly authorize one wallet signature.

## Non-negotiable safety rules

- Never paste or display a seed phrase, private key, Gemini key, Supabase secret, Vercel token, signed transaction bytes, or private receipt URL.
- Never reuse, reset, modify, delete, or pay the Stage 7C claim.
- Never retry a payout by signing again when an existing digest is pending, ambiguous, or awaiting application verification. Reconcile that exact digest.
- AI recommends; deterministic checks, the human decision, wallet signature, and Move enforcement remain separate boundaries.
- Mock AI is the normal reliable demo mode and must be labeled as mock.

## Known-good public baseline

| Item                   | Verified public value                                                            |
| ---------------------- | -------------------------------------------------------------------------------- |
| Production app         | `https://apumubasuiclubtreasuryai000.vercel.app`                                 |
| Sui network            | Testnet                                                                          |
| Move package           | `0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f`             |
| Native Testnet USDC    | `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC` |
| Treasury               | `0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3`             |
| TreasurerCap           | `0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101`             |
| Verified wallet        | `0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea`             |
| Stage 7C claim         | `69a20a42-ae58-4547-b2f5-28bb2de52262`                                           |
| Stage 7C attempt       | `fae3fbfb-0738-47ae-b08b-764601b96ef1`                                           |
| Stage 7C digest        | `9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL`                                   |
| Stage 7C budget result | `1.00 allocated / 0.20 spent / 0.80 remaining USDC`                              |

The accepted Stage 6 digest is `DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7`. Historical failed Stage 6 evidence remains incident evidence, not a fixture.

## Before presenting

Owner/operator checklist:

- [ ] Open the production app and `/api/health`; require `ok=true`, `ready=true`, `stage=7`, AI mock/live-disabled, claims live/configured, and Sui Testnet/package-configured.
- [ ] Confirm the browser has no sensitive receipt, environment, provider-dashboard, or wallet-secret screen open.
- [ ] Keep the known-good synthetic receipt and budget sentence locally available.
- [ ] Open the Stage 7C paid claim and its Testnet explorer transaction in separate tabs if authenticated access is healthy.
- [ ] Confirm the backup recording/screenshots are available locally to the presenter; do not rely on repository placeholders.
- [ ] If attempting a new owner-authorized payout, complete `docs/STAGE7_DEMO_RESET.md` from current Sui and Supabase state. Never assume the historical balance.

## Recommended five-minute path

1. **Problem and responsibility split:** show the landing/dashboard and explain `AI understands → deterministic rules verify → human approves → wallet signs → Sui executes`.
2. **Treasury and budget:** on the verified Stage 7 production baseline, show the existing persisted Treasury and `events` category. After A1 migration/acceptance is complete, create a persisted app treasury and balanced budget, explain that it starts unlinked, and show that the same treasury/categories continue into Claims. Do not claim this A1 path is deployed before owner acceptance.
3. **Claim evidence:** show a synthetic claim review, the private/off-chain receipt model, AI recommendation label, deterministic amount/budget/duplicate checks, and the human decision note.
4. **Payment boundary:** show the immutable amount/category/Treasury/recipient snapshot and explain the server-authoritative Supabase-to-Sui pre-sign check plus TreasurerCap ownership check.
5. **Verified execution:** use the already paid Stage 7C claim and digest. Show `Paid`, the explorer evidence, `0.80 USDC` remaining, and the same state after refresh. Do not create another payout merely for presentation.
6. **Recovery story:** explain that an ambiguous signed result stays `reconciliation_required`; the button checks the existing digest and never asks for a replacement signature.

For the A1 flow, claims and review may happen before chain setup, but approval and every payout/signing action remain blocked until the owner verifies and links that workspace's own Sui Treasury and TreasurerCap. Never link a new workspace to the Stage 7C rehearsal Treasury.

## Optional owner-authorized live payout path

This path is not required for Stage 7D and was not executed by Codex.

1. Complete the full current-state checklist in `docs/STAGE7_DEMO_RESET.md`.
2. Require a fresh approved-unpaid claim with no payment attempts and exact Sui/Supabase alignment.
3. Verify the connected wallet, Testnet, TreasurerCap, gas, recipient, category, and amount.
4. Click Pay once and approve one exact wallet transaction once.
5. Wait for finality and exact `PayoutEvent` verification.
6. If anything becomes ambiguous after signing, stop and reconcile the existing digest. Never sign a replacement.

## Recovery decisions during the demo

| Symptom                                    | Safe action                                                                    | Never do                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------- |
| Wallet disconnected                        | reconnect the intended wallet and authenticate                                 | enter or display recovery words           |
| Wrong wallet/network                       | switch to verified wallet/Testnet, then repeat read-only checks                | bypass the guard                          |
| Wallet auth cancelled                      | use the retry-auth/workspace control                                           | treat message signing as a payment        |
| Supabase/workspace unavailable             | retry the read-only load once; use backup evidence if unavailable              | change RLS or paste a secret into code    |
| Private receipt preview unavailable        | continue with the authorized persisted claim summary or use a safe screenshot  | make the bucket public                    |
| AI unavailable                             | explain manual Review and switch to labeled mock evidence                      | claim mock output is live Gemini          |
| Pre-sign mismatch                          | stop; refresh authoritative Sui/Supabase state                                 | sign anyway or edit the approved snapshot |
| Wallet transaction rejected before digest  | claim stays unpaid; retry only after intentional owner review                  | say payment succeeded                     |
| Digest exists or chain result is ambiguous | reconcile the same digest                                                      | create/sign another payout                |
| Venue internet/provider failure            | switch immediately to backup screenshots/video and public recorded identifiers | debug secrets/settings on stage           |

## After the demo

- If no new payout occurred, no state reset is needed.
- If an owner-authorized payout occurred, record its claim, attempt, digest, and actual before/after balances; refresh and confirm the same paid digest and zero replacement attempts.
- Preserve all prior successful and failed evidence. On-chain history cannot be reset.
