# ClubTreasury AI — Hackathon Roadmap

This roadmap follows `docs/DEVELOPMENT_STAGES.md`. Core product scope is frozen; Stage 8 is submission and presentation work.

## Stage 0 — Planning and repository setup — COMPLETE

- [x] Clean hackathon repository
- [x] README, AGENTS.md, contribution guide, hackathon requirements
- [x] Product specification, architecture, tech stack, demo plan
- [x] Gemini mock-first billing policy
- [x] Staged-development + project-status handoff process
- [x] Add all official team members

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

Successful Stage 6 acceptance digest: `DZtb9Td7nfszbBVWj1QdUqd8peeP3FUm2Q6XJEqvVvb7`

## Stage 7 — Demo hardening and deployment — COMPLETE

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

### 7C — Deployed end-to-end live rehearsal — COMPLETE

- [x] Production live Supabase claim workflow
- [x] Fresh-session canonical wallet identity portability
- [x] Unique synthetic receipt claim
- [x] Human approval + immutable 0.10 USDC payout snapshot
- [x] Stage 7B pre-sign Supabase ↔ Sui preflight
- [x] Exactly one live Testnet payout
- [x] Exactly one payment attempt and one digest
- [x] Claim becomes `paid`
- [x] Category moves 0.90 → 0.80 USDC remaining
- [x] Hard refresh remains idempotently Paid

Successful Stage 7C rehearsal digest: `9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL`

### 7D — Final reliability hardening + readiness — COMPLETE

- [x] Failure/recovery hardening
- [x] Wallet/workspace safe retry UX
- [x] Same-digest reconciliation hardening
- [x] Private receipt-preview recovery
- [x] No-spend backup evidence/runbook
- [x] Sanitized repository/security audit
- [x] 201 unit tests
- [x] 7/7 Playwright smoke
- [x] Exact-head PR #27 CI green
- [x] Owner merge PR #27
- [x] Post-merge `main` CI #140 green

## Stage 8 — Submission and pitch — CURRENT

### 8A — Submission package — IN PROGRESS

- [x] Advance project status to Stage 8
- [x] Add all official team members
- [x] Complete final README
- [x] Real Sui Testnet package/object deployment IDs documented
- [x] Final setup/install instructions reviewed
- [x] Confirm every AI development tool declaration with all teammates — **ChatGPT + OpenAI Codex only**
- [x] Document implemented Gemini product AI for judges
- [x] Add live demo URL + screenshot/video placeholders
- [x] Create copy-ready Devfolio submission package
- [x] Implement local persisted Treasury → Budget → Claims continuity
- [x] Enable authenticated Member join-code claim path
- [x] Block approval/payment/signing until verified Sui link
- [x] Add owner-only verified Treasury/TreasurerCap link step
- [x] Make an existing pre-link claim approvable after verified treasury linking and reload without resubmission
- [x] Pass A1 local lint, typecheck, 232 unit tests, and production build
- [x] Run all 9 Playwright scenarios without assertion failure; Windows cleanup hang remains accurately recorded
- [x] Apply A1 Supabase migration with owner authorization
- [x] Perform controlled production A1 acceptance without payout
- [x] Verify Stage 7C paid evidence remains unchanged after migration
- [x] Professionalize the judging workflow, mobile navigation, and public Sui proof presentation
- [x] Implement A2 per-workspace Create/Fund/Allocate activation with digest-first reconciliation
- [x] Add automatic multi-coin Circle Testnet USDC selection and exact funding
- [x] Restrict join codes to Sui-active workspaces and lock claim recipients to verified wallets
- [x] Resolve payouts from each workspace's immutable TreasurerCap relationship
- [x] Replace sample History with authorized persisted paid claims
- [x] Make production Gemini explicit live-or-manual-review with no mock fallback
- [x] Pass A2 lint, typecheck, 263 tests, build, and 9/9 browser assertions
- [x] Apply A2 migration and deploy the merged A2 flow with owner authorization
- [x] Begin owner-authorized A2 smoke acceptance: activation, member claim, receipt analysis, deterministic checks, and treasurer review reached successfully
- [x] Reproduce the human-approval failure as `column reference "treasury_object_id" is ambiguous` without creating a payout
- [x] Add regression coverage and a forward-only `decide_claim` ambiguity hotfix in PR #33
- [ ] Merge PR #33 after exact-head CI is green
- [ ] Apply `20260905114500_stage8_a2_decide_claim_ambiguity_hotfix.sql` to the production Supabase project
- [ ] Resume the same under-review smoke claim and verify Approve → `approved_unpaid`
- [ ] Verify the separate wallet-signed payout path only after approval is confirmed
- [ ] Verify public repo + no secrets after Stage 8A hotfix merge

### 8B — Demo video — IN PROGRESS

- [x] Finalize 3–5 minute script/storyboard
- [x] Capture safe production screenshots/video
- [x] Show existing Stage 7C payout/explorer proof without unnecessary second payout
- [x] Render final 4:21 narrated MP4 locally
- [ ] Upload the final video to YouTube or Loom
- [ ] Add final video URL to README and submission package

### 8C — Pitch — NOT STARTED

#### Payments & Stablecoins

- [ ] 5-minute script
- [ ] Emphasize real club treasury + stablecoin management/payout
- [x] Real Sui Testnet payout evidence available
- [ ] Prepare Q&A

#### AI × Sui

- [ ] 5-minute script
- [ ] Emphasize Gemini budget/receipt understanding
- [ ] Explain deterministic financial checks + why Sui is integral
- [ ] Show AI → human approval → Sui execution
- [ ] Prepare Q&A

### 8D — Final submission — NOT STARTED

- [ ] Final Devfolio field review
- [ ] Public repository link verified
- [ ] Production demo link verified
- [ ] Video link verified
- [ ] All AI tools declared accurately
- [ ] Select intended tracks
- [ ] Submit before **5 Sep 2026, 11:59 PM MYT**
- [ ] Save submission confirmation/evidence

## Official Team

| Name          | Role      | University       | GitHub          |
| ------------- | --------- | ---------------- | --------------- |
| CHUA LE JUN   | Developer | UTM Kuala Lumpur | `lejun10290000` |
| LE YONG XIANG | Developer | UTM Kuala Lumpur | `yx-le`         |
| LAI YAN QI    | Presenter | UTM Kuala Lumpur | `YANKEY-CODE`   |

## Optional — Only If Core Demo Is Stable

Do not add these before submission unless explicitly required:

- zkLogin product polish
- sponsored transactions
- advanced PTBs
- Walrus/MemWal
- multi-signature/dual approval
- multi-club support
- notifications
- advanced analytics/fraud scoring

## Team Rule

If an optional feature risks the core demo or submission deadline, skip it. Stage 8 is packaging and presentation, not feature expansion.
