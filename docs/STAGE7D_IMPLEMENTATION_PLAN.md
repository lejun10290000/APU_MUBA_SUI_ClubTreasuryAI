# Stage 7D Implementation Plan — Final Reliability Hardening

Status: **TASKS 1–5 COMPLETE; TASK 6 LOCAL GATES PASS — PR CI/OWNER MERGE PENDING**

Branch: `stage7/final-reliability-hardening`

Base commit: `bd7f52bc75a35483ea672e73d675a87ea5328fa6`

## Scope and safety boundary

Stage 7A deployment, Stage 7B pre-sign consistency protection, and Stage 7C live rehearsal are accepted evidence. Stage 7D will harden and document the existing MVP; it will not add product scope, create another Treasury, call live Gemini, sign with a wallet, submit a Sui transaction, or alter successful/failed historical payment evidence.

Owner-only actions remain:

- wallet authentication or transaction signatures in production
- any live Sui transaction, Treasury creation/funding/allocation, or payout
- Gemini live-mode enablement or request
- production secret entry, rotation, or provider-setting mutation
- creation of private screenshots/video containing authenticated data
- final merge of the Stage 7D pull request

## Verified starting baseline

- PR #26 is merged; its exact head passed GitHub Actions CI run #137.
- The local branch starts from PR #26 merge commit `bd7f52b` and the working tree was clean.
- GitHub reports no open pull requests or issues in this repository at the audit time.
- CI forces `AI_MODE=mock`, `GEMINI_LIVE_REQUESTS_ENABLED=false`, and Testnet; it installs with the frozen lockfile and runs lint, typecheck, unit tests, build, and Playwright smoke.
- `/api/health` is cache-disabled and reports configuration presence without contacting Gemini, Supabase, or Sui. The previously verified production contract is `ok=true`, `ready=true`, `stage=7`, claims live/configured, AI mock/live-disabled, and Sui Testnet/package-configured. A fresh read-only production check remains part of Task 6.
- Stage 7C preserved one confirmed `0.10 USDC` payout for claim `69a20a42-ae58-4547-b2f5-28bb2de52262`, attempt `fae3fbfb-0738-47ae-b08b-764601b96ef1`, and digest `9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL`. The final `events` balance is `1.00 allocated / 0.20 spent / 0.80 remaining`.
- The current payment path uses the immutable `approved_*` snapshot, a one-active-attempt database boundary, server-side Supabase-to-Sui preflight, TreasurerCap ownership verification, client wallet signing, digest persistence before broadcast, exact-event finality verification, and same-digest reconciliation.
- Existing tests already cover the main immutable-snapshot, preflight-before-sign, wallet rejection, digest-first, ambiguous broadcast, event mismatch, wrong object/type, insufficient balance, paid-refresh, receipt validation/duplicate, AI failure/manual Review, and canonical wallet-principal behaviors.

## Audit findings and highest-value risks

1. **Successful-chain digest mismatch is classified terminally.** `reconcilePaymentAttempt` currently marks an attempt `failed` when a success-shaped provider result carries a different digest. A success/identity inconsistency is not proof that no funds moved; releasing the active attempt could permit a blind replacement. It must remain `reconciliation_required` and retain the attempt boundary.
2. **Receipt-preview failure can hide an otherwise authorized claim.** The claim GET route creates the private signed preview URL in the same failure boundary as loading the claim. A transient Storage/signing error therefore prevents the treasurer from reviewing persisted claim data. Claim data should remain available with an explicit preview warning; authorization must not be bypassed.
3. **Recovery guidance is too generic.** Payment and live-workspace UI exposes errors, but it does not consistently distinguish reconnect/authenticate, retry a read-only load/preflight, reconcile an existing digest, or stop for configuration/admin help. The payout path must never suggest a new signature after ambiguity.
4. **Live-workspace recovery requires a page/account lifecycle change.** A transient authentication/Supabase failure shows an error but has no explicit safe read-only retry action. A small retry control would reduce demo disruption without changing authorization.
5. **Final public evidence and runbooks are incomplete.** The repository needs a concise operator runbook, a truthful backup-evidence checklist, a secret/finality audit record, and a final readiness decision tied to fresh verification.

## Recovery verification matrix

