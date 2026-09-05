# ClubTreasury AI

**AI-powered programmable treasury for university clubs, built on Sui.**

## Submission Links

- **Live demo:** https://apumubasuiclubtreasuryai000.vercel.app
- **Demo video:** https://youtu.be/VLn7P-Cy6tQ
- **Public repository:** https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI

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
2. Create a persisted treasury workspace.
3. Enter a natural-language budget instruction.
4. Gemini generates an editable structured budget draft.
5. Deterministic rules verify the total; the treasurer must explicitly confirm the budget.
6. Activate that workspace on Sui with separate Create → Fund → Allocate wallet-signed transactions.
7. Review member claims with stored receipt evidence, Gemini extraction, and deterministic checks.
8. Approve or reject manually; approval and payment remain separate actions.
9. For an approved claim, review the immutable payout snapshot and explicitly sign the Sui Testnet USDC payout.
10. Wait for verified finality and `PayoutEvent` evidence before the claim becomes Paid.
11. View the final digest, updated balances, and Sui explorer proof.

### Club member workflow

1. Connect a wallet and join an active treasury using its join code.
2. Select a persisted category.
3. Enter reimbursement details and upload private receipt evidence.
4. Submit the claim.
5. Wait for human review and payment result.

The member can submit claims but cannot approve claims or initiate payouts.

## Why Gemini Is Useful

Gemini handles unstructured financial information that deterministic rules alone cannot interpret well:

- natural-language budget instructions;
- multimodal receipt/image extraction;
- merchant/date/amount extraction;
- category suggestion;
- concise review reasons.

Every live model response is validated server-side. Invalid, incomplete, ambiguous, or schema-conflicting model output falls back to human review rather than becoming financial authority. The UI visibly identifies Gemini provider/model/mode and keeps human confirmation explicit.

## Why Sui Is Integral

Sui is the custody and execution layer, not an add-on.

It provides:

- shared `Treasury<Asset>` custody;
- address-owned `TreasurerCap<Asset>` authorization;
- native Circle Sui Testnet USDC;
- category allocation accounting;
- explicit wallet-approved payout;
- typed `PayoutEvent`;
- public transaction evidence.

Before signing, the application also performs a server-authoritative Supabase ↔ Sui consistency check. If the database and on-chain Treasury state do not match, wallet signing is blocked.

## Hackathon Tracks

### Sui Track 01 — Payments & Stablecoins

ClubTreasury AI demonstrates a real stablecoin treasury workflow for university clubs: Sui Testnet USDC custody, category budgeting, reimbursement claims, explicit treasurer-controlled payouts, and public transaction proof.

### Sui Track 02 — AI × Sui

Gemini solves the unstructured financial-understanding problem, deterministic rules and human approval keep the recommendation safe, and Sui is the integral custody and execution layer.

## Judge-facing Architecture

The product consistently exposes these four responsibility boundaries:

- **Gemini AI** — understands unstructured input;
- **Deterministic Rule** — validates hard financial conditions;
- **Human Decision** — confirms budgets and approves/rejects claims;
- **Sui On-chain** — enforces custody and executes the signed payout.

A dedicated `/dashboard/status` view exposes safe readiness information without exposing secrets.

## Verified Production Evidence

### Application

```text
https://apumubasuiclubtreasuryai000.vercel.app
```

### Sui Testnet

```text
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

Payment attempts for this claim:
1 confirmed
```

Detailed evidence: [`docs/STAGE8_A2_LIVE_ACCEPTANCE.md`](docs/STAGE8_A2_LIVE_ACCEPTANCE.md)

### Stage 7C backup rehearsal

```text
Claim:
69a20a42-ae58-4547-b2f5-28bb2de52262

Confirmed digest:
9LToTmV38veaPcGzj9aMopr7Er47R8AwsnmaM6CGPgwL

Payout:
0.10 USDC
```

Detailed evidence: [`docs/STAGE7C_LIVE_REHEARSAL.md`](docs/STAGE7C_LIVE_REHEARSAL.md)

## Safety Model

The payment path is deliberately conservative:

- payout only from immutable human-approved `approved_*` snapshot fields;
- one active payment-attempt boundary;
- Treasury/Cap/network validation;
- Supabase ↔ Sui state comparison before signing;
- explicit human wallet signature;
- signed transaction validation;
- digest persistence before broadcast;
- same-digest reconciliation for interrupted or ambiguous outcomes;
- no blind replacement payment;
- exact `PayoutEvent` verification;
- database budget updates only after verified finality.

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

