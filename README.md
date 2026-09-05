# ClubTreasury AI

**AI-powered programmable treasury for university clubs, built on Sui.**

Live demo: https://apumubasuiclubtreasuryai000.vercel.app

## Problem

University clubs often manage budgets, reimbursement claims, receipts, and approvals through spreadsheets and chat messages. This creates slow reimbursements, weak transparency, duplicate-payment risk, inconsistent budget enforcement, and no trustworthy execution trail.

## Solution

ClubTreasury AI combines AI-assisted financial understanding with deterministic safeguards, human approval, and programmable stablecoin execution on Sui.

```text
Gemini understands budget instructions and receipt evidence
        ↓
Deterministic TypeScript verifies hard financial rules
        ↓
Human treasurer makes the final decision
        ↓
Sui wallet signs explicitly
        ↓
Move enforces custody, category limits, and USDC payout
```

AI is **advisory only**. It does not own authoritative balances, authorize payouts, sign transactions, or move funds.

## What the Product Does

### Treasurer workflow

1. Connect a Sui Testnet wallet.
2. Create a persisted app treasury workspace.
3. Enter natural-language budget instructions.
4. Gemini converts them into structured budget categories.
5. Treasurer reviews and persists the balanced category budget.
6. Collect and review claims against that exact treasury and its categories.
7. Link the workspace to its own verified Sui `Treasury<USDC>` and wallet-owned `TreasurerCap` before approval.
8. Inspect AI recommendation plus deterministic checks.
9. Approve or reject manually; approval stays blocked while the workspace is unlinked.
10. For an approved claim, review the immutable payout snapshot.
11. Explicitly sign one Sui Testnet USDC payout.
12. Wait for verified finality and `PayoutEvent` evidence.
13. View the paid state, updated category balance, digest, and explorer proof.

### Club member workflow

1. Connect a wallet and join a persisted treasury using its short join code.
2. Select that treasury and one of its persisted categories.
3. Enter reimbursement details and upload receipt evidence privately.
4. Submit the claim.
5. Wait for human review and payment result.

Treasury and category budgets persist immediately for operational workflow. Claims and AI-assisted review can happen before chain setup. A payout cannot be approved until the workspace is linked to its own verified Sui Treasury; after linking, the existing human-controlled preflight/finality pipeline applies.

## Why Sui Is Integral

Sui is not an add-on. The Move package is the custody and execution layer.

It provides:

- shared `Treasury<Asset>` custody
- address-owned `TreasurerCap<Asset>` authorization
- native Circle Sui Testnet USDC
- category allocation accounting
- category/custody sufficiency checks
- explicit wallet-approved payout
- typed `PayoutEvent`
- public transaction evidence

The application also performs a server-authoritative **Supabase ↔ Sui pre-sign consistency check**. If the database and on-chain Treasury state do not match, wallet signing is blocked.

## Why Gemini Is Useful

Gemini handles unstructured financial information that is difficult to process with rules alone:

- natural-language budget instructions
- multimodal receipt/image extraction
- merchant/date/amount extraction
- category suggestion
- concise review reasons

Every model response is validated server-side. Invalid, ambiguous, or conflicting evidence falls back to **human Review**.

## Verified Live Demo Evidence

### Production

```text
https://apumubasuiclubtreasuryai000.vercel.app
```

### Sui Testnet

```text
Move package:
0xfbb2f939d484b6179f555a6cef8093faa749001184d84adb980de6d88c0e1d4f

Native Circle Testnet USDC:
0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC

Clean Treasury:
0x9d9a0b5a7d58d4efa77419ba891a442f3ad23610b4c824a2fa67c7893917f0f3

TreasurerCap:
0xe811c873363307958e2fb1e0e644fce8c5cde75f801d89a856722dea02836101
```

### Successful deployed Stage 7C rehearsal

```text
Claim:
69a20a42-ae58-4547-b2f5-28bb2de52262

Payment attempt:
fae3fbfb-0738-47ae-b08b-764601b96ef1

Confirmed digest:
9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL

Payout:
0.10 USDC

Category:
events

Final category state:
1.00 allocated / 0.20 spent / 0.80 remaining USDC
```

Exactly one payment attempt was created and confirmed. A hard refresh preserved the same Paid state/digest, did not show another Pay action, did not request another wallet signature, and did not create a replacement attempt.