| Area            | Scenario                                                        | Required safe result                                                 | Current evidence / Stage 7D action                                        |
| --------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Wallet          | disconnected or wrong network                                   | explain connect/switch; no prepare/sign                              | existing guards; confirm tests/UI wording                                 |
| Wallet auth     | message rejected/cancelled or session refresh                   | explain authentication retry; no claim mutation                      | add/confirm component coverage and recovery copy                          |
| Wallet identity | fresh anonymous session                                         | resolve canonical verified wallet principal without weakening RLS    | existing Stage 7C tests/migration; retain                                 |
| Authorization   | non-member/non-treasurer                                        | fail closed with setup/admin guidance                                | existing server membership check; document/cover response behavior        |
| Workspace       | Supabase/auth/transient load failure                            | persisted state unchanged; allow read-only retry                     | add focused UI regression and minimal retry control                       |
| Receipt         | invalid/oversized/unsupported/upload failure/duplicate          | reject or Review before payment; explain retry safety                | existing domain/workflow coverage; fill only material gaps                |
| Receipt preview | signed-URL/authorization failure                                | claim stays reviewable; preview stays unavailable; no RLS bypass     | RED/GREEN route/component tests and minimal warning                       |
| AI              | throw/invalid/ambiguous/mismatch                                | deterministic manual Review; never approve/pay automatically         | existing workflow tests; confirm mock-only                                |
| Pre-sign        | DB/Sui Treasury/category/custody mismatch or insufficient funds | stop before `sign()`; read-only refresh/reconcile guidance           | existing Stage 7B coverage; add wording assertions if changed             |
| Capability      | missing/wrong type/wrong owner/wrong Treasury                   | stop before `sign()`                                                 | existing verification and client ordering; confirm focused coverage       |
| Signing         | wallet cancels/build/sign fails before digest                   | no persistence/broadcast; safe explicit retry only after cause fixed | existing client-flow coverage; clarify UI guidance                        |
| Submission      | timeout after digest persistence                                | reconcile same digest; never sign replacement                        | existing client-flow coverage; retain                                     |
| Finality        | success but evidence unavailable/mismatched                     | reconciliation-required; active digest retained                      | fix digest-mismatch terminal classification with TDD; retain event checks |
| Paid refresh    | already paid/repeated reconcile                                 | same digest, no Pay action, no new attempt/signature                 | existing UI/repository evidence; confirm regression                       |

## Planned implementation checkpoints

### Task 2 — Failure/recovery hardening

Use regression-first tests for every behavior change. Likely affected files:

- `src/lib/payments/contracts.ts`
- `tests/unit/stage6-payment-api-contracts.test.ts`
- `app/api/claims/[claimId]/route.ts`
- `src/lib/claims/receipt-url.ts` only if a smaller error contract is required
- new or existing claim-route/component unit tests
- `src/components/live-claim-submission-form.tsx`
- `tests/unit/live-claim-submission-auth.test.tsx`
- `src/components/claim-payout-panel.tsx`
- `tests/unit/claim-payment-ui.test.tsx`

### Task 3 — Demo UX/recovery polish

Keep the current design. Add only tested recovery actions/copy required by Task 2 findings, verify object/digest wrapping and normal laptop/mobile smoke behavior, and avoid a redesign.

### Task 4 — Deterministic runbook and backup evidence

Create `docs/STAGE7_DEMO_RUNBOOK.md` and `docs/STAGE7_BACKUP_EVIDENCE.md`. Reference accepted public evidence; do not fabricate screenshots, expose private receipts, or make a new payout.

### Task 5 — Repository/secret/finality audit

Audit tracked files and history without printing matched values. Verify ignore/env/CI/RLS/payment invariants and that the Move package still matches its Stage 3 source history. Record only sanitized categories, paths, and pass/fail conclusions.

### Task 6 — Full verification and exit decision

Update `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`, `docs/DEVELOPMENT_STAGES.md` if the gate passes, `README.md`, this plan, and `docs/STAGE7_FINAL_READINESS.md`. Stage 7 remains CURRENT unless every exit item has fresh evidence.

## Exit criteria

- failure/recovery matrix is covered by existing or new focused tests and truthful documentation
- ambiguous or success-shaped outcomes can never release the active attempt for a replacement signature
- claim review remains useful when only private preview generation fails
- user-facing recovery text distinguishes safe read-only retry, wallet reconnection/authentication, same-digest reconciliation, and owner/admin setup
- backup demo path uses accepted evidence and spends no additional Testnet funds
- tracked files/history pass a sanitized secret audit; RLS, mock CI, Move source, and Stage 6/7B safety invariants remain intact
- fresh install, lint, typecheck, unit, build, and Playwright smoke checks pass on the final head
- exact-head GitHub CI passes and a final diff review finds no scope/safety regression
- Stage 7 documentation reflects only evidence actually obtained

## Verification commands

Use the pinned Node/pnpm toolchain with live integrations disabled:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm test:e2e:smoke
```

Run focused Vitest files during RED/GREEN cycles. Run `sui move test` only if the installed CLI is available; never publish or execute a transaction. The production check is a read-only GET of `/api/health`.

## Execution record

- Task 1: baseline audit/plan — complete
- Task 2: failure/recovery hardening — complete with regression-first RED/GREEN evidence
- Task 3: demo UX/recovery polish — complete; 7/7 Playwright smoke passed
- Task 4: no-spend demo runbook/evidence checklist — complete
- Task 5: sanitized repository/secret/finality audit — complete
- Task 6 local gates: frozen install, lint, typecheck, 41 files / 201 unit tests, build, 7/7 Playwright, production health, and read-only Testnet state — pass
- Remaining: push draft PR, exact-head GitHub CI, final diff review, ready-for-review transition, and explicit owner merge decision