## Environment Configuration

`.env.example` contains public Testnet identifiers and blank secret placeholders only. Never commit `.env.local`.

Safe/default local mode:

```text
AI_MODE=mock
GEMINI_LIVE_REQUESTS_ENABLED=false
NEXT_PUBLIC_CLAIM_DATA_MODE=mock
NEXT_PUBLIC_SUI_NETWORK=testnet
```

Live production mode requires owner-controlled values:

```text
NEXT_PUBLIC_CLAIM_DATA_MODE=live
NEXT_PUBLIC_SUPABASE_URL=<project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<browser-safe key>
SUPABASE_SECRET_KEY=<server-only>
SUPABASE_RECEIPTS_BUCKET=receipts
AI_MODE=live
GEMINI_LIVE_REQUESTS_ENABLED=true
GEMINI_API_KEY=<server-only>
GEMINI_MODEL=gemini-2.5-flash
```

Never expose Gemini or Supabase server secrets with a `NEXT_PUBLIC_` prefix.

## Latest Product Verification

Latest product-code baseline before the final docs-only submission refresh:

```text
4553857d549151328cf193e3d202f441c0f65bdd
```

This includes PR #37, which made Sui allocation reconciliation compare exact category-reference/amount pairs independent of database row ordering.

GitHub Actions run #249 on that exact product commit:

```text
lint: PASS
typecheck: PASS
unit tests: 75 files / 290 tests PASS
production build: PASS
Playwright smoke/E2E: 10/10 PASS
Vercel deployment status: SUCCESS
```

The Move package remains the previously verified deployment with **31/31 Move tests**.

## Developer Quick Start

Requirements:

- Node.js `24.16.0`
- pnpm `10.15.1`

```bash
git clone https://github.com/lejun10290000/APU_MUBA_SUI_ClubTreasuryAI.git
cd APU_MUBA_SUI_ClubTreasuryAI
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## AI Tools Used

Development AI tools declared for the hackathon:

- **ChatGPT** — ideation, planning, architecture, documentation, implementation/debugging assistance and repository review;
- **OpenAI Codex** — coding assistance, implementation, debugging, repository work and verification.

Product AI:

- **Google Gemini Developer API** — natural-language budget parsing and receipt/image analysis.

Every teammate must declare any additional AI tool they personally used before final submission.

## Team Members

| Name | Role | University | GitHub |
| --- | --- | --- | --- |
| **CHUA LE JUN** | Developer | UTM Kuala Lumpur | [`lejun10290000`](https://github.com/lejun10290000) |
| **LE YONG XIANG** | Developer | UTM Kuala Lumpur | [`yx-le`](https://github.com/yx-le) |
| **LAI YAN QI** | Presenter | UTM Kuala Lumpur | [`YANKEY-CODE`](https://github.com/YANKEY-CODE) |

## Demo Video

**YouTube demo:** https://youtu.be/VLn7P-Cy6tQ

The final submission video demonstrates the live treasury workflow, Gemini-assisted budget/receipt understanding, deterministic checks, human approval, wallet-signed Sui Testnet execution, and on-chain proof.

## Limitations / Future Work

The hackathon MVP deliberately focuses on a safe, auditable core. Post-hackathon opportunities include:

- zkLogin and smoother identity onboarding;
- sponsored transactions;
- multi-signature / dual approval;
- richer multi-club administration;
- notifications;
- advanced analytics and fraud scoring;
- Walrus/MemWal integrations.

## Important Documentation

- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)
- [`docs/ROADMAP.md`](docs/ROADMAP.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/STAGE8_A2_LIVE_ACCEPTANCE.md`](docs/STAGE8_A2_LIVE_ACCEPTANCE.md)
- [`docs/STAGE7C_LIVE_REHEARSAL.md`](docs/STAGE7C_LIVE_REHEARSAL.md)
- [`docs/STAGE8_SUBMISSION_PACKAGE.md`](docs/STAGE8_SUBMISSION_PACKAGE.md)

## Security

Never commit `.env` files, Gemini API keys, Supabase server secrets, wallet private keys, seed phrases, passwords/tokens, or private receipt URLs/content. Public Sui Testnet object IDs and transaction digests are intentionally safe to document.
