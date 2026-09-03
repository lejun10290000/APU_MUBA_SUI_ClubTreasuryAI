# Stage 8 — Submission Package

This file is the copy-ready source for Devfolio and final hackathon submission materials. Replace only the clearly marked TODO fields before submission.

## Project Name

**ClubTreasury AI**

## One-line Tagline

**AI-powered programmable treasury for university clubs, combining Gemini-assisted financial understanding, human approval, and Sui USDC execution.**

## Short Description

University clubs often manage budgets, reimbursement claims, receipts, and approvals through spreadsheets and chat messages. ClubTreasury AI brings those steps into one auditable workflow: Gemini interprets natural-language budget instructions and receipt evidence, deterministic TypeScript checks hard financial rules, a human treasurer makes the final decision, and a Sui Move treasury enforces category limits and executes approved Testnet USDC payouts.

## Problem

University clubs commonly face:

- fragmented spreadsheets and chat approvals
- slow reimbursement processing
- weak visibility into category spending
- inconsistent budget checks
- duplicate-payment risk
- no trustworthy execution trail

## Solution

ClubTreasury AI creates a single workflow for club treasury management:

1. Treasurer connects a Sui Testnet wallet.
2. Gemini turns natural-language budget instructions into structured categories.
3. Treasurer reviews and confirms allocations.
4. Members submit reimbursement claims and private receipt evidence.
5. Gemini extracts receipt information and suggests a category/review rationale.
6. Deterministic checks validate amount, duplicates, category budget, and evidence.
7. Human treasurer approves or rejects.
8. Approved payout data becomes an immutable snapshot.
9. Server verifies Supabase ↔ Sui Treasury consistency before wallet signing.
10. Treasurer explicitly signs one Sui Testnet USDC payout.
11. Claim/budget state updates only after verified chain finality and exact `PayoutEvent` evidence.

## Why AI

Gemini is useful for unstructured information rather than authoritative financial execution.

Implemented Gemini tasks:

- natural-language budget parsing
- receipt/image extraction
- merchant/date/amount extraction
- category suggestion
- concise review reasons

Every model response is validated. Invalid, ambiguous, or conflicting results fall back to human Review.

AI never authorizes payments, signs transactions, or owns authoritative balances.

## Why Sui

Sui is the custody and execution layer, not a decorative integration.

The Move package provides:

- shared `Treasury<Asset>` custody
- `TreasurerCap<Asset>` authorization
- native Circle Sui Testnet USDC custody
- category allocation accounting
- category and custody sufficiency checks
- explicit wallet-approved payout
- typed `PayoutEvent`
- public transaction proof

The application also performs a pre-sign Supabase ↔ Sui consistency check. A mismatch blocks wallet `sign()` before a payment can be created.

## Production Demo

**Live URL:**

https://apumubasuiclubtreasuryai000.vercel.app

## Public Sui Testnet Evidence

```text
Network:
Sui Testnet

Move package:
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f

Native Circle Testnet USDC:
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC

Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101

Stage 7C confirmed payout digest:
9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL
```

Verified Stage 7C payout:

```text
0.10 USDC
category: events
one total payment attempt
one confirmed payment attempt
zero active payment attempts
final category balance: 0.80 USDC remaining
```

## Tracks

### Sui Track 01 — Payments & Stablecoins

ClubTreasury AI demonstrates a real stablecoin treasury workflow for university clubs: USDC custody, category budgeting, reimbursement claims, human-controlled payouts, and public Sui transaction evidence.

### Sui Track 02 — AI × Sui

Gemini solves the unstructured financial-understanding problem; deterministic rules and human approval make the recommendation safe; Sui is the integral ownership/custody/execution layer.

## Technology

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Sui Move
- Sui Testnet
- native Circle Testnet USDC
- `@mysten/sui`
- `@mysten/dapp-kit-react`
- Google Gemini Developer API / `@google/genai`
- Supabase PostgreSQL/Auth/RLS/private Storage
- Zod
- Vitest / React Testing Library / Playwright
- GitHub Actions
- Vercel

