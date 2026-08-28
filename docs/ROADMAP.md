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

- [x] Scaffold Next.js 16 App Router + React 19 + strict TypeScript
- [x] Use pnpm and commit `pnpm-lock.yaml`
- [x] Pin Node runtime in `.nvmrc` and `.node-version`
- [x] Pin pnpm with `packageManager`
- [x] Configure Tailwind CSS 4 and base app shell
- [x] Add `@mysten/sui` v2 and `@mysten/dapp-kit-react`
- [x] Add Zod + React Hook Form
- [x] Add Vitest + React Testing Library + Playwright
- [x] Add lint/format/typecheck/test/e2e/build scripts
- [x] Create application directory/service boundaries
- [x] Add centralized environment/config validation
- [x] Default application to `AI_MODE=mock`
- [x] Ensure Stage 1 needs no Gemini key and makes no live Gemini calls
- [x] Add `AIService` + deterministic `MockAIService`
- [x] Add Sui/Supabase module boundaries without live business integration
- [x] Add deterministic AI fixtures
- [x] Add integer/minor-unit money helpers
- [x] Add health homepage and `/api/health`
- [x] Add loading/not-found/error boundaries
- [x] Add unit tests and Playwright smoke test
- [x] Add GitHub Actions CI
- [x] CI uses frozen lockfile and mock AI mode without Gemini key
- [x] Verify lint, typecheck, unit tests, build, Chromium install, smoke test
- [x] Update README quick-start

## Stage 2 — Core UI and deterministic domain rules — CURRENT

- [ ] Landing/login shell
- [ ] Treasurer dashboard shell
- [ ] Treasury/event creation UI
- [ ] Budget creation form
- [ ] Editable structured budget preview
- [ ] Claim submission form
- [ ] Claim review/approval UI shell
- [ ] Transaction/history UI shell
- [x] Shared Zod treasury/budget/claim/status schemas
- [x] Positive amount/currency validation
- [x] Safe integer/minor-unit totals
- [x] Budget-total validation
- [x] Category-remaining checks
- [ ] Receipt/request amount comparison
- [ ] Exact/similar duplicate helpers
- [ ] Unit tests for hard financial rules
- [ ] Clearly label all mock/demo data
- [ ] Keep CI green

## Stage 3 — Sui foundation and Move treasury — NOT STARTED

- [x] Select wallet integration approach
- [ ] Connect Sui wallet on Testnet
- [ ] Create Move package structure
- [ ] Design treasury object/state
- [ ] Implement treasurer admin capability
- [ ] Implement deposit/funding flow
- [ ] Implement confirmed category allocation state
- [ ] Implement approved payout flow
- [ ] Re-check category remaining on-chain
- [ ] Emit payout events
- [ ] Add Move tests + transaction error handling
- [ ] Deploy package to Sui Testnet
- [ ] Record real package/object IDs in README

## Stage 4 — Gemini AI layer — NOT STARTED

- [ ] Add official `@google/genai` SDK
- [ ] Add live `GeminiAIService` behind existing `AIService`
- [ ] Define structured budget output
- [ ] Build natural-language budget parser
- [ ] Define structured receipt output
- [ ] Build receipt/image extraction
- [ ] Add category suggestion + concise reasons
- [ ] Validate all model output server-side
- [ ] Enforce `docs/AI_USAGE_POLICY.md`
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
- [ ] Build Sui payout transaction
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
- [ ] Add real Sui Testnet IDs
- [ ] Add final setup/install instructions
- [ ] Add all team members
- [ ] Confirm every AI development tool declaration
- [ ] Document Gemini product AI
- [ ] Add screenshots + live demo URL
- [ ] Record/upload 3–5 minute YouTube/Loom video
- [ ] Verify public repo + no secrets
- [ ] Submit Devfolio before 5 Sep 2026, 11:59 PM MYT

### Payments & Stablecoins pitch

- [ ] 5-minute script
- [ ] Emphasize real club treasury + stablecoin management/payout
- [ ] Show actual Sui transaction
- [ ] Prepare Q&A

### AI × Sui pitch

- [ ] 5-minute script
- [ ] Emphasize Gemini budget/receipt understanding
- [ ] Explain deterministic financial checks + why Sui is integral
- [ ] Show AI -> human approval -> Sui execution
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
