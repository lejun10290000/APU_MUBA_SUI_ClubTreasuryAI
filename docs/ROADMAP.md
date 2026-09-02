# ClubTreasury AI — Hackathon Roadmap

This roadmap follows `docs/DEVELOPMENT_STAGES.md`. Finish demo-critical work before optional features.

## Stage 0 — Planning and repository setup — COMPLETE

- [x] Clean hackathon repository
- [x] README, AGENTS.md, contribution guide, hackathon requirements
- [x] Product specification, architecture, tech stack, demo plan
- [x] Gemini mock-first billing policy
- [x] Staged-development + project-status handoff process
- [ ] Add all official team members *(Stage 8 submission item)*

## Stage 1 — Application foundation — COMPLETE

- [x] Next.js / React / strict TypeScript foundation
- [x] pnpm lockfile and pinned runtime/tooling
- [x] Tailwind, Zod, React Hook Form, Sui SDK/dApp Kit
- [x] Vitest, RTL, Playwright, CI
- [x] centralized environment validation
- [x] mock-first AI service boundary
- [x] Sui/Supabase service boundaries
- [x] deterministic fixtures and integer/minor-unit money helpers
- [x] health/loading/error foundations
- [x] verification suite and CI

## Stage 2 — Core UI and deterministic domain rules — COMPLETE

- [x] Landing/login/dashboard shell
- [x] Treasury/event creation UI
- [x] Editable category budget workflow
- [x] Claim submission/review/history shell
- [x] Shared Zod schemas
- [x] Safe integer/minor-unit totals
- [x] Budget/category checks
- [x] Receipt/request comparison
- [x] Exact/similar duplicate helpers
- [x] Advisory recommendation + human decision flow
- [x] Unit/browser coverage
- [x] Clearly labeled mock/demo data

## Stage 3 — Sui foundation and Move treasury — COMPLETE

- [x] Wallet Standard-compatible Sui Testnet connection and network guard
- [x] Typed create/fund/confirm/payout transaction builders
- [x] Wallet/build/execution/finality error handling
- [x] Project-owner manual QA with a real Testnet browser wallet
- [x] Move package structure
- [x] Shared treasury object/state
- [x] Treasurer capability authorization
- [x] Generic deposit/funding custody
- [x] Confirmed category allocation state
- [x] Approved payout flow
- [x] On-chain category remaining / custody invariant checks
- [x] Typed payout events
- [x] 31/31 Move tests
- [x] Deploy package to Sui Testnet
- [x] Record verified package, Treasury, TreasurerCap, UpgradeCap and publish digest
- [x] Load native Circle Testnet USDC metadata/owned coin data
- [x] Real create → fund 1.00 USDC → allocate 1.00 USDC → payout 0.10 USDC flow
- [x] Confirm all four transaction evidence links
- [x] Refresh treasury and verify 0.90 USDC remaining

## Stage 4 — Gemini AI layer — COMPLETE

- [x] Add official `@google/genai` SDK
- [x] Add live `GeminiAIService` behind existing `AIService`
- [x] Define structured budget output
- [x] Build natural-language budget parser
- [x] Define structured receipt output
- [x] Build receipt/image extraction
- [x] Add category suggestion + concise reasons
- [x] Validate all model output server-side
- [x] Enforce `docs/AI_USAGE_POLICY.md`
- [x] Verify live Gemini with small explicit fixture set only

## Stage 5 — Claim and receipt workflow integration — COMPLETE

- [x] Create Supabase migrations
- [x] Configure private receipt bucket policy
- [x] Secure receipt upload + hash receipt bytes
- [x] Persist treasury/category relationships, claims, and AI review results
- [x] Add submission idempotency and exact/similar duplicate checks
- [x] Run mock/live AI through shared adapter
- [x] Apply deterministic budget/evidence checks
- [x] Return Approve / Review / Reject with understandable reasons
- [x] Manual Review fallback when AI fails
- [x] Persist human Approve/Reject decisions
- [x] Persist immutable `approved_*` snapshot while payment remains unpaid
- [x] Verify mock-mode workflow with unit, build, and Playwright coverage
- [x] Apply migration and complete the real Supabase/synthetic-receipt acceptance gate
- [x] Review Supabase security/performance advisors after live migration

