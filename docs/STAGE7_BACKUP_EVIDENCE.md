# Stage 7 Backup Evidence Package

This file is a public, non-secret inventory and owner capture checklist. It does not claim that uncommitted screenshots or video files exist, and it does not contain private receipt content.

## Live evidence already verified

### Production and responsibility boundaries

- Production URL: `https://apumubasuiclubtreasuryai000.vercel.app`
- Production health was verified for Stage 7C with `ok=true`, `ready=true`, `stage=7`, claims live/configured, AI mock/live-disabled, and Sui Testnet/package-configured.
- A human treasurer approved the claim and explicitly approved one wallet transaction signature. AI did not authorize or execute payment.

### Sui deployment

- Package: `0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f`
- Native Testnet USDC: `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC`
- Clean Treasury: `0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3`
- TreasurerCap: `0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101`

### Stage 7C accepted payment evidence

- Claim: `69a20a42-ae58-4547-b2f5-28bb2de52262`
- Payment attempt: `fae3fbfb-0738-47ae-b08b-764601b96ef1`
- Digest: `9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL`
- Payout: `0.10 USDC`, category `events`
- Recipient: `0x7f696478ae487ae2fce37c0ea8584f9af38154f0b14a459675bc3822af4564ea`
- Before: `1.00 allocated / 0.10 spent / 0.90 remaining USDC`
- After: `1.00 allocated / 0.20 spent / 0.80 remaining USDC`
- Attempts: one total, one confirmed, zero active
- Hard refresh: remained Paid with the same digest, no Pay button, no wallet prompt, and no new attempt

Detailed evidence is in `docs/STAGE7C_LIVE_REHEARSAL.md`. The accepted Stage 6 proof is in `docs/STAGE6_LIVE_VALIDATION.md` with digest `DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7`.

## No-spend backup demo

If Gemini, Supabase, Sui RPC, the wallet provider, Vercel, or venue internet is unreliable:

1. Show locally retained public/synthetic screenshots or the short backup recording.
2. Label AI output as deterministic mock when mock mode is shown.
3. Walk through the stored claim evidence, deterministic checks, and human approval boundary.
4. Show the immutable payout snapshot and explain that wallet signing is explicit and owner-controlled.
5. Show the Stage 7C Paid screen/explorer capture and public digest rather than submitting another payout.
6. Show the refresh capture and explain one-attempt/digest-first reconciliation.
7. Use the architecture diagram in `docs/ARCHITECTURE.md` to explain why AI is useful and why Sui is integral.

## Owner screenshot/video checklist

The owner should capture and verify these locally before the pitch. Check an item only when the actual artifact exists and is readable.

- [ ] Production landing/dashboard with the product purpose visible
- [ ] Live persisted Treasury and `events` category with current balance
- [ ] Synthetic claim review and human approval boundary, with private/personal receipt data excluded
- [ ] Approved-unpaid immutable payout snapshot / Ready state
- [ ] Stage 7C Paid state with digest
- [ ] Sui Testnet explorer success and exact payout event
- [ ] Hard-refresh result still Paid with the same digest and no Pay action
- [ ] `/api/health` response showing only the non-secret readiness contract
- [ ] Architecture responsibility diagram
- [ ] A short 3–5 minute backup recording following `docs/STAGE7_DEMO_RUNBOOK.md`

## Capture hygiene

- Use only synthetic receipts and deliberately public Testnet identifiers.
- Crop browser chrome, notifications, wallet balances/accounts not needed for the story, and provider dashboards.
- Never capture an environment-variable screen, private Storage URL, auth token, signed transaction bytes, QR recovery export, private key, or seed phrase.
- Review every frame before upload. If sensitive material appears, discard that artifact and capture it again safely.
- Store owner-only source media outside the repository unless the team intentionally selects sanitized public assets for Stage 8.

## Presenter fallback order

1. live production app with no new payout
2. locally saved screenshots of the verified Stage 7C flow
3. short backup recording
4. public Testnet digest/package/Treasury evidence plus architecture explanation

The fallback is evidence of a previously verified live flow. It must never be described as a new live transaction.
