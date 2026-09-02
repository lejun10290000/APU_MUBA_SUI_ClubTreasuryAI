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
Treasury: 0x8971fa3e32994b81396122c3e3b1a4b054c3e3799714f5c2206dd037054319e4
TreasurerCap: 0x86343cc7af70e9524df589193332c35ed3f9e83f877c7e8ac2a8ee230612b6c7
Publish digest: DdQQEcGD8FWmAde2rziBDjwua5CjcwRUtfN4p2Lkoeb
```

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

Automated verification:

- SDK pinned at `@google/genai` `2.19.0`
- mock mode selects the deterministic adapter without constructing a Gemini client
- live client creation is lazy and blocked by the explicit guard/key checks
- every model response is parsed and Zod-validated before application use
- invalid or unavailable AI fails safely for manual review
- 87 unit tests, production build, and 7 Playwright smoke tests pass in mock mode

Exit criteria: **VERIFIED** — mock mode remains default; the owner explicitly validated one live structured budget parse and one live in-memory synthetic receipt extraction with `gemini-2.5-flash`; missing currency correctly required human review; configuration returned to mock mode; deterministic financial rules remained authoritative.

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

Implementation status: **COMPLETE**. Local automated/browser verification and the owner-controlled live Supabase acceptance gate passed. A member submitted synthetic receipts, the treasurer reopened and decided the persisted claim, the immutable payout snapshot was verified, all seven negative checks passed, and no wallet/Sui payout action occurred. PR #18 merged the stage into `main` at `8212881d5e8f999180700d96e3722a5313d1885c`.

Exit criteria: **VERIFIED** — a member submitted a claim/receipt and the treasurer received and persisted a validated recommendation and human decision without automatic money movement.

## Stage 6 — Human approval and on-chain payment — CURRENT

Goal: connect persisted claim approval to the already verified Sui payout foundation.

Required work:

- [x] claim-linked Sui transaction construction
- [x] wallet confirmation/signature boundary
- [x] Move payout re-check
- [x] Testnet USDC payout construction/submission
- [x] transaction finality/status handling
- [x] transaction digest/explorer link
- [x] digest-first database synchronization and retry protection
- [x] remaining budget changes only after verified on-chain success
- [x] successful-but-unverifiable transaction outcomes remain `reconciliation_required` and block blind replacement signing
- [x] Sui payout-event category parsing accepts both UTF-8 string and byte-array `vector<u8>` JSON representations
- [ ] fresh owner-controlled end-to-end acceptance proving exactly one payout and idempotent same-digest reconciliation

Current boundary: the first owner-controlled Stage 6 live acceptance on `stage6/approved-claim-payout` exposed a duplicate-payout defect. A successful Testnet transaction whose event category could not be parsed was incorrectly classified as failed, which released the active-attempt boundary and allowed a second signed payout for the same claim. The affected live claim and both public transaction digests are preserved as failed-acceptance evidence and must not be reused. The repair now accepts the observed Sui category representation and treats successful-but-unverifiable evidence as non-terminal reconciliation-required, keeping the existing digest active and blocking blind retry. GitHub CI run #80 passes lint, strict TypeScript, 169 unit tests, production build, and 7/7 Playwright smoke tests. Stage 6 remains CURRENT until a fresh clean treasury/category/claim with aligned on-chain and database state proves exactly one payout, paid-state synchronization, and idempotent refresh/reconciliation without a second wallet signature.

Exit criteria: the full core payment workflow works end to end, retries cannot produce an uncontrolled second payout, ambiguous/successful-but-unverifiable outcomes remain tied to the existing digest, and AI cannot bypass human approval.

## Stage 7 — Demo hardening and deployment — NOT STARTED

Goal: make the live demo reliable under hackathon conditions.

Required work includes web deployment, demo persistence/storage setup, clean Testnet assets, seeded scenario, repeated full-flow rehearsals, failure handling, loading/error polish, backup screenshots/video, and secret-history verification.

## Stage 8 — Submission and pitch — NOT STARTED

Goal: satisfy all official requirements and optimize both Sui pitches.

Required work includes final README/team/AI disclosures, real Sui IDs, screenshots/live URL, 3–5 minute video, Devfolio submission, and rehearsed Payments & Stablecoins plus AI × Sui pitches.

## Stage update rule

A stage may be marked `COMPLETE` only when its exit criteria have been verified. UI mocks, placeholders, fake transaction IDs, and untested integrations do not count.

Every development PR/commit must update:

1. `docs/PROJECT_STATUS.md`
2. this file if stage status changed
3. `docs/ROADMAP.md`
4. affected setup/architecture docs
