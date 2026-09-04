# ClubTreasury AI — Development Stages

This file defines the official implementation stages for the hackathon project. Every teammate and coding agent must use these stages when reporting progress.

## Status labels

- `COMPLETE` — acceptance criteria are verified and merged/ready to merge.
- `CURRENT` — the team is actively working on this stage.
- `NOT STARTED` — no implementation should be claimed yet.
- `BLOCKED` — work cannot continue until the listed blocker is resolved.

## Stage 0 — Planning and repository setup — COMPLETE

Goal: create a clean hackathon repository and lock the project concept, requirements, architecture, AI cost policy, and team/agent workflow.

Exit criteria: planning docs exist, hackathon requirements are recorded, and implementation stages are defined.

## Stage 1 — Application foundation — COMPLETE

Goal: create a reproducible, testable application scaffold without business features.

Verified exit criteria include frozen dependency install, lint, strict typecheck, unit tests, production build, Playwright smoke, CI without Gemini credentials, centralized environment validation, mock-first AI service boundaries, Sui/Supabase boundaries, and integer/minor-unit money helpers.

## Stage 2 — Core UI and deterministic domain rules — COMPLETE

Goal: create the main club-treasury UX with mock/demo data and implement hard financial rules before live AI or blockchain integration.

Verified exit criteria include the navigable mock workflow, safe integer/minor-unit money handling, budget-total/category-remaining rules, receipt comparison, exact/similar duplicate helpers, advisory recommendations, human decisions, and automated/browser coverage without fake Sui evidence.

## Stage 3 — Sui foundation and Move treasury — COMPLETE

Goal: make Sui integral to custody, authorization, and payout enforcement.

Implemented and verified:

- Sui Testnet wallet connection and network guard
- Move package and 31/31 Move tests
- shared `Treasury<Asset>` state
- address-owned `TreasurerCap<Asset>` authorization
- generic typed funding/deposit custody
- one-time exact category allocation confirmation
- category `allocated` / `remaining` state
- treasurer-authorized payout with category/custody invariant checks
- typed payout event
- application transaction/error/finality handling
- real Sui Testnet package deployment
- native Circle Testnet USDC integration
- real browser-wallet signing
- real package, treasury, capability, and publish identifiers
- real create → fund → allocate → payout flow
- confirmed explorer evidence for all four app transactions
- post-payout treasury refresh proving `1.00 USDC → 0.90 USDC` remaining after a `0.10 USDC` payout

Verified deployment:

```text
Package: 0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f
Historical Stage 3 Treasury: 0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4
Historical Stage 3 TreasurerCap: 0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7
Publish digest: DdQQEcGD8FWmAde2rziBDjwua5CjcwRUtfN4p2Lkoeb
```

The historical Stage 3 Treasury/Cap remain valid Stage 3 evidence but are no longer the clean Stage 7 demo defaults because the treasury was later used by failed Stage 6 acceptance attempts.

Exit criteria: **VERIFIED** — a treasurer funded a real Testnet treasury and executed a verified test payout with public Sui evidence.

## Stage 4 — Gemini AI layer — COMPLETE

Goal: add Gemini for unstructured budget and receipt understanding while keeping routine development mock-first.

Required work:

- [x] official `@google/genai` SDK
- [x] live `GeminiAIService` behind the existing `AIService` interface
- [x] structured budget parser
- [x] structured receipt/image extraction
- [x] category suggestion and concise reasons
- [x] server-side validation of model output
- [x] billing/live-call guardrails from `docs/AI_USAGE_POLICY.md`
- [x] zero-live-call fake-client fixture/test set
- [x] explicit owner-controlled live quality validation for budget and synthetic receipt inputs

Exit criteria: **VERIFIED** — mock mode remains default; the owner explicitly validated live structured budget parsing and synthetic receipt extraction with `gemini-2.5-flash`; deterministic financial rules remained authoritative.

## Stage 5 — Claim and receipt workflow integration — COMPLETE

Goal: connect private receipt storage, claim persistence, AI extraction, deterministic checks, and review states.

Required work:

- [x] Supabase schema/migrations
- [x] private receipt bucket policy
- [x] secure receipt upload adapter
- [x] receipt byte hashing and immutable evidence metadata
- [x] persisted treasury/category/claim relationship
- [x] submission idempotency and exact/similar duplicate checks
- [x] mock/live AI through the shared adapter
- [x] deterministic budget/evidence checks
- [x] Approve / Review / Reject recommendation assembly
- [x] manual Review fallback on AI failure
- [x] persisted human Approve/Reject decision
- [x] immutable approved-but-unpaid Stage 6 payout snapshot
- [x] owner-controlled live Supabase acceptance gate