## Verification

Latest Stage 7 merged baseline:

```text
main commit:
4a365c2897991c28a2b411d567ffa69b3b6e1173

GitHub Actions run #140: PASS
lint: PASS
typecheck: PASS
unit tests: 41 files / 201 tests PASS
build: PASS
Playwright smoke: 7/7 PASS
repository/history secret audit: PASS
Move tests: retained verified 31/31
```

## Team

| Name | Role | University | GitHub |
| --- | --- | --- | --- |
| CHUA LE JUN | Developer | UTM Kuala Lumpur | `lejun10290000` |
| LE YONG XIANG | Developer | UTM Kuala Lumpur | `yx-le` |
| LAI YAN QI | Presenter | UTM Kuala Lumpur | `YANKEY-CODE` |

## AI Development Tools Declaration

The team confirmed that **no development AI tools beyond ChatGPT and OpenAI Codex were used**.

Development AI tools used:

- **ChatGPT** — ideation, planning, architecture, documentation, implementation/debugging assistance, repository review
- **OpenAI Codex** — coding assistance, implementation, debugging, repository work and verification

Product AI:

- **Google Gemini Developer API** — natural-language budget parsing and receipt/image analysis

## Suggested Devfolio Highlights

### Innovation

ClubTreasury AI does not let AI control money. It combines AI understanding with deterministic financial rules, human approval, and programmable on-chain enforcement.

### Technical Strength

- real Sui Move custody and Testnet USDC payout
- pre-sign DB↔chain consistency verification
- immutable approved payout snapshots
- exact event/finality verification
- digest-first reconciliation and no blind retry
- private off-chain receipt evidence with RLS
- production-deployed end-to-end rehearsal

### Real-world Relevance

University clubs already operate shared budgets, expense reimbursements, committee approvals, and event spending. The product replaces fragmented manual workflows with a transparent treasury system while keeping a human treasurer in control.

## Suggested 30-second Pitch

> University clubs still manage money through spreadsheets, receipts, and chat approvals. ClubTreasury AI turns that into one safe workflow. Gemini understands budget instructions and receipt evidence, deterministic checks enforce hard financial rules, the treasurer remains the final approver, and Sui Move securely executes the approved USDC payment. We already deployed it on Sui Testnet and verified a real end-to-end payout with duplicate-payment and reconciliation protections.

## Screenshots — TODO for Stage 8B

Recommended final submission screenshots:

1. landing/dashboard overview
2. persisted live Treasury and category balance
3. claim review with AI recommendation + deterministic checks
4. human approval boundary
5. payout Ready state
6. Paid state with confirmed digest
7. Sui explorer transaction/event proof
8. `/api/health` production readiness proof

Do not expose private receipt content unless the receipt is intentionally synthetic and safe.

## Demo Video — TODO for Stage 8B

**Final YouTube/Loom URL:** `TODO`

Requirements:

- 3–5 minutes
- live app/product flow
- show AI understanding
- show human final approval
- show Sui integration
- use existing Stage 7C payout/explorer proof instead of making an unnecessary second payout solely for recording

## Repository

https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI

## Setup

See the root `README.md` for tested Node/pnpm setup and environment configuration.

## Limitations / Future Work

Current MVP deliberately focuses on a safe auditable core. Post-hackathon opportunities include:

- zkLogin/product identity polish
- sponsored transactions
- multi-signature/dual approval
- multi-club support
- notifications
- advanced analytics/fraud scoring
- Walrus/MemWal integrations

## Final Owner Checklist

- [x] confirm all team information is accurate
- [x] confirm every AI development tool used by every teammate is declared
- [ ] add final screenshots
- [ ] add final 3–5 minute YouTube/Loom URL
- [ ] verify live production URL
- [ ] verify public GitHub repository
- [ ] verify no secrets/private receipts are committed
- [ ] select intended hackathon tracks
- [ ] paste/review Devfolio fields
- [ ] submit before **5 September 2026, 11:59 PM MYT**
- [ ] save submission confirmation/evidence