Detailed evidence: [`docs/STAGE7C_LIVE_REHEARSAL.md`](docs/STAGE7C_LIVE_REHEARSAL.md)

## Safety Model

The payment path is deliberately conservative:

- payout only from immutable human-approved `approved_*` snapshot fields
- one active payment-attempt boundary
- Treasury/Cap/network validation
- Supabase ↔ Sui state comparison before `sign()`
- explicit human wallet signature
- signed transaction validation
- digest persistence before broadcast
- same-digest reconciliation for interrupted/ambiguous outcomes
- no blind replacement payment after ambiguous/success-shaped chain evidence
- exact `PayoutEvent` verification
- database budget updates only after verified finality

The first failed Stage 6 acceptance is intentionally preserved in [`docs/STAGE6_LIVE_VALIDATION.md`](docs/STAGE6_LIVE_VALIDATION.md) as incident evidence showing how the duplicate-payment defect was found and fixed.

## Architecture

```text
Browser / Sui Wallet
        │
        ├── Next.js UI
        │      ├── budget workflow
        │      ├── claim submission
        │      ├── human review
        │      └── payout/reconciliation UI
        │
        ├── Next.js server routes
        │      ├── deterministic financial checks
        │      ├── Gemini adapter + Zod validation
        │      ├── Supabase repositories / RLS
        │      └── Sui preflight/finality verification
        │
        ├── Supabase
        │      ├── PostgreSQL
        │      ├── Auth + wallet identity bridge
        │      ├── RLS
        │      └── private receipt Storage
        │
        └── Sui Testnet
               ├── Treasury<USDC>
               ├── TreasurerCap<USDC>
               ├── native Testnet USDC
               └── typed PayoutEvent
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the detailed responsibility boundaries.

## Technology Stack

- Next.js 16 App Router
- React 19
- strict TypeScript
- Tailwind CSS 4
- Zod + React Hook Form
- Node.js 24 + pnpm
- Vitest + React Testing Library + Playwright
- Sui Testnet + Move
- `@mysten/sui` `2.27.0`
- `@mysten/dapp-kit-react` `2.1.20`
- native Circle Sui Testnet USDC
- Google Gemini Developer API / `@google/genai` `2.19.0`
- Supabase PostgreSQL/Auth/RLS/private Storage
- GitHub Actions CI
- Vercel

## Developer Quick Start

Requirements:

- Node.js `24.16.0`
- pnpm `10.15.1`

### macOS / Linux

```bash
git clone https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI.git
cd APU_MUBA_SUI_ClubTreasuryAI
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

### Windows PowerShell

```powershell
git clone https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI.git
cd APU_MUBA_SUI_ClubTreasuryAI
Copy-Item .env.example .env.local
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open:

```text
http://localhost:3000
```

Sui Testnet setup/demo page:

```text
http://localhost:3000/dashboard/testnet
```

## Environment Configuration

`.env.example` contains public Testnet identifiers and blank secret placeholders only. Never commit `.env.local`.

Safe/default local mode:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
NEXT_PUBLIC_CLAIM_DATA_MODE=mock
NEXT_PUBLIC_SUI_NETWORK=testnet
```

Live Supabase claim/payment mode requires owner-controlled local/production values:

```text
NEXT_PUBLIC_CLAIM_DATA_MODE=live
NEXT_PUBLIC_SUPABASE_URL=<project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<browser-safe publishable key>
SUPABASE_SECRET_KEY=<server-only secret>
SUPABASE_RECEIPTS_BUCKET=receipts
```

Explicitly approved live Gemini mode:

```text
AI_MODE=live
GEMINI_LIVE_REQUESTS_ENABLED=true
GEMINI_API_KEY=<server-only/local secret>
GEMINI_MODEL=gemini-2.5-flash
```

Never expose Gemini or Supabase server secrets with a `NEXT_PUBLIC_` prefix.

## Verification

Latest merged Stage 7 baseline on `main`:

```text
Stage 7 merge commit:
4a365c2897991c28a2b411d567ffa69b3b6e1173

GitHub Actions:
run #140 — PASS

lint: PASS
typecheck: PASS
unit tests: PASS (41 files / 201 tests)
build: PASS
Playwright smoke: PASS (7/7)
repository/history secret audit: PASS
```

Move package verification remains **31/31 Move tests**, and the deployed Move source has not changed since the verified Stage 3 deployment.

### A1 workflow continuity

