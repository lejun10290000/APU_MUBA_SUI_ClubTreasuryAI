# Stage 7A — Vercel deployment baseline

Stage 7 remains **CURRENT**. This document records the repository-side deployment baseline only; it does not prove that a Vercel deployment, Supabase connection, wallet session, or Sui payout has occurred.

## Safety boundary

- Never paste keys, tokens, private keys, seed phrases, or signed transaction material into source control, chat, or browser-visible variables.
- All normal CI and smoke checks use `AI_MODE=mock`, `GEMINI_LIVE_REQUESTS_ENABLED=false`, and make no live Gemini request or Sui payout.
- A production deployment is not a reason to press a payout action. The owner remains the only party who can connect the wallet and approve a signature.

## Vercel environment matrix

| Variable                                  | Vercel setting                                                                   | Visibility           | Notes                                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| `APP_ENV`                                 | `production`                                                                     | Server configuration | Enables production URL validation.                                                                     |
| `NEXT_PUBLIC_APP_URL`                     | Exact deployed HTTPS origin                                                      | Public               | Required in production; cannot be localhost or HTTP because wallet challenge validation uses its host. |
| `AI_MODE`                                 | `mock` for normal deployment/rehearsal                                           | Server configuration | Set `live` only for owner-approved Gemini validation/demo.                                             |
| `GEMINI_LIVE_REQUESTS_ENABLED`            | `false` normally                                                                 | Server configuration | Set true only together with explicit owner approval and live mode.                                     |
| `GEMINI_API_KEY`                          | Owner-entered only when live Gemini is intended                                  | Server-only secret   | Never use a `NEXT_PUBLIC_` name.                                                                       |
| `GEMINI_MODEL`                            | `gemini-2.5-flash`                                                               | Server configuration | Optional; default is the documented model.                                                             |
| `NEXT_PUBLIC_CLAIM_DATA_MODE`             | `live` for a persisted Supabase demo; `mock` for safe UI-only rehearsal          | Public               | Live mode requires all three Supabase settings below.                                                  |
| `NEXT_PUBLIC_SUPABASE_URL`                | Intended project URL                                                             | Public               | Browser/SSR endpoint, not a secret.                                                                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`    | Intended browser publishable key                                                 | Public               | Deliberately browser-visible; do not substitute a server secret.                                       |
| `SUPABASE_SECRET_KEY`                     | Owner-entered                                                                    | Server-only secret   | Required for private receipt administration in live claim mode.                                        |
| `SUPABASE_RECEIPTS_BUCKET`                | `receipts` unless the provisioned private bucket differs                         | Server configuration | Bucket must remain private and match the Supabase project.                                             |
| `NEXT_PUBLIC_SUI_NETWORK`                 | `testnet`                                                                        | Public               | The app accepts Testnet only.                                                                          |
| `NEXT_PUBLIC_SUI_RPC_URL`                 | Testnet RPC endpoint                                                             | Public               | Default is the public Testnet fullnode endpoint.                                                       |
| `NEXT_PUBLIC_SUI_PACKAGE_ID`              | `0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f`             | Public               | Required to enable payout construction/reconciliation.                                                 |
| `NEXT_PUBLIC_SUI_TREASURER_CAP_OBJECT_ID` | `0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101`             | Public               | Clean Stage 6 Cap; the browser checks it before signing.                                               |
| `NEXT_PUBLIC_SUI_USDC_COIN_TYPE`          | `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC` | Public               | Native Circle Sui Testnet USDC.                                                                        |
| `NEXT_PUBLIC_DEMO_TREASURY_OBJECT_ID`     | `0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3`             | Public               | Clean Stage 6 Treasury baseline; do not substitute the historical Stage 3 object.                      |

`NEXT_PUBLIC_SUI_EXPLORER_TX_URL` is retained in `.env.example` but is not consumed by the application; transaction links currently use the fixed Testnet explorer helper. It need not be configured in Vercel.

## Owner-only Vercel and Supabase procedure

1. In Vercel, import the repository and allow the detected Next.js/pnpm build configuration. Do not upload `.env.local`.
2. Enter the matrix values in the intended Preview/Production environments. Enter only server-only secrets in Vercel's protected environment-value UI.
3. For a live-claims rehearsal, the owner confirms the intended Supabase project has the Stage 5/6 migrations, RLS policies, anonymous sign-ins enabled for the wallet-identity bridge, and a private `receipts` bucket. In Supabase Auth URL Configuration, set the Site URL to the exact production HTTPS origin and allow only the production/Preview origins actually used by the team. The owner then sets live claim mode plus the URL, publishable key, secret key, and bucket name.
4. Redeploy after changing any `NEXT_PUBLIC_*` value because browser values are embedded at build time.
5. Keep Gemini mock/disabled until the owner deliberately enables the live guard and key for a bounded validation. Never use a live API key in CI or routine Playwright runs.

## Post-deploy health verification

Request `https://<deployed-origin>/api/health`. The route is dynamic and sends `Cache-Control: no-store`; it makes no Supabase, Gemini, or Sui request. It returns only this non-secret shape:

```json
{
  "ok": true,
  "ready": true,
  "service": "clubtreasury-ai",
  "stage": 7,
  "readiness": {
    "ai": {
      "mode": "mock",
      "liveRequestsEnabled": false,
      "apiKeyConfigured": false
    },
    "claims": { "mode": "mock", "supabaseConfigured": false },
    "sui": { "network": "testnet", "packageConfigured": true }
  }
}
```

`ready` is true only when the selected AI and claims modes have their required configuration and the Sui package is configured. The nested booleans show configuration presence only; they do not prove external connectivity, wallet ownership, balances, database migrations, or payout safety. The response never includes a Gemini key, Supabase secret, or any secret value.

## No-live-payout validation

Run the repository checks with mock mode first. For local smoke alongside an existing app on port 3000, select an unused port:

```powershell
$env:PLAYWRIGHT_PORT = "3100"
corepack pnpm test:e2e:smoke
```

The Playwright web server receives the same `PORT` and uses its isolated `.next-playwright` output directory, so it does not stop or lock an active port-3000 development server. Its smoke check verifies the Stage 7 health contract. It does not connect a wallet, submit a live claim, call Gemini, or broadcast a Sui transaction.

Only after the owner completes the separate Stage 7 rehearsal preflight may a human inspect the clean Treasury/Cap, confirm Testnet SUI/USDC, and explicitly sign one intended payout. Never use a health response as payment authorization.

## Rollback and recovery

- If deployment configuration is wrong, remove/correct the affected Vercel environment value and redeploy the last verified application revision. Do not copy secrets into repository files to troubleshoot.
- If a `NEXT_PUBLIC_*` value is wrong, rebuild/redeploy after correction; browser bundles do not update from a server-only redeploy.
- If Supabase or Gemini is unavailable, keep the demo in mock mode or follow the existing manual Review fallback; do not bypass human approval.
- If a payout has been signed, broadcast, or is ambiguous, preserve its digest and use the existing reconciliation path. Do not sign a replacement transaction or reset the corresponding records as a rollback action.
- Rollback does not restore Testnet funds or reverse an on-chain payment. Create a fresh demo scenario only through the documented reset/rehearsal process.
