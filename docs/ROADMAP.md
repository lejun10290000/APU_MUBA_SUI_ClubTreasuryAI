# ClubTreasury AI — Hackathon Roadmap

This roadmap follows `docs/DEVELOPMENT_STAGES.md`. Finish demo-critical work before optional features.

## Stage 0 — Planning and repository setup — COMPLETE

- [x] Clean hackathon repository
- [x] README, AGENTS.md, contribution guide, hackathon requirements
- [x] Product specification, architecture, tech stack, demo plan
- [x] Gemini mock-first billing policy
- [x] Staged-development + project-status handoff process
- [ ] Add all official team members

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

## Stage 4 — Gemini AI layer — CURRENT

- [x] Add official `@google/genai` SDK
- [x] Add live `GeminiAIService` behind existing `AIService`
- [x] Define structured budget output
- [x] Build natural-language budget parser
- [x] Define structured receipt output
- [x] Build receipt/image extraction
- [x] Add category suggestion + concise reasons
- [x] Validate all model output server-side
- [x] Enforce `docs/AI_USAGE_POLICY.md`
- [ ] Verify live Gemini with small explicit fixture set only

## Stage 5 — Claim and receipt workflow integration — NOT STARTED

- [ ] Create Supabase migrations
- [ ] Configure private receipt bucket
- [ ] Secure receipt upload + hash receipt bytes
- [ ] Persist claims and AI review results
- [ ] Exact/similar duplicate checks
- [ ] Run mock/live AI through shared adapter
- [ ] Apply deterministic budget checks
- [ ] Return Approve / Review / Reject with understandable reasons
- [ ] Manual Review fallback when AI fails

## Stage 6 — Human approval and on-chain payment — NOT STARTED

- [ ] Real treasurer review with claim data
- [ ] Approve/reject actions + approved-unpaid state
- [ ] Connect claim approval to Sui payout transaction
- [ ] Treasurer wallet signs/confirms
- [ ] Move payout re-checks category budget
- [ ] Execute Testnet USDC payout
- [ ] Handle transaction finality/status
- [ ] Update claim/budget only after success
- [ ] Show transaction digest/explorer link
- [ ] Add idempotent synchronization/retry protection

## Stage 7 — Demo hardening and deployment — NOT STARTED

- [ ] Deploy Next.js app
- [ ] Configure demo Supabase project
- [ ] Prepare Testnet SUI + Testnet USDC
- [ ] Seed clean demo scenario
- [ ] Prepare sample budget + synthetic receipt
- [ ] Rehearse complete flow repeatedly
- [ ] Handle Gemini/wallet/Sui failures gracefully
- [ ] Improve loading/error states
- [ ] Prepare backup screenshots/video
- [ ] Verify no secrets in Git history

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

- [ ] zkLogin
- [ ] sponsored transactions
- [ ] advanced PTBs
- [ ] Walrus/MemWal
- [ ] multi-signature/dual approval
- [ ] multi-club support
- [ ] notifications
- [ ] advanced analytics/fraud scoring

## Team Rule

If an optional feature risks the core demo, skip it. Every coding agent must show the current stage before coding and update project status + roadmap after work changes.