The merged A1 workflow adds persisted Treasury → Budget → Claims continuity, member join codes, the unlinked approval/payment guard, and owner-only verified Sui linking.

The owner-authorized A1 Supabase migration and controlled production acceptance completed without a payout. The existing Stage 7C Paid claim and confirmed digest remained unchanged.

### A2-Lite live treasury activation

The A2 branch completes the judge path: a persisted workspace locks its dynamic budget, then the human wallet signs separate Create, exact USDC Fund, and Allocate transactions. Each digest is saved before broadcast and ambiguous outcomes can only reconcile that same digest. Full activation reveals the join code, locks member claims to the verified wallet recipient, and assigns the workspace's own immutable `Treasury<USDC>` + `TreasurerCap<USDC>` pair.

Human approval remains separate from Pay. Payout preparation resolves the Cap from the exact claim workspace, preflight compares Supabase with Sui, and Paid History appears only after confirmed finality. Production Gemini is explicit live-or-manual-review; mock AI is never a hidden live fallback. The A2 migration is not applied and production AI remains `AI_MODE=mock` with `GEMINI_LIVE_REQUESTS_ENABLED=false` until owner-controlled deployment.

## Hackathon Tracks

### Sui Track 01 — Payments & Stablecoins

ClubTreasury AI demonstrates a real stablecoin treasury workflow: USDC custody, category budgets, reimbursement claims, human-controlled payouts, and public Sui transaction evidence.

### Sui Track 02 — AI × Sui

Gemini solves the unstructured-data problem; deterministic rules and human approval keep financial decisions safe; Sui is the integral custody and execution layer.

## AI Tools Used

Development AI tools declared for the hackathon:

- **ChatGPT** — ideation, planning, architecture, documentation, implementation/debugging assistance, repository review
- **OpenAI Codex** — coding assistance, implementation, debugging, repository work and verification

Product AI:

- **Google Gemini Developer API** — natural-language budget parsing and receipt/image analysis

Every teammate must declare any additional AI tool they personally used before final Devfolio submission.

## Team Members

| Name              | Role      | University       | GitHub                                              |
| ----------------- | --------- | ---------------- | --------------------------------------------------- |
| **CHUA LE JUN**   | Developer | UTM Kuala Lumpur | [`lejun10290000`](https://github.com/lejun10290000) |
| **LE YONG XIANG** | Developer | UTM Kuala Lumpur | [`yx-le`](https://github.com/yx-le)                 |
| **LAI YAN QI**    | Presenter | UTM Kuala Lumpur | [`YANKEY-CODE`](https://github.com/YANKEY-CODE)     |

## Demo Video

The final 4:21 narrated demo MP4 has been rendered and visually verified locally. **Stage 8B TODO:** upload it to YouTube or Loom and add the public URL here.

The demo uses the existing verified Stage 7C payout evidence instead of performing an unnecessary second payment solely for recording.

## Limitations / Future Work

The hackathon MVP intentionally prioritizes a safe, auditable core flow. Possible post-hackathon extensions include:

- stronger product identity UX / zkLogin polish
- sponsored transactions
- multi-signature or dual approval
- multi-club support
- notifications
- advanced analytics/fraud scoring
- Walrus/MemWal integrations

These are intentionally outside the submitted core MVP.

## Important Documentation

- [`HACKATHON_REQUIREMENTS.md`](HACKATHON_REQUIREMENTS.md)
- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)
- [`docs/ROADMAP.md`](docs/ROADMAP.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/STAGE7_DEMO_RUNBOOK.md`](docs/STAGE7_DEMO_RUNBOOK.md)
- [`docs/STAGE7_BACKUP_EVIDENCE.md`](docs/STAGE7_BACKUP_EVIDENCE.md)
- [`docs/STAGE7_FINAL_READINESS.md`](docs/STAGE7_FINAL_READINESS.md)
- [`docs/STAGE7C_LIVE_REHEARSAL.md`](docs/STAGE7C_LIVE_REHEARSAL.md)
- [`docs/STAGE8_SUBMISSION_PACKAGE.md`](docs/STAGE8_SUBMISSION_PACKAGE.md)

## Security

Never commit:

- `.env` / `.env.local`
- Gemini API keys
- Supabase server secrets
- wallet private keys
- seed/recovery phrases
- passwords/tokens
- private receipt URLs or sensitive receipt contents

Public Sui Testnet object IDs and transaction digests are intentionally safe to document.
