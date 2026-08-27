# ClubTreasury AI — Hackathon Roadmap

This roadmap follows the official project stages in `docs/DEVELOPMENT_STAGES.md`. Finish each stage's demo-critical work before optional features.

## Stage 0 — Planning and repository setup — COMPLETE

- [x] Create clean hackathon repository
- [x] Add README
- [x] Add AGENTS.md
- [x] Add hackathon requirements
- [x] Add contribution guide
- [x] Add `.gitignore` and `.env.example`
- [x] Add project specification
- [x] Finalize technical stack
- [x] Add architecture documentation
- [x] Add demo plan
- [x] Add project-status/agent handoff process
- [x] Switch AI provider plan to Gemini
- [x] Add mock-first Gemini usage/billing policy
- [x] Add staged-development process
- [ ] Add all official team members

## Stage 1 — Application foundation — CURRENT

- [ ] Scaffold Next.js 16 App Router + React 19 + strict TypeScript
- [ ] Use pnpm and commit `pnpm-lock.yaml`
- [ ] Configure Tailwind CSS 4
- [ ] Add `@mysten/sui` v2 and `@mysten/dapp-kit-react`
- [ ] Add Zod + React Hook Form
- [ ] Add Vitest + React Testing Library + Playwright
- [ ] Add lint/format/typecheck/test/build scripts
- [ ] Create application directory boundaries
- [ ] Add environment validation
- [ ] Default application to `AI_MODE=mock`
- [ ] Add minimal health page/route
- [ ] Add GitHub Actions CI
- [ ] Update README setup instructions

## Stage 2 — Core UI and deterministic domain rules — NOT STARTED

- [ ] Landing/login shell
- [ ] Treasurer dashboard shell
- [ ] Treasury/event creation UI
- [ ] Budget creation interface
- [ ] Editable budget preview
- [ ] Claim submission form
- [ ] Claim review/approval UI shell
- [ ] Transaction/history UI shell
- [ ] Shared Zod schemas
- [ ] Positive amount/currency validation
- [ ] Budget-total validation
- [ ] Category-remaining checks
- [ ] Receipt/request amount comparison
- [ ] Duplicate/similar-claim helpers
- [ ] Unit tests for hard financial rules

## Stage 3 — Sui foundation and Move treasury — NOT STARTED

- [x] Select wallet integration approach
- [ ] Connect Sui wallet on Testnet
- [ ] Create Move package structure
- [ ] Design treasury object/state
- [ ] Implement treasurer admin capability
- [ ] Implement deposit/funding flow
- [ ] Implement confirmed category allocation state
- [ ] Implement approved payout flow
- [ ] Re-check remaining category amount on-chain
- [ ] Emit payout events
- [ ] Add Move tests
- [ ] Add transaction error handling
- [ ] Deploy package to Sui Testnet
- [ ] Record real package/object IDs in README

## Stage 4 — Gemini AI layer — NOT STARTED

- [ ] Add official `@google/genai` SDK
- [ ] Add `AIService` interface
- [ ] Add `MockAIService`
- [ ] Add deterministic AI fixtures
- [ ] Add `GeminiAIService`
- [ ] Define structured budget schema
- [ ] Build natural-language budget parser
- [ ] Define structured receipt schema
- [ ] Build receipt/image extraction
- [ ] Add category suggestion
- [ ] Add concise evidence/recommendation reasons
- [ ] Validate all AI output server-side
- [ ] Enforce `docs/AI_USAGE_POLICY.md`
- [ ] Verify live Gemini only with small explicit fixture set

## Stage 5 — Claim and receipt workflow integration — NOT STARTED

- [ ] Create Supabase migrations
- [ ] Configure private receipt bucket
- [ ] Secure receipt upload
- [ ] Hash receipt bytes
- [ ] Persist claims
- [ ] Persist AI review results
- [ ] Exact duplicate check
- [ ] Similar-claim check
- [ ] Run mock/live AI through shared adapter
- [ ] Apply deterministic budget checks
- [ ] Return Approve / Review / Reject recommendation
- [ ] Show understandable reasons
- [ ] Manual Review fallback when AI fails

## Stage 6 — Human approval and on-chain payment — NOT STARTED

- [ ] Treasurer review screen works with real claim data
- [ ] Approve action
- [ ] Reject action
- [ ] Approved-unpaid state
- [ ] Build Sui payout transaction
- [ ] Treasurer signs/confirms transaction
- [ ] Move payout re-checks category budget
- [ ] Execute Testnet USDC payout
- [ ] Handle transaction finality/status
- [ ] Update claim only after success
- [ ] Update remaining budget only after success
- [ ] Show transaction digest/explorer reference
- [ ] Add idempotent synchronization/retry protection

## Stage 7 — Demo hardening and deployment — NOT STARTED

- [ ] Deploy Next.js app
- [ ] Configure demo Supabase project
- [ ] Prepare Testnet SUI for gas
- [ ] Prepare Testnet USDC
- [ ] Seed clean demo scenario
- [ ] Prepare sample budget instruction
- [ ] Prepare synthetic sample receipt
- [ ] Test complete flow repeatedly
- [ ] Handle Gemini failure gracefully
- [ ] Handle wallet rejection gracefully
- [ ] Handle Sui transaction failure gracefully
- [ ] Improve loading/error states
- [ ] Make demo reliable on presentation laptop
- [ ] Prepare backup screenshots/video
- [ ] Verify no secrets in Git history

## Stage 8 — Submission and pitch — NOT STARTED

### Submission

- [ ] Complete README
- [ ] Add real Sui Testnet IDs
- [ ] Add setup/install instructions
- [ ] Add all team members
- [ ] Confirm declaration of every AI development tool used
- [ ] Document Gemini as product AI provider
- [ ] Add screenshots
- [ ] Add live demo URL
- [ ] Record 3–5 minute demo video
- [ ] Upload YouTube/Loom video
- [ ] Add video link
- [ ] Verify public repository
- [ ] Submit Devfolio before 5 Sep 2026, 11:59 PM MYT

### Payments & Stablecoins pitch

- [ ] 5-minute script
- [ ] Emphasize real club treasury workflow
- [ ] Emphasize stablecoin management/payout
- [ ] Show actual Sui transaction
- [ ] Prepare likely Q&A

### AI × Sui pitch

- [ ] 5-minute script
- [ ] Emphasize Gemini budget/receipt understanding
- [ ] Explain deterministic financial checks
- [ ] Explain why Sui is integral
- [ ] Show AI -> human approval -> Sui execution
- [ ] Prepare likely Q&A

## Optional Features — Only If Core Demo Is Stable

- [ ] zkLogin
- [ ] sponsored transactions
- [ ] Programmable Transaction Blocks for more complex actions
- [ ] Walrus/MemWal if it adds real value
- [ ] multi-signature/dual approval
- [ ] multi-club support
- [ ] notifications
- [ ] advanced analytics/fraud scoring

## Team Rule

If an optional feature risks the core demo, skip it. A polished working end-to-end flow is more valuable than many partially working features.

Every coding agent must read `docs/PROJECT_STATUS.md` and `docs/DEVELOPMENT_STAGES.md`, show the current stage before coding, and update project status + roadmap when work changes.