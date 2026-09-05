# Stage 8 — Submission Package

This file is the copy-ready source for Devfolio and final hackathon submission materials.

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
2. Treasurer creates a persisted app treasury and balanced category budget.
3. Gemini turns natural-language budget instructions into structured categories for human confirmation.
4. Members join with a short code and submit reimbursement claims plus private receipt evidence against that same treasury.
5. Gemini extracts receipt information and suggests a category/review rationale.
6. Deterministic checks validate amount, duplicates, category budget, and evidence.
7. Claims can be reviewed while the workspace is off-chain, but approval/payment is blocked until the owner links its own verified Sui Treasury and TreasurerCap.
8. Human treasurer approves or rejects; approved payout data becomes an immutable snapshot.
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

Every model response is validated. Invalid, ambiguous, incomplete, or schema-conflicting results fall back to human Review.

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

The application also performs a pre-sign Supabase ↔ Sui consistency check. A mismatch blocks wallet signing before a payment can be created.

## Submission Links

**Live application:**

https://apumubasuiclubtreasuryai000.vercel.app

**Demo video:**

https://youtu.be/VLn7P-Cy6tQ

**Public repository:**

https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI

## Public Sui Testnet Evidence

```text
Network:
Sui Testnet

Move package:
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f

Native Circle Testnet USDC:
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC
```

### Final Stage 8 A2 live acceptance

```text
Claim:
32c289f3-c1b6-4cf8-a6fb-ca49e1ad340a

Merchant:
Campus Cafe

Payout:
0.10 USDC

Recipient:
0x6b5ccd6b9abe76887fd93bdf04659cbbe32c42c3e9c308a240963df0cd4e2560

Treasury:
0x403e3e172e17201c8b940672fbf9b980fb094b36e9a68ffe569b00e84e7e2737

Confirmed digest:
ASxHXkS2N31rzFY2XP7NpQXGdWtTicPxVrGW7EojpyWm

Final claim/payment state:
paid / paid

Payment attempts:
1 confirmed
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

## Final Product Verification

Latest product-code baseline before this docs-only submission refresh:

```text
main commit:
4553857d549151328cf193e3d202f441c0f65bdd

GitHub Actions run #249: PASS
lint: PASS
typecheck: PASS
unit tests: 75 files / 290 tests PASS
build: PASS
Playwright smoke/E2E: 10/10 PASS
Vercel deployment status: SUCCESS
Move tests: retained verified 31/31
```

## Team

| Name          | Role      | University       | GitHub          |
| ------------- | --------- | ---------------- | --------------- |
| CHUA LE JUN   | Developer | UTM Kuala Lumpur | `lejun10290000` |
| LE YONG XIANG | Developer | UTM Kuala Lumpur | `yx-le`         |
| LAI YAN QI    | Presenter | UTM Kuala Lumpur | `YANKEY-CODE`   |

## AI Development Tools Declaration

Development AI tools used:

- **ChatGPT** — ideation, planning, architecture, documentation, implementation/debugging assistance, repository review
- **OpenAI Codex** — coding assistance, implementation, debugging, repository work and verification

Product AI:

- **Google Gemini Developer API** — natural-language budget parsing and receipt/image analysis

Every teammate must disclose any additional AI tool they personally used before submission.

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
- production-deployed end-to-end acceptance

### Real-world Relevance

University clubs already operate shared budgets, expense reimbursements, committee approvals, and event spending. The product replaces fragmented manual workflows with a transparent treasury system while keeping a human treasurer in control.

## Challenges We Solved

- safely separating AI advice from financial authority
- mapping persistent Supabase treasury data to Sui shared objects and capabilities
- preventing duplicate or blind-retry payouts
- reconciling signed/broadcast transactions by digest
- validating exact `PayoutEvent` evidence before marking claims paid
- handling production database migration drift safely
- fixing allocation reconciliation so exact category-reference/amount pairs are matched independent of database row ordering
- preserving private receipt evidence while allowing short-lived authenticated previews

## Suggested 30-second Pitch

> University clubs still manage money through spreadsheets, receipts, and chat approvals. ClubTreasury AI turns that into one safe workflow. Gemini understands budget instructions and receipt evidence, deterministic checks enforce hard financial rules, the treasurer remains the final approver, and Sui Move securely executes the approved USDC payment. We deployed it on Sui Testnet and verified a real end-to-end payout with duplicate-payment and reconciliation protections.

## Suggested Screenshots

Use 3–5 strong screenshots for Devfolio, with the strongest overview/dashboard image first:

1. live dashboard / treasury overview
2. Gemini claim analysis + deterministic checks
3. human approval boundary / approved-unpaid state
4. confirmed paid state with transaction digest
5. SuiVision USDC balance or event proof

Do not expose private receipt content unless it is synthetic and intentionally safe for submission.

## Demo Video

**Final YouTube URL:** https://youtu.be/VLn7P-Cy6tQ

The video should be checked once in an incognito/private browser before final Devfolio submission to ensure judges can access it without the uploader account.

## Setup

See the root `README.md` for Node/pnpm setup and environment configuration.

## Limitations / Future Work

Current MVP deliberately focuses on a safe auditable core. Post-hackathon opportunities include:

- zkLogin/product identity polish
- sponsored transactions
- multi-signature/dual approval
- richer multi-club administration
- notifications
- advanced analytics/fraud scoring
- Walrus/MemWal integrations

## Final Owner Checklist

- [x] public repository prepared
- [x] source code and commit history available
- [x] README includes problem, solution, Sui, setup, team and AI declaration
- [x] live production URL available
- [x] Sui Testnet package / USDC / payout evidence documented
- [x] final demo video uploaded to YouTube
- [x] final demo video URL added to repository docs
- [x] Track 01 explanation prepared
- [x] Track 02 explanation prepared
- [x] development and product AI tools declared
- [ ] confirm every teammate used no additional undeclared AI tool
- [ ] open video in incognito/private browser and confirm playback
- [ ] choose and upload final Devfolio screenshots
- [ ] select intended Sui tracks on Devfolio
- [ ] paste/review Devfolio project fields
- [ ] click **Publish Project** / confirm submission before **5 September 2026, 11:59 PM MYT**
- [ ] save Devfolio submitted-status screenshot/evidence
