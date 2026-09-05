# Stage 8 A2 Live Acceptance

Date: **5 September 2026 (MYT)**

This document records the final production acceptance evidence for the Stage 8 A2 live treasury/claim/payout workflow.

## Production environment

- Application: `https://apumubasuiclubtreasuryai000.vercel.app`
- Supabase production project ref: `arldlnqiywhcuungvgei`
- Sui network: **Testnet**

## `decide_claim` hotfix

The production database contains migration:

```text
20260905070013 stage8_a2_decide_claim_ambiguity_hotfix
```

The deployed `public.decide_claim(uuid, public.claim_decision, text)` function now uses `linked_treasury_object_id` for the linked Sui Treasury value. The previous ambiguous `treasury_object_id = treasury_object_id` assignment is no longer present.

This was a forward-only function replacement. Existing claims, treasuries, categories, and payment records were preserved.

## Successful Campus Cafe smoke claim

The original live smoke workflow was resumed after the hotfix rather than creating a replacement claim.

```text
Claim ID:
32c289f3-c1b6-4cf8-a6fb-ca49e1ad340a

Merchant:
Campus Cafe

Approved category:
food

Payout:
0.10 USDC

Recipient:
0x6b5ccd6b9abe76887fd93bdf04659cbbe32c42c3e9c308a240963df0cd4e2560

Treasury:
0x403e3e172e17201c8b940672fbf9b980fb094b36e9a68ffe569b00e84e7e2737

Final claim status:
paid

Final payment status:
paid

Confirmed transaction digest:
ASxHXkS2N31rzFY2XP7NpQXGdWtTicPxVrGW7EojpyWm
```

Exactly one payment attempt exists for this claim:

```text
Payment attempt ID:
9f5794fd-b58d-4ab0-a007-dc7b127c660d

Status:
confirmed

Transaction digest:
ASxHXkS2N31rzFY2XP7NpQXGdWtTicPxVrGW7EojpyWm
```

This confirms the intended separation:

```text
Gemini receipt understanding
        ↓
Deterministic evidence/budget checks
        ↓
Human treasurer approval
        ↓
approved_unpaid
        ↓
Explicit wallet signature
        ↓
Sui Testnet payout
        ↓
Finality + PayoutEvent reconciliation
        ↓
paid
```

## Judge-facing Stage 8 polish

PR #35 added and merged:

- natural-language Gemini budget drafts with editable human confirmation;
- visible Gemini provenance / AI audit indicators;
- stronger Sui payment proof presentation and explorer links;
- consistent `Gemini AI → Deterministic Rule → Human Decision → Sui On-chain` badges;
- `/dashboard/status` readiness view without exposing secrets;
- security-boundary regression tests;
- a final Playwright judge golden-path test.

PR #35 merge commit:

```text
24255152976109a8f55399bf791e7a8768c5bacb
```

Post-merge `main` CI run #244 passed lint, typecheck, unit tests, production build, and Playwright smoke/E2E.

## Safety conclusion

The accepted flow preserves the project safety model:

- Gemini is advisory only;
- deterministic rules remain authoritative for hard financial checks;
- the member cannot approve or pay;
- human approval and payment are separate actions;
- the payout uses the immutable approved snapshot;
- wallet signing is explicit;
- one active payment attempt is used;
- the database marks the claim paid only after verified Sui finality/evidence.