Implementation status: **COMPLETE**. Local automated/browser verification and the owner-controlled live Supabase acceptance gate passed. PR #18 merged the stage into `main` at `8212881d5e8f999180700d96e3722a5313d1885c`.

Exit criteria: **VERIFIED** — a member submitted a claim/receipt and the treasurer received and persisted a validated recommendation and human decision without automatic money movement.

## Stage 6 — Human approval and on-chain payment — COMPLETE

Goal: connect persisted human approval to the verified Sui payout foundation without allowing AI or retry ambiguity to create uncontrolled payments.

Required work:

- [x] claim-linked Sui transaction construction from immutable `approved_*` fields only
- [x] explicit wallet confirmation/signature boundary
- [x] Move payout authorization/category/custody re-check
- [x] Testnet USDC payout construction/submission
- [x] transaction finality/status handling
- [x] transaction digest/explorer evidence
- [x] digest-first database synchronization and retry protection
- [x] remaining budget changes only after verified on-chain success
- [x] one-active-payment-attempt boundary per claim
- [x] successful-but-unverifiable outcomes remain `reconciliation_required` and block blind replacement signing
- [x] canonical `PayoutEvent` BCS verification with compatibility handling for Sui JSON representations
- [x] live claim workspace sourced from persisted Supabase treasury/category data
- [x] owner-controlled clean end-to-end acceptance proving exactly one payout and idempotent same-digest refresh

The first owner-controlled acceptance exposed a duplicate-payout defect and is preserved as failed evidence. The repaired flow was then tested with a fresh aligned treasury/category/claim.

Verified clean acceptance:

```text
Treasury: 0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3
TreasurerCap: 0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101
Category: events
Approved payout: 0.10 USDC
Confirmed digest: DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7
Payment attempts: exactly 1
Final budget: 1.00 allocated / 0.10 spent / 0.90 remaining
```

Refreshing the paid claim preserved the same digest and did not show another payment action or request another wallet signature.

PR #20 merged Stage 6 into `main` at `61fb9c86f5077f9813add6dc94aa69b311aaf4d7`. The exact merged commit then passed GitHub CI with **171/171 unit tests**, production build, lint/typecheck, and **7/7 Playwright smoke tests**.

Exit criteria: **VERIFIED** — the full payment workflow works end to end, retry ambiguity cannot blindly create a replacement transaction, paid/budget state follows verified on-chain evidence, and AI cannot bypass human approval.

## Stage 7 — Demo hardening and deployment — COMPLETE

Goal: make the verified core MVP reliable under hackathon conditions and accessible as a deployed demo.

Required work:

- [x] deploy the Next.js app to Vercel
- [x] configure production environment variables and Supabase safely
- [x] verify the clean Sui Testnet demo Treasury/Cap and sufficient Testnet assets
- [x] define a deterministic reset/seed process for repeated rehearsals
- [x] exercise the complete deployed end-to-end flow
- [x] harden loading/error/recovery UX for Gemini, Supabase, wallet, and Sui failures
- [x] verify paid-state refresh/reconciliation remains idempotent after deployment
- [x] prepare backup evidence/runbook and an owner screenshot/video capture checklist
- [x] verify repository/secret safety before submission
- [x] pass exact-head Stage 7D PR CI and receive owner merge approval

Exit criteria: **a public deployment is reachable and the full demo can be repeated reliably from known state with understandable recovery paths, sufficient Testnet assets, and backup evidence.**

Stage 7D was merged to `main` and exact-head GitHub Actions run #140 passed. The deployed workflow, recovery paths, public proof, and repository security checks are verified.

## Stage 8 — Submission and pitch — CURRENT

Goal: satisfy all official requirements and optimize both Sui pitches.

Required work includes final README/team/AI disclosures, screenshots/live URL, 3–5 minute video, Devfolio submission, and rehearsed Payments & Stablecoins plus AI × Sui pitches.

Submission-facing UI refinement is complete. The final narrated MP4 is rendered locally; public video upload, pitch preparation, and final Devfolio submission remain.

## Stage update rule

A stage may be marked `COMPLETE` only when its exit criteria have been verified. UI mocks, placeholders, fake transaction IDs, and untested integrations do not count.

Every development PR/commit must update:

1. `docs/PROJECT_STATUS.md`
2. this file if stage status changed
3. `docs/ROADMAP.md`
4. affected setup/architecture/demo docs
