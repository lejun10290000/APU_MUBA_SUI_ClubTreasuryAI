# ClubTreasury AI — AI Usage and Billing Policy

This document defines when development should use **mock AI responses** and when it is appropriate to call the **live Gemini API**.

The objective is simple: keep normal development deterministic and cheap, and reserve live AI calls for the small number of situations where real model behavior must be validated or demonstrated.

## Final provider

- Provider: **Google Gemini Developer API**
- JavaScript SDK: **`@google/genai` `2.19.0`**
- Default model for the MVP: **`gemini-2.5-flash`**
- Primary tasks: natural-language budget parsing and receipt/image information extraction

`gemini-2.5-flash` is selected because it supports multimodal inputs and is appropriate for fast structured extraction while also having a free tier subject to Google account/model limits.

## Mandatory default mode

The application must default to:

```text
AI_MODE=mock
```

Mock mode must never call Gemini.

A developer must deliberately change the environment to:

```text
AI_MODE=live
GEMINI_LIVE_REQUESTS_ENABLED=true
```

and provide a valid server-side `GEMINI_API_KEY` before live Gemini requests are allowed. Selecting live mode alone never permits a request.

If `AI_MODE` is absent or invalid, treat it as `mock` or fail safely during configuration validation. Do not silently switch to live mode.

## When to use MOCK responses

Use mock AI by default for:

- UI development
- frontend styling
- dashboard development
- forms and navigation
- unit tests
- component tests
- Playwright tests unless a dedicated live-integration test is explicitly invoked
- GitHub Actions CI
- Supabase development
- Sui wallet development
- Move smart-contract development
- transaction-state UI
- error-state development
- repeated local testing
- most demo rehearsals
- teammate development when AI quality is not the subject being tested

Mock responses must be realistic, deterministic, schema-valid, and clearly stored as fixtures/test data.

Recommended fixtures include:

- valid budget instruction
- malformed/ambiguous budget instruction
- valid marketing receipt
- amount mismatch
- over-budget claim
- duplicate receipt
- unclear receipt requiring `Review`

## When LIVE Gemini is allowed

Use the live API only when one of these is true:

1. validating that the Gemini request/response integration works
2. checking real budget-parsing quality against a small fixture set
3. checking receipt/image extraction quality against synthetic/sample receipts
4. validating Structured Output/schema behavior
5. testing model failure/fallback behavior deliberately
6. recording the official demo video when a real AI response is useful
7. running the final live hackathon demo
8. performing a small final regression check before submission

Do not use live Gemini simply because it is available.

## Billing and usage guardrails

Implementation should include these safeguards:

- `AI_MODE=mock` is the committed/default configuration.
- `GEMINI_API_KEY` is server-only and never uses a `NEXT_PUBLIC_` prefix.
- CI must force mock mode and must not require a Gemini key.
- automated unit tests must never call Gemini.
- normal Playwright tests must use mocks.
- live integration tests must be explicitly named/run separately.
- avoid retries that can create repeated API charges; use a small bounded retry policy only for transient failures.
- do not automatically re-run live analysis when a page refreshes or React re-renders.
- cache/store the structured result for a submitted claim so the same receipt is not repeatedly analyzed without user intent.
- provide a visible `Analyze with Gemini` action in development/live workflow rather than making calls on every field change.
- use synthetic/sample receipts during development rather than real personal receipts.
- do not enable Search grounding; ClubTreasury AI does not need it for the MVP.

Google controls free-tier and paid-tier limits. The application cannot guarantee zero billing if a paid Gemini project/key is used in live mode, so developers must also review their Google AI billing/project settings.

## Required environment variables

```text
AI_MODE=mock
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Optional application guardrail:

```text
GEMINI_LIVE_REQUESTS_ENABLED=false
```

Recommended behavior:

- `AI_MODE=mock` -> always use fixtures, regardless of API key presence.
- `AI_MODE=live` + `GEMINI_LIVE_REQUESTS_ENABLED=false` -> reject live AI request with a clear developer message.
- `AI_MODE=live` + live requests enabled + missing key -> fail safely; do not use mock silently unless the user explicitly selects fallback.
- live API error during a claim -> return a manual `Review` state instead of approving/rejecting automatically.

## Adapter design

The code should expose one application-facing interface and two implementations:

```text
AIService
  |- MockAIService
  `- GeminiAIService
```

Both must return the same Zod-validated schemas.

This prevents UI/business logic from depending directly on Gemini and lets developers switch between mock and live modes without changing product code.

## Current Stage 4 implementation status

- `GeminiAIService` is implemented with lazy SDK/client construction.
- Budget parsing requests JSON structured output in USDC integer application minor units.
- Receipt extraction accepts explicit bounded JPEG/PNG/WebP base64 and does not read or persist local files.
- Model JSON is independently validated with Zod before return.
- Provider/config/output failures are normalized without exposing keys, prompts, or image payloads.
- Automated tests inject fake clients and make zero Gemini calls.
- Owner-controlled live budget and synthetic receipt validation is still pending, so Stage 4 remains CURRENT.

The application does not retry live requests automatically. It does not enable tools, Search grounding, agents, RAG, or provider-side financial actions.

## Gemini responsibilities

Gemini may:

- interpret a natural-language budget instruction
- extract merchant/date/amount/description from a receipt image
- suggest a budget category
- highlight ambiguous or suspicious evidence
- produce concise human-readable reasons

Gemini must not be the authoritative source for:

- arithmetic
- remaining-budget calculations
- category-limit enforcement
- duplicate hash matching
- final payout authorization
- wallet signing
- Sui transaction execution

Those responsibilities remain deterministic TypeScript, human approval, and Move/Sui.

## Demo policy

For normal rehearsals, use mock AI so the flow is stable and repeatable.

Before the hackathon, verify live Gemini separately with the exact demo fixtures. During the official live demo, live Gemini may be used if connectivity and quota are healthy. Keep a clearly disclosed fallback/backup path available so an external AI outage does not destroy the entire presentation.

Never claim a mock response is a live Gemini result.

## Privacy

Raw receipts can contain personal information. Keep them off-chain and private. Prefer synthetic receipts for development and model testing. Do not put Gemini API keys, real receipt URLs, or sensitive receipt content in GitHub commits/issues/PRs.

## Documentation rule

If the AI provider, model, mock/live behavior, or billing guardrails change, update all affected documentation and `.env.example` in the same PR.
