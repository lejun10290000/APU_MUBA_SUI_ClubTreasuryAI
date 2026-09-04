# A1 Workflow Continuity Design

Date: 2026-09-04
Status: Draft for owner review
Branch: `stage8/a1-workflow-continuity`

## Goal

Make the judge-facing product flow coherent without forcing a new Sui on-chain treasury to be created during initial setup.

Target experience:

1. A connected Sui wallet enters the Treasurer workspace.
2. The treasurer creates a treasury (for example `Orientation Night 2026`) and becomes its owner/treasurer.
3. The treasurer creates balanced budget categories (for example Venue, Catering, Marketing, Food).
4. The treasury and categories are persisted in Supabase.
5. Claims immediately use that same treasury and those same categories.
6. The existing two-role entry screen remains.
7. A Member workspace lets a connected wallet join a treasury using a short join code and submit a claim.
8. A treasurer wallet may also submit claims so one wallet can test the full hackathon flow.
9. New treasuries are initially off-chain. They must be linked to their own Sui Treasury before approval can create an immutable payout snapshot and before payout is enabled.
10. Existing Stage 6/7 linked rehearsal treasury and the verified payment-safety pipeline remain intact.

## Why this change is needed

Today Treasury creation and Budget creation use browser-session demo state, while production Claims use persisted Supabase data loaded from the configured rehearsal Treasury. This creates a discontinuity: a judge can create one treasury and categories, then see a different treasury/category set on the Claims page.

The fix is to make Treasury and Budget use the existing live Supabase domain instead of temporary demo-only session state when `NEXT_PUBLIC_CLAIM_DATA_MODE=live`.

## Non-goals

- Do not create a new Sui Treasury automatically during Treasury creation.
- Do not fund a Sui Treasury automatically.
- Do not reuse the Stage 6/7 rehearsal Sui Treasury for newly created app treasuries.
- Do not weaken payment preflight, immutable approved snapshots, finality checks, duplicate-payment protection, or reconciliation behavior.
- Do not require a second wallet just to test the product.
- Do not enable live Gemini requests as part of this change.

## Role model

### Treasurer workspace

A connected and wallet-verified user can:

- create a treasury;
- automatically become owner/treasurer of that treasury;
- define and persist budget categories;
- view claims;
- submit a claim too (hackathon/testing convenience);
- review and reject claims;
- link the treasury to its own Sui Treasury later;
- approve/pay only when the treasury is safely linked.

### Member workspace

A connected and wallet-verified user can:

- enter a treasury join code;
- join that treasury as `member`;
- view that treasury's categories;
- submit a claim;
- view their own claim state.

The existing two-role screen remains a navigation choice, not a security boundary. Server-side wallet identity + Supabase RLS remain authoritative.

## Core workflow

### Treasurer

`Choose Treasurer -> connect/verify wallet -> create treasury -> persist -> build budget -> persist categories -> claims use same treasury -> review -> link to Sui when ready -> approve -> payout`

### Member

`Choose Member -> connect/verify wallet -> enter join code -> membership inserted -> choose joined treasury/category -> submit claim -> treasurer reviews`

### One-wallet judge path

`Treasurer -> create treasury -> build budget -> submit claim from same wallet -> review claim -> demonstrate unlinked payout guard`

This path should work without a second wallet.

## Data model changes

A new Supabase migration is required.

### `treasuries`

Current `sui_treasury_object_id` is required. A1 needs off-chain treasuries, so change it to nullable.

Add:

- `join_code text not null unique`

Rules:

- linked treasury: `sui_treasury_object_id` is a valid `0x` + 64 hex Sui object ID;
- unlinked treasury: `sui_treasury_object_id is null`;
- existing Stage 6/7 treasury keeps its current Sui object ID unchanged;
- existing rows receive a valid join code during migration.

No separate link-status column is required initially; `sui_treasury_object_id is null` is the source of truth.

### `claims`

Current `treasury_object_id` is required at claim submission. To support claims before Sui linking, change it to nullable.

Rules:

- an unlinked treasury may have submitted/under-review/rejected claims with `treasury_object_id = null`;
- an approved payout snapshot must still contain a non-null `approved_treasury_object_id`;
- approval is therefore disabled until the treasury is linked to Sui;
- this preserves the existing immutable approved payout snapshot rather than weakening it.

### Approval safety decision

Although the high-level A1 idea originally described approval before linking, the safe implementation will **not** allow `approved_unpaid` until the treasury is linked.

Reason: the current Stage 6/7 safety model snapshots the exact Sui Treasury object at approval time. Allowing approval without that object would either weaken the snapshot or require a new mutable intermediate payment snapshot. Neither is justified this close to submission.

Therefore:

- submit/review/reject: allowed while unlinked;
- approve: blocked while unlinked;
- payout: blocked while unlinked;
- after link: approve creates the same immutable snapshot used by the existing payout pipeline.

## API design

Add focused live-workspace endpoints.

### `POST /api/treasuries`

Purpose: create a Supabase treasury for the authenticated wallet user.

Input:

- name
- total budget minor units

Server behavior:

1. require authenticated wallet principal;
2. validate name and positive integer minor-unit budget;
3. generate collision-safe `external_reference`;
4. generate collision-safe short join code;
5. insert treasury with `sui_treasury_object_id = null`;
6. insert creator in `treasury_members` with `owner` role (or rely on owner field plus explicit membership for simpler listing);
7. return treasury id, name, budget, join code, and link state.

### `PUT /api/treasuries/:treasuryId/budget`

Purpose: replace the draft category allocation before claims exist.

Input:

- array of category name + allocation minor units

Server behavior:

1. require `can_manage_treasury`;
2. deterministic validation that category allocations are positive and sum exactly to treasury total;
3. reject duplicate normalized names;
4. before any claim exists for the treasury, replace categories atomically;
5. once claims exist, disallow destructive category replacement in this hackathon version;
6. return persisted categories.

A database RPC can be used for atomic category replacement if simpler/safer than multiple client writes.

### `GET /api/treasuries`

Purpose: list treasuries accessible to the authenticated wallet user.

Return:

- treasury id
- name
- total budget
- join code only when user can manage treasury
- Sui link state
- categories summary

### `POST /api/treasuries/join`

Purpose: join a treasury from Member workspace.

Input:

- join code

Server behavior:

1. require authenticated wallet principal;
2. normalize join code;
3. find active treasury;
4. insert/upsert `treasury_members` role `member` without downgrading existing owner/treasurer role;
5. return joined treasury.

### `POST /api/treasuries/:treasuryId/link-sui`

Purpose: persist a Sui Treasury object ID only after owner-controlled verification.

This endpoint is **not** required for the first continuity milestone and should be implemented only after create/budget/claim continuity is green.

It must not accept an arbitrary object ID blindly. Before persistence it must verify that the object exists on Testnet and is compatible with the deployed package/treasurer authorization model.

## UI changes

### Role-selection page

Keep both cards.

Treasurer card:

- remains enabled;
- copy updated from old mock-only wording to live workspace wording.

Member card:

- becomes enabled;
- routes to Member Join / Claim workspace;
- remove `Coming in the claim workflow task` / `NEXT` placeholder.

### Treasury creation

In live mode:

- require wallet connection/verification;
- submit to `POST /api/treasuries`;
- show `Saved workspace` rather than `local preview`;
- after creation route to Budget for that treasury, e.g. `/dashboard/budget?treasury=<id>`.

In mock mode:

- preserve the current session-only fallback for CI/dev where useful.

### Budget page

In live mode:

- require/select a persisted treasury id;
- load current treasury total;
- keep deterministic exact-sum validation;
- persist categories through the budget API;
- after success route to `/dashboard/claims/new?treasury=<id>`.

### Claims page

Remove the assumption that live Claims always use `publicConfig.demoTreasuryObjectId`.

In live mode:

- load accessible treasuries for the connected wallet;
- prefer explicit `?treasury=<id>` from Treasury/Budget flow;
- otherwise show a treasury selector;
- load categories for the selected treasury;
- submit claim using the selected persisted treasury/category;
- allow `treasuryObjectId = null` when the selected treasury is not linked;
- clearly display `Not linked to Sui yet` for unlinked treasuries.

The existing rehearsal treasury still appears as a linked treasury and remains usable.

### Review / payout UI

For an unlinked treasury:

- AI/deterministic claim review still works;
- reject remains available;
- approve shows a clear disabled guard: `Link this treasury to Sui before approval`;
- Pay is never available;
- no transaction builder/signature call may run.

For a linked treasury:

- existing approval and payout flow remains unchanged.

### Member workspace

Add a simple member route, for example `/member` or `/member/join`:

1. wallet connect/verify;
2. join-code field;
3. join success card;
4. continue to claim form with selected treasury;
5. member can later select any treasury they have joined.

## Supabase / RLS changes

Existing RLS already separates `can_access_treasury` and `can_manage_treasury` and supports `owner / treasurer / member` roles.

Required additions/adjustments:

- allow nullable Sui object IDs safely;
- join-code lookup must not expose all treasuries to anonymous/browser users;
- implement join-code resolution through a server endpoint or security-definer RPC that returns only the matching treasury after authentication;
- prevent a join operation from changing an existing owner/treasurer membership to member;
- preserve existing claim access and management policies;
- ensure creator becomes owner/manager immediately.

## Safety invariants

These are release blockers:

1. No new treasury may inherit or silently reuse the Stage 6/7 rehearsal Sui Treasury.
2. `sui_treasury_object_id = null` must disable approval/payout paths that require an immutable Sui snapshot.
3. No wallet signing call can occur for an unlinked treasury.
4. Existing linked claims must continue to pass the Stage 6/7 payment preflight unchanged.
5. No changes may weaken one-active-attempt, same-digest reconciliation, finality verification, exact `PayoutEvent`, or no-blind-retry behavior.
6. Existing rehearsal claim/digest evidence must remain readable and unchanged.
7. Join codes are convenience identifiers, not authorization by themselves; wallet authentication + membership/RLS remain required.
8. AI remains advisory only.

## Compatibility strategy

The migration must preserve current production evidence:

- existing Stage 6/7 treasury row remains linked to its current Sui object;
- existing category IDs/external references remain unchanged;
- existing claims and payment attempts remain unchanged;
- public configuration can retain the rehearsal object ID as a demo fallback/evidence reference, but new claim selection must no longer be hard-coded to it;
- health/deployment behavior remains Stage 7-compatible unless a new readiness field is intentionally added.

## Implementation order

### A1.1 — Persistence continuity

- migration for nullable treasury/claim Sui object fields + join code;
- treasury create API;
- live Treasury UI persists to Supabase;
- live Budget UI persists exact categories;
- Claims loads the exact selected persisted treasury/categories;
- one-wallet treasurer can submit a claim against it;
- unlinked status is visible;
- approval/payout guarded.

Acceptance test:

`Create Orientation Night 2026 -> create Food/Marketing/Venue/Catering -> go to Claims -> exact treasury + categories appear -> submit claim -> review page shows same treasury -> approval disabled because not linked.`

### A1.2 — Member portal

- enable Member card;
- member join-code route/API;
- safe membership upsert;
- member claims against joined treasury;
- treasurer still allowed to submit claims.

Acceptance test:

`Member -> enter join code -> same Orientation Night treasury -> same categories -> submit claim.`

### A1.3 — Sui link step

- owner-only link UI/API;
- validate Sui Treasury + TreasurerCap relationship before persistence;
- after link, allow normal approval snapshot;
- existing Stage 6/7 payout code is reused, not rewritten.

Live-value testing should be owner-controlled. Do not create/fund a new Sui Treasury just for CI.

### A1.4 — Judge/demo hardening

- remove stale `Stage 2 mock` / `Coming next` labels from live paths;
- update README/demo docs to explain persisted app treasury vs Sui-linked treasury;
- update screenshots/video script;
- run full CI + Playwright + payment-safety regressions;
- perform a final read-only secret audit.

## Testing strategy

### Unit tests

- treasury create validation;
- join-code generation/normalization/collision handling;
- budget exact-sum persistence;
- category replacement lock after claims exist;
- accessible treasury selection;
- member join does not downgrade owner/treasurer;
- unlinked claim submission accepted;
- approval blocked while unlinked;
- no signing/preflight client call while unlinked;
- linked rehearsal behavior unchanged.

### API tests

- unauthenticated create/join/list rejected;
- owner can create/manage;
- member can access joined treasury but cannot manage budget;
- claim against inaccessible treasury rejected;
- unlinked treasury cannot prepare payment;
- linked existing treasury still prepares normally.

### E2E

Add a deterministic mock/live-like continuity smoke test without real chain writes:

1. role screen shows both Treasurer and Member;
2. create treasury;
3. balance categories;
4. Claims shows same treasury/categories;
5. submit synthetic claim;
6. review shows unlinked guard;
7. Member join-code path reaches same treasury.

Existing Playwright tests must remain green.

### Live acceptance

Only after all automated checks pass:

- verify production migration;
- create one small throwaway Supabase-only treasury and categories;
- confirm Claims continuity;
- do **not** sign or send a payout for the unlinked treasury;
- separately verify the historical Stage 7C Paid claim still renders with the same digest and no duplicate Pay action.

## Rollback strategy

- all work stays on `stage8/a1-workflow-continuity` until reviewed;
- migration should be additive/nullable and preserve existing linked data;
- do not merge until CI green and owner explicitly approves;
- if continuity changes destabilize payout paths, keep A1 branch unmerged and fall back to the existing verified Stage 7 deployment for submission.

## Documentation updates after implementation

Update:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/PROJECT_STATUS.md`
- `docs/ROADMAP.md`
- `docs/STAGE8_SUBMISSION_PACKAGE.md`
- demo runbook/video script

The final narrative should say:

- app treasury + budget can be created and persisted before Sui linking;
- claims can be collected and reviewed off-chain;
- approval/payment that commits to a payout is blocked until the treasury is linked to its own verified Sui Treasury;
- once linked, the existing human-controlled Sui payout safety pipeline applies.
