# ClubTreasury AI — Hackathon Roadmap

This roadmap follows `docs/DEVELOPMENT_STAGES.md`. Core product scope is frozen; Stage 8 is submission and presentation work.

## Stage 0 — Planning and repository setup — COMPLETE

- [x] Repository, docs, contribution guide and hackathon requirements
- [x] Product specification, architecture, tech stack and demo plan
- [x] Staged-development + project-status handoff process
- [x] Official team recorded

## Stage 1 — Application foundation — COMPLETE

- [x] Next.js / React / strict TypeScript
- [x] Tailwind, Zod, React Hook Form, Sui SDK/dApp Kit
- [x] Vitest, React Testing Library, Playwright, CI
- [x] Environment validation and mock-first AI boundary

## Stage 2 — Core UI and deterministic domain rules — COMPLETE

- [x] Treasury/event, budget, claim, review and history UI
- [x] Integer/minor-unit financial rules
- [x] Budget/category checks
- [x] Receipt/request comparison and duplicate helpers
- [x] Advisory recommendation + human decision flow

## Stage 3 — Sui foundation and Move treasury — COMPLETE

- [x] Sui Testnet wallet connection and network guard
- [x] Move Treasury/TreasurerCap implementation
- [x] Category allocation enforcement and typed payout event
- [x] Native Circle Testnet USDC
- [x] 31/31 Move tests
- [x] Testnet deployment evidence recorded

## Stage 4 — Gemini AI layer — COMPLETE

- [x] Official `@google/genai` adapter
- [x] Natural-language budget parsing
- [x] Multimodal receipt/image extraction
- [x] Structured/Zod-validated outputs
- [x] Category suggestion and concise reasons
- [x] Live Gemini explicitly configured; CI remains mock-first

## Stage 5 — Claim and receipt workflow integration — COMPLETE

- [x] Supabase migrations and private receipt storage
- [x] Secure receipt upload + hashing
- [x] Persisted treasury/category/claim/AI evidence
- [x] Deterministic amount/duplicate/budget checks
- [x] Human review fallback and immutable approved snapshot

## Stage 6 — Human approval and on-chain payment — COMPLETE

- [x] Payout only from immutable approved snapshot
- [x] Explicit treasurer wallet signature
- [x] One active payment-attempt boundary
- [x] Digest persistence before broadcast
- [x] Exact signed transaction + `PayoutEvent` verification
- [x] Same-digest reconciliation / no blind replacement signing
- [x] Paid/budget updates only after verified finality

## Stage 7 — Demo hardening and deployment — COMPLETE

- [x] Vercel production deployment
- [x] Live Supabase claim/payment workflow
- [x] Supabase ↔ Sui pre-sign consistency checks
- [x] Full deployed Stage 7C rehearsal with one confirmed 0.10 USDC payout
- [x] Recovery/idempotency hardening
- [x] Public Sui proof and backup evidence

Successful Stage 7C rehearsal digest:

```text
9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL
```

## Stage 8 — Submission and pitch — CURRENT

### 8A — Submission package — COMPLETE

- [x] Persisted Treasury → Budget → Claims continuity
- [x] Member join-code claim path
- [x] Per-workspace Sui Create → Fund → Allocate activation
- [x] Verified Treasury/TreasurerCap relationship
- [x] Approval/payment guards for unlinked workspaces
- [x] Live Gemini receipt analysis with deterministic review policy
- [x] Fix production `decide_claim` ambiguity with forward-only migration
- [x] Apply production hotfix without replacing the existing claim
- [x] Resume original Campus Cafe smoke claim
- [x] Verify Approve → `approved_unpaid`
- [x] Verify separate explicit wallet-signed payout
- [x] Verify final claim/payment state becomes `paid`
- [x] Verify exactly one confirmed payment attempt and one digest
- [x] Verify SuiVision/public chain proof for the 0.10 USDC transfer
- [x] Merge Stage 8 judge-facing polish PR #35
- [x] Add natural-language Gemini budget draft UI
- [x] Add visible Gemini provenance / AI audit indicators
- [x] Add AI → Rules → Human → Sui architecture badges
- [x] Improve Sui payout proof links/presentation
- [x] Add `/dashboard/status`
- [x] Add security-boundary regression coverage
- [x] Add final judge golden-path Playwright test
- [x] Merge allocation reconciliation hotfix PR #37
- [x] Verify product baseline `4553857d549151328cf193e3d202f441c0f65bdd`
- [x] Verify GitHub Actions run #249 green
- [x] Verify Vercel deployment success for product baseline
- [x] Refresh final submission documentation
- [x] Promote newest KFC production payout as headline final-demo evidence
- [x] Retain Campus Cafe A2 acceptance as historical technical verification

