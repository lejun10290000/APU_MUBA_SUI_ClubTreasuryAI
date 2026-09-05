# Stage 8 A2-Lite — Owner Deployment and Demo Runbook

This runbook contains owner-controlled actions. Coding agents must stop before migration, production configuration, wallet signing, funding, payout, or merge unless the owner separately authorizes that exact gate.

## Reviewed deployment sequence

1. Review the exact A2 pull-request head and `supabase/migrations/20260905030000_stage8_a2_live_treasury_activation.sql`.
2. Obtain explicit owner authorization to apply that migration.
3. Apply it once through the authenticated Supabase migration workflow and record/verify migration history. Never reapply A1.
4. Merge and deploy only the reviewed exact head after separate owner merge approval.
5. In Vercel Production, set `AI_MODE=live`.
6. Set `GEMINI_LIVE_REQUESTS_ENABLED=true`.
7. Set `GEMINI_API_KEY` as a server-only Vercel secret. Never place it in chat, source, logs, or a `NEXT_PUBLIC_` variable.
8. Redeploy and verify `/api/health` reports live mode, live requests enabled, and API key configured without exposing the key.
9. Run the A2 smoke acceptance first: create a 1.00 USDC workspace and pay one 0.01 USDC synthetic claim.
10. Verify the exact Explorer digest, persisted Paid History row, budget delta, and unchanged Stage 7C evidence.
11. Only after smoke success, record the demo with `APU Event Demo`: 10.00 USDC budget and one 0.10 USDC payout.
12. Reserve enough Circle Testnet USDC and SUI gas for the presentation wallet.
13. On judge day, create `APU Event Live` fresh with 10.00 USDC and one 0.10 USDC payout.

## Safety checklist

- Human wallet signs every Create, Fund, Allocate, and Pay transaction.
- AI is advisory and never authorizes, signs, or pays.
- A saved or ambiguous digest is reconciled; it is never blindly retried.
- Confirm the wallet, Testnet network, exact workspace Treasury, and workspace TreasurerCap before signing.
- Never modify or replace historical Stage 6/7 evidence.
- Stop immediately if Supabase and Sui state differ.
