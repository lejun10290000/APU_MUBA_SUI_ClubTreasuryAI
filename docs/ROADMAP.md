# ClubTreasury AI — Hackathon Roadmap

This roadmap follows `docs/DEVELOPMENT_STAGES.md`. Finish demo-critical work before optional features.

## Stage 0 — Planning and repository setup — COMPLETE

- [x] Clean hackathon repository
- [x] README, AGENTS.md, contribution guide, hackathon requirements
- [x] Product specification, architecture, tech stack, demo plan
- [x] Gemini mock-first billing policy
- [x] Staged-development + project-status handoff process
- [ ] Add all official team members _(Stage 8 submission item)_

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
- [x] Move package/shared treasury/TreasurerCap implementation
- [x] Generic funding custody and category allocation enforcement
- [x] Approved payout flow and typed payout events
- [x] 31/31 Move tests
- [x] Deploy package to Sui Testnet
- [x] Record package/Treasury/Cap evidence
- [x] Use native Circle Testnet USDC

## Stage 4 — Gemini AI layer — COMPLETE

- [x] Official `@google/genai` SDK adapter
- [x] Structured budget and receipt outputs
- [x] Natural-language budget parser
- [x] Receipt/image extraction
- [x] Category suggestion + concise reasons
- [x] Server-side output validation
- [x] Guarded live Gemini acceptance
- [x] Normal CI remains mock-first / zero live spend

## Stage 5 — Claim and receipt workflow integration — COMPLETE

- [x] Supabase migrations and private receipt bucket
- [x] Secure receipt upload + hashing
- [x] Persist treasury/category/claim/AI evidence
- [x] Submission idempotency + exact/similar duplicates
- [x] Deterministic budget/evidence checks
- [x] Human review fallback and persisted final decision
- [x] Immutable `approved_*` unpaid snapshot
- [x] Real Supabase acceptance and advisor review

## Stage 6 — Human approval and on-chain payment — COMPLETE

- [x] Payout only from immutable approved snapshot
- [x] Explicit treasurer wallet signature
- [x] One active payment-attempt boundary
- [x] Digest persistence before broadcast
- [x] Exact signed transaction validation
- [x] Native Testnet USDC payout
- [x] Canonical `PayoutEvent` verification
- [x] Same-digest reconciliation / no blind replacement signing
- [x] Paid/budget updates only after verified finality
- [x] Preserve failed first acceptance as incident evidence
- [x] Fresh aligned live acceptance with exactly one confirmed payout
- [x] Refresh/idempotency proof
- [x] Merge Stage 6 and verify `main` CI

Successful Stage 6 acceptance digest:

`DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7`

## Stage 7 — Demo hardening and deployment — CURRENT

### 7A — Production deployment baseline — COMPLETE

- [x] Deploy Next.js app to Vercel
- [x] Production branch tracks `main`
- [x] Configure production environment variables without exposing server secrets
- [x] Connect the intended Supabase project
- [x] Add cache-disabled Stage 7 health/readiness endpoint
- [x] Verify production `/api/health`
- [x] Document Vercel/Supabase owner-only setup and rollback constraints

### 7B — Repeatable demo preflight + payout safety — COMPLETE

- [x] Deterministic demo reset/preflight runbook
- [x] Read current Sui Treasury before payout signature
- [x] Server-authoritative Supabase ↔ Sui comparison
- [x] Exact Treasury/category/balance consistency checks
- [x] Sufficient-funds check
- [x] Block wallet signing and downstream effects on mismatch
- [x] Regression test proves `sign()` is never called on mismatch
- [x] Preserve Stage 6 finality/reconciliation rules
- [x] Merge through PR #23 and verify merged `main` CI

### 7C — Deployed end-to-end live rehearsal — COMPLETE

- [x] Switch production claims to live Supabase while keeping Gemini mock
- [x] Configure Supabase production Site URL / redirect URLs
- [x] Verify connected Sui Testnet treasurer wallet
- [x] Fix live workspace auth-order deadlock with TDD (PR #24)
- [x] Fix fresh-session canonical wallet identity portability while preserving RLS (PR #25)
- [x] Apply live `stage7c_wallet_principal_portability` migration
- [x] Load persisted clean Treasury and `events` category in production
- [x] Submit a fresh unique synthetic receipt claim
- [x] Persist human approval and immutable 0.10 USDC payout snapshot
- [x] Pass Stage 7B pre-sign Supabase ↔ Sui preflight
- [x] Sign exactly one live Testnet payout
- [x] Confirm exactly one payment attempt and one digest
- [x] Confirm claim becomes `paid`
- [x] Confirm category moves from 0.90 → 0.80 USDC remaining
- [x] Hard refresh preserves same paid state/digest with no Pay button and no new signature

Successful Stage 7C rehearsal digest:

`9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL`

### 7D — Final reliability hardening + readiness — NEXT

- [ ] Rehearse/document likely failure recovery without unnecessary extra payouts
- [ ] Verify wallet disconnect/wrong-network/auth failure recovery
- [ ] Verify Supabase unavailable/error recovery messaging
- [ ] Verify preflight mismatch remains fail-closed in production behavior
- [ ] Verify ambiguous transaction/reconciliation guidance remains clear
- [ ] Review loading/disabled/error states found during live rehearsal
- [ ] Check sufficient Testnet SUI + USDC for official demo
- [ ] Prepare backup screenshots/video/evidence
- [ ] Update README/demo docs with final production path and live evidence
- [ ] Run repository secret/history checks
- [ ] Run final full CI and production health check
- [ ] Complete final Stage 7 readiness audit
- [ ] Mark Stage 7 COMPLETE only after all exit criteria pass

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