Latest final-demo transaction:

```text
Claim:
eeb68898-0e97-42a2-8915-09fb979216f6

Merchant:
KFC

Category:
food

Payout:
0.10 USDC

Confirmed digest:
9S7gWEcZ4L2cKUt9n89KVsm5NTi4uoRoaSNUzxDiiKCm

Final state:
paid / paid

Payment attempt:
1 confirmed
```

Historical Stage 8 A2 acceptance remains documented separately:

```text
Claim:
32c289f3-c1b6-4cf8-a6fb-ca49e1ad340a

Merchant:
Campus Cafe

Payout:
0.10 USDC

Confirmed digest:
ASxHXkS2N31rzFY2XP7NpQXGdWtTicPxVrGW7EojpyWm
```

See [`STAGE8_A2_LIVE_ACCEPTANCE.md`](STAGE8_A2_LIVE_ACCEPTANCE.md).

### 8B — Demo video — COMPLETE

- [x] Finalize 3–5 minute script/storyboard
- [x] Capture safe production screenshots/video
- [x] Render final narrated MP4
- [x] Upload final video to YouTube
- [x] Add public video URL to README and submission package

Final video:

```text
https://youtu.be/VLn7P-Cy6tQ
```

### 8C — Pitch — NEXT

#### Payments & Stablecoins

- [ ] Finalize 5-minute pitch
- [x] Real Sui Testnet payout evidence available
- [ ] Prepare Q&A

#### AI × Sui

- [ ] Finalize 5-minute pitch
- [x] Gemini budget and receipt understanding implemented
- [x] Deterministic financial checks clearly separated from AI
- [x] Human approval and explicit wallet signature clearly separated
- [x] Sui execution/public proof clearly surfaced
- [ ] Prepare Q&A

### 8D — Final submission — IN PROGRESS

- [x] Devfolio-ready field copy prepared
- [x] Public repository link prepared
- [x] Production demo link prepared
- [x] Video link added to repository docs
- [x] AI tools declaration prepared
- [x] Sui Track 01 explanation prepared
- [x] Sui Track 02 explanation prepared
- [x] Latest final-demo payout evidence prepared
- [ ] confirm no teammate used any additional undeclared AI tool
- [ ] verify YouTube video playback in incognito/private browser
- [ ] choose/upload final Devfolio screenshots
- [ ] select intended Sui tracks on Devfolio
- [ ] paste/review Devfolio fields
- [ ] click Publish Project before **5 Sep 2026, 11:59 PM MYT**
- [ ] save submission confirmation/evidence

## Official Team

| Name | Role | University | GitHub |
| --- | --- | --- | --- |
| CHUA LE JUN | Developer | UTM Kuala Lumpur | `lejun10290000` |
| LE YONG XIANG | Developer | UTM Kuala Lumpur | `yx-le` |
| LAI YAN QI | Presenter | UTM Kuala Lumpur | `YANKEY-CODE` |

## Scope Rule

Do not add optional features before submission unless explicitly required. The core live demo is accepted; prioritize Devfolio submission evidence, pitch, and Q&A.