## Stage 6 — Human approval and on-chain payment — COMPLETE

- [x] Review and approve `docs/STAGE6_IMPLEMENTATION_PLAN.md`
- [x] Build payout action from immutable approved snapshot only
- [x] Connect human approval to Sui payout transaction
- [x] Require explicit treasurer wallet signature
- [x] Move payout re-checks category budget/custody
- [x] Implement Testnet USDC payout construction/submission
- [x] Handle finality/status and same-digest reconciliation
- [x] Update claim/budget only after verified on-chain success
- [x] Show transaction digest/explorer evidence after confirmation
- [x] Add digest-first synchronization/retry protection
- [x] Treat successful-but-unverifiable evidence as reconciliation-required and block blind replacement signing
- [x] Verify canonical `PayoutEvent` BCS with safe JSON compatibility handling
- [x] Load persisted live Supabase treasury/category values in the live claim form
- [x] Preserve failed first live acceptance as incident evidence
- [x] Repeat owner-controlled live acceptance with a fresh clean aligned claim/treasury
- [x] Prove exactly one 0.10 USDC payout, one attempt, synchronized paid/budget state, and idempotent refresh with the same digest
- [x] Merge Stage 6 to `main` through PR #20
- [x] Verify merged `main` CI: 171/171 unit tests, build, lint/typecheck, 7/7 Playwright smoke tests

Successful Stage 6 acceptance digest:

`DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7`

## Stage 7 — Demo hardening and deployment — CURRENT

- [x] Audit merged Stage 0–6 history and current `main` CI before starting Stage 7
- [ ] Deploy Next.js app to Vercel
- [ ] Configure production environment variables without exposing server secrets
- [ ] Connect the intended Supabase project for the deployed app
- [ ] Verify clean Testnet Treasury/Cap and sufficient SUI + Testnet USDC
- [ ] Create deterministic demo reset/seed procedure
- [ ] Prepare known-good synthetic receipt and budget input
- [ ] Rehearse full deployed flow repeatedly
- [ ] Handle Gemini/Supabase/wallet/Sui failures gracefully
- [ ] Improve loading/error/recovery states found during rehearsal
- [ ] Confirm paid refresh/reconciliation remains idempotent in deployed environment
- [ ] Prepare backup screenshots/video
- [ ] Verify no secrets in repository/history before submission

## Stage 8 — Submission and pitch — NOT STARTED

### Submission

- [ ] Complete final README
- [x] Add real Sui Testnet package/object deployment IDs
- [ ] Add final setup/install instructions
- [ ] Add all team members
- [ ] Confirm every AI development tool declaration
- [ ] Document implemented Gemini product AI
- [ ] Add screenshots + live demo URL
- [ ] Record/upload 3–5 minute YouTube/Loom video
- [ ] Verify public repo + no secrets
- [ ] Submit Devfolio before 5 Sep 2026, 11:59 PM MYT

### Payments & Stablecoins pitch

- [ ] 5-minute script
- [ ] Emphasize real club treasury + stablecoin management/payout
- [x] Real Sui Testnet payout evidence available
- [ ] Prepare Q&A

### AI × Sui pitch

- [ ] 5-minute script
- [ ] Emphasize Gemini budget/receipt understanding
- [ ] Explain deterministic financial checks + why Sui is integral
- [ ] Show AI → human approval → Sui execution
- [ ] Prepare Q&A

## Optional — Only If Core Demo Is Stable

- [ ] zkLogin product polish beyond the verified identity bridge
- [ ] sponsored transactions
- [ ] advanced PTBs
- [ ] Walrus/MemWal
- [ ] multi-signature/dual approval
- [ ] multi-club support
- [ ] notifications
- [ ] advanced analytics/fraud scoring

## Team Rule

If an optional feature risks the core demo, skip it. Every coding agent must show the current stage before coding and update project status + roadmap after work changes.